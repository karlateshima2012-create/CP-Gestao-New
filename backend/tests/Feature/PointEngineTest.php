<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Customer;
use App\Models\LoyaltySetting;
use App\Models\TenantSetting;
use App\Models\Visit;
use App\Models\PointMovement;
use App\Models\Device;
use App\Jobs\SendTelegramNotificationJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Cache;

/**
 * ================================================
 * SUITE DE TESTES — Motor de Pontuação CP Gestão
 * ================================================
 * Baseado em:
 *   - DOCUMENTACAO_MOTOR_PONTUACAO.md
 *   - SISTEMA ANTIFRAUDE PLANO ELITE.md
 */
class PointEngineTest extends TestCase
{
    use RefreshDatabase;

    // ─── Helpers ──────────────────────────────────────────────────────────

    protected function makeTenant(string $plan = 'elite', int $goal = 10): array
    {
        $tenant = Tenant::factory()->create([
            'plan'        => $plan,
            'status'      => 'active',
            'points_goal' => $goal,
            'slug'        => 'loja-' . uniqid(),
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role'      => 'client',
        ]);

        LoyaltySetting::create([
            'tenant_id'               => $tenant->id,
            'regular_points_per_scan' => 1,
            'signup_bonus_points'     => 1,
            'levels_config'           => [[
                'name'              => 'Bronze',
                'goal'              => $goal,
                'reward'            => 'Sobremesa Grátis',
                'points_per_visit'  => 1,
                'points_per_signup' => 1,
            ]],
        ]);

        TenantSetting::create([
            'tenant_id'        => $tenant->id,
            'telegram_chat_id' => '1280107206',
        ]);

        $device = Device::factory()->create([
            'tenant_id' => $tenant->id,
            'nfc_uid'   => 'devtest' . uniqid(),
            'active'    => true,
        ]);

        $sessionToken = bin2hex(random_bytes(8));
        Cache::put("terminal_session:{$sessionToken}", [
            'tenant_id' => $tenant->id,
            'ip'        => '127.0.0.1',
            'ua'        => 'TestAgent/1.0',
        ], now()->addMinutes(30));

        return [$tenant, $user, $device, $sessionToken];
    }

    protected function makeCustomer(Tenant $tenant, int $balance = 0): Customer
    {
        return Customer::create([
            'tenant_id'        => $tenant->id,
            'name'             => 'Cliente Teste',
            'phone'            => '090' . rand(10000000, 99999999),
            'points_balance'   => $balance,
            'loyalty_level'    => 1,
            'source'           => 'web_portal',
            'last_activity_at' => now()->subDays(2),
        ]);
    }

    protected function postEarn(Tenant $tenant, Device $device, Customer $customer, string $sessionToken): \Illuminate\Testing\TestResponse
    {
        return $this->withHeaders(['User-Agent' => 'TestAgent/1.0'])
            ->postJson("/api/public/terminal/{$tenant->slug}/{$device->nfc_uid}/earn", [
                'phone'         => $customer->phone,
                'session_token' => $sessionToken,
            ]);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BLOCO 1 — PLANO ELITE: AUTO-APROVAÇÃO
    // ═══════════════════════════════════════════════════════════════════════

    /** @test */
    public function elite_earn_auto_approves_and_increments_balance()
    {
        Bus::fake([SendTelegramNotificationJob::class]);
        [$tenant, , $device, $session] = $this->makeTenant('elite', 10);
        $customer = $this->makeCustomer($tenant, 0);

        $res = $this->postEarn($tenant, $device, $customer, $session);

        $res->assertOk()
            ->assertJsonPath('data.auto_approved', true)
            ->assertJsonPath('data.new_balance', 1);

        $this->assertDatabaseHas('visits', [
            'customer_id'    => $customer->id,
            'status'         => 'aprovado',
            'points_granted' => 1,
        ]);

        $this->assertDatabaseHas('point_movements', [
            'customer_id' => $customer->id,
            'type'        => 'earn',
            'points'      => 1,
        ]);
    }

    /** @test */
    public function elite_earn_returns_is_reward_ready_when_hitting_goal()
    {
        Bus::fake([SendTelegramNotificationJob::class]);
        [$tenant, , $device, $session] = $this->makeTenant('elite', 10);
        $customer = $this->makeCustomer($tenant, 9); // 1 ponto para meta

        $res = $this->postEarn($tenant, $device, $customer, $session);

        $res->assertOk()
            ->assertJsonPath('data.auto_approved', true)
            ->assertJsonPath('data.new_balance', 10)
            ->assertJsonPath('data.is_reward_ready', true);

        $msg = strtoupper($res->json('data.message') ?? '');
        $this->assertStringContainsString('META ATINGIDA', $msg,
            'Mensagem deveria conter "META ATINGIDA" ao bater a meta');
    }

    /** @test */
    public function elite_balance_never_exceeds_goal_ceiling_rule()
    {
        Bus::fake([SendTelegramNotificationJob::class]);
        [$tenant, , $device, $session] = $this->makeTenant('elite', 10);

        // Atualiza loyalty para 2 pontos por visita
        LoyaltySetting::where('tenant_id', $tenant->id)->update([
            'levels_config' => json_encode([[
                'name'              => 'Bronze',
                'goal'              => 10,
                'reward'            => 'Brinde',
                'points_per_visit'  => 2,
                'points_per_signup' => 1,
            ]])
        ]);

        $customer = $this->makeCustomer($tenant, 9); // 9 pts, metronome = 10

        $res = $this->postEarn($tenant, $device, $customer, $session);
        $res->assertOk();

        // REGRA DE TETO: nunca passa de 10 mesmo com 2 pts por visita
        $this->assertLessThanOrEqual(10, $res->json('data.new_balance'),
            'REGRA DE TETO: saldo nunca deve ultrapassar a meta');

        $this->assertDatabaseMissing('customers', [
            'id'             => $customer->id,
            'points_balance' => 11,
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BLOCO 2 — COOLDOWN DE 12 HORAS
    // ═══════════════════════════════════════════════════════════════════════

    /** @test */
    public function cooldown_blocks_second_earn_within_12_hours()
    {
        Bus::fake([SendTelegramNotificationJob::class]);
        [$tenant, , $device, $session] = $this->makeTenant('elite', 10);
        $customer = $this->makeCustomer($tenant, 3);

        // Visita aprovada 2h atrás
        Visit::create([
            'tenant_id'      => $tenant->id,
            'customer_id'    => $customer->id,
            'customer_name'  => $customer->name,
            'customer_phone' => $customer->phone,
            'visit_at'       => now()->subHours(2),
            'status'         => 'aprovado',
            'points_granted' => 1,
            'plan_type'      => 'elite',
            'origin'         => 'terminal',
            'is_seen'        => false,
        ]);

        $res = $this->postEarn($tenant, $device, $customer, $session);

        // Deve retornar 429 (cooldown) OU 200 com is_goal_reached se meta atingida
        $this->assertContains($res->status(), [200, 429],
            'Segunda tentativa em < 12h deve retornar 429 ou 200 com is_goal_reached');

        if ($res->status() === 200) {
            $this->assertTrue(
                $res->json('data.is_goal_reached') === true || $res->json('data.is_reward_ready') === true,
                'Se retornar 200 deve ser por meta já atingida'
            );
        }
    }

    /** @test */
    public function cooldown_within_12h_goal_reached_shows_correct_message()
    {
        Bus::fake([SendTelegramNotificationJob::class]);
        [$tenant, , $device, $session] = $this->makeTenant('elite', 10);
        $customer = $this->makeCustomer($tenant, 10); // já na meta

        // Visita de exatamente esta sessão (< 12h)
        Visit::create([
            'tenant_id'      => $tenant->id,
            'customer_id'    => $customer->id,
            'customer_name'  => $customer->name,
            'customer_phone' => $customer->phone,
            'visit_at'       => now()->subHours(2),
            'status'         => 'aprovado',
            'points_granted' => 1,
            'plan_type'      => 'elite',
            'origin'         => 'terminal',
            'is_seen'        => false,
        ]);

        $res = $this->postEarn($tenant, $device, $customer, $session);

        $res->assertOk()
            ->assertJsonPath('data.is_goal_reached', true);

        $msg = strtoupper($res->json('data.message') ?? '');
        $this->assertStringContainsString('META ATINGIDA', $msg,
            'Antes de 12h: mensagem deve ser "🎉 Meta Atingida! Resgate na próxima visita."');
    }

    /** @test */
    public function after_12h_goal_reached_returns_reward_ready()
    {
        Bus::fake([SendTelegramNotificationJob::class]);
        [$tenant, , $device, $session] = $this->makeTenant('elite', 10);
        $customer = $this->makeCustomer($tenant, 10); // meta atingida, sem visita recente

        $res = $this->postEarn($tenant, $device, $customer, $session);

        $res->assertOk()
            ->assertJsonPath('data.is_reward_ready', true);

        $msg = strtolower($res->json('data.message') ?? '');
        $this->assertStringContainsString('prêmio', $msg,
            'Após 12h: mensagem deve informar prêmio disponível');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BLOCO 3 — TRAVA REWARD PENDING
    // ═══════════════════════════════════════════════════════════════════════

    /** @test */
    public function reward_pending_blocks_new_points_and_creates_correct_visit()
    {
        Bus::fake([SendTelegramNotificationJob::class]);
        [$tenant, , $device, $session] = $this->makeTenant('elite', 10);
        $customer = $this->makeCustomer($tenant, 10); // já na meta

        $res = $this->postEarn($tenant, $device, $customer, $session);

        $res->assertOk()
            ->assertJsonPath('data.is_reward_ready', true)
            ->assertJsonPath('data.points_earned', 0);

        // Saldo não muda
        $this->assertDatabaseHas('customers', [
            'id'             => $customer->id,
            'points_balance' => 10,
        ]);

        // Visita criada como reward_pending
        $this->assertDatabaseHas('visits', [
            'customer_id'    => $customer->id,
            'status'         => 'reward_pending',
            'points_granted' => 0,
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BLOCO 4 — PLANO PRO: APROVAÇÃO MANUAL
    // ═══════════════════════════════════════════════════════════════════════

    /** @test */
    public function pro_earn_creates_pending_visit_without_incrementing_balance()
    {
        Bus::fake([SendTelegramNotificationJob::class]);
        [$tenant, , $device, $session] = $this->makeTenant('pro', 10);
        $customer = $this->makeCustomer($tenant, 3);

        $res = $this->postEarn($tenant, $device, $customer, $session);

        $res->assertOk()
            ->assertJsonPath('data.auto_approved', false);

        // Saldo NÃO muda no PRO
        $this->assertDatabaseHas('customers', [
            'id'             => $customer->id,
            'points_balance' => 3,
        ]);

        $this->assertDatabaseHas('visits', [
            'customer_id' => $customer->id,
            'status'      => 'pendente',
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BLOCO 5 — CADASTRO COM BÔNUS
    // ═══════════════════════════════════════════════════════════════════════

    /** @test */
    public function registration_via_terminal_awards_signup_bonus()
    {
        Bus::fake([SendTelegramNotificationJob::class]);
        [$tenant, , $device, $session] = $this->makeTenant('elite', 10);

        $phone = '09011' . rand(100000, 999999);

        $res = $this->withHeaders(['User-Agent' => 'TestAgent/1.0'])
            ->postJson("/api/public/terminal/{$tenant->slug}/{$device->nfc_uid}/register", [
                'phone'         => $phone,
                'name'          => 'Novo Cliente Teste',
                'city'          => 'Tóquio',
                'province'      => 'Tokyo',
                'session_token' => $session,
            ]);

        $res->assertOk();

        $customer = Customer::where('phone', $phone)->where('tenant_id', $tenant->id)->first();
        $this->assertNotNull($customer, 'Cliente deve ser criado após registro');
        $this->assertGreaterThanOrEqual(1, $customer->points_balance,
            'Cliente novo deve receber bônus de cadastro ≥ 1');
    }

    /** @test */
    public function duplicate_phone_registration_is_rejected()
    {
        Bus::fake([SendTelegramNotificationJob::class]);
        [$tenant, , $device, $session] = $this->makeTenant('elite', 10);

        $phone = '09011112222';
        Customer::create([
            'tenant_id'        => $tenant->id,
            'name'             => 'Primeiro Cliente',
            'phone'            => $phone,
            'points_balance'   => 0,
            'loyalty_level'    => 1,
            'source'           => 'web_portal',
            'last_activity_at' => now(),
        ]);

        $res = $this->withHeaders(['User-Agent' => 'TestAgent/1.0'])
            ->postJson("/api/public/terminal/{$tenant->slug}/{$device->nfc_uid}/register", [
                'phone'         => $phone,
                'name'          => 'Segunda Tentativa',
                'city'          => 'Osaka',
                'province'      => 'Osaka',
                'session_token' => $session,
            ]);

        // Deve rejeitar com 409 ou erro DUPLICATE_PHONE
        $this->assertTrue(
            $res->status() === 409 || str_contains(strtoupper($res->content()), 'DUPLICATE'),
            "Registro duplicado deve retornar 409 ou erro DUPLICATE. Status: {$res->status()}, Body: {$res->content()}"
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BLOCO 6 — ANTI-FRAUDE: DUPLA SOLICITAÇÃO
    // ═══════════════════════════════════════════════════════════════════════

    /** @test */
    public function duplicate_earn_within_12h_is_blocked()
    {
        Bus::fake([SendTelegramNotificationJob::class]);
        [$tenant, , $device, $session] = $this->makeTenant('elite', 10);
        $customer = $this->makeCustomer($tenant, 3);

        // Primeira solicitação — deve passar
        $res1 = $this->postEarn($tenant, $device, $customer, $session);
        $res1->assertOk();

        // Segunda sessão logo em seguida
        $session2 = bin2hex(random_bytes(8));
        Cache::put("terminal_session:{$session2}", [
            'tenant_id' => $tenant->id,
            'ip'        => '127.0.0.1',
            'ua'        => 'TestAgent/1.0',
        ], now()->addMinutes(30));

        $res2 = $this->withHeaders(['User-Agent' => 'TestAgent/1.0'])
            ->postJson("/api/public/terminal/{$tenant->slug}/{$device->nfc_uid}/earn", [
                'phone'         => $customer->phone,
                'session_token' => $session2,
            ]);

        $this->assertEquals(429, $res2->status(),
            'ANTIFRAUDE: Segunda solicitação imediata deve retornar 429 (VISIT_COOLDOWN)');
    }

    /** @test */
    public function earn_after_12h_cooldown_is_allowed()
    {
        Bus::fake([SendTelegramNotificationJob::class]);
        [$tenant, , $device, $session] = $this->makeTenant('elite', 10);
        $customer = $this->makeCustomer($tenant, 3);

        // Visita de 13h atrás (fora do cooldown de 12h)
        Visit::create([
            'tenant_id'      => $tenant->id,
            'customer_id'    => $customer->id,
            'customer_name'  => $customer->name,
            'customer_phone' => $customer->phone,
            'visit_at'       => now()->subHours(13),
            'status'         => 'aprovado',
            'points_granted' => 1,
            'plan_type'      => 'elite',
            'origin'         => 'terminal',
            'is_seen'        => false,
        ]);

        $res = $this->postEarn($tenant, $device, $customer, $session);

        $res->assertOk()
            ->assertJsonPath('data.auto_approved', true);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BLOCO 7 — MENSAGENS DO SISTEMA
    // ═══════════════════════════════════════════════════════════════════════

    /** @test */
    public function message_shows_one_point_remaining_near_goal()
    {
        Bus::fake([SendTelegramNotificationJob::class]);
        [$tenant, , $device, $session] = $this->makeTenant('elite', 10);
        $customer = $this->makeCustomer($tenant, 8); // vai para 9, falta 1

        $res = $this->postEarn($tenant, $device, $customer, $session);

        $res->assertOk();
        $msg = strtolower($res->json('data.message') ?? '');
        $this->assertStringContainsString('1 ponto', $msg,
            'Mensagem deve indicar que falta 1 ponto para a meta');
    }

    /** @test */
    public function response_includes_balance_and_goal_fields()
    {
        Bus::fake([SendTelegramNotificationJob::class]);
        [$tenant, , $device, $session] = $this->makeTenant('elite', 10);
        $customer = $this->makeCustomer($tenant, 3);

        $res = $this->postEarn($tenant, $device, $customer, $session);

        $res->assertOk()
            ->assertJsonStructure(['data' => [
                'new_balance', 'points_goal', 'auto_approved', 'message', 'points_earned'
            ]]);

        $this->assertEquals(4, $res->json('data.new_balance'));
        $this->assertEquals(10, $res->json('data.points_goal'));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BLOCO 8 — TENANT INATIVO / BLOQUEADO
    // ═══════════════════════════════════════════════════════════════════════

    /** @test */
    public function blocked_tenant_is_rejected()
    {
        Bus::fake([SendTelegramNotificationJob::class]);
        [$tenant, , $device, $session] = $this->makeTenant('elite', 10);
        $tenant->update(['status' => 'blocked']);
        $customer = $this->makeCustomer($tenant, 3);

        $res = $this->postEarn($tenant, $device, $customer, $session);

        $this->assertContains($res->status(), [403, 404, 410],
            'Tenant bloqueado deve retornar 403/404/410');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BLOCO 9 — CAMPO is_goal_reached vs is_reward_ready
    // ═══════════════════════════════════════════════════════════════════════

    /** @test */
    public function normal_earn_does_not_set_goal_flags()
    {
        Bus::fake([SendTelegramNotificationJob::class]);
        [$tenant, , $device, $session] = $this->makeTenant('elite', 10);
        $customer = $this->makeCustomer($tenant, 2); // vai para 3, longe da meta

        $res = $this->postEarn($tenant, $device, $customer, $session);

        $res->assertOk();
        $data = $res->json('data');

        $this->assertFalse($data['is_reward_ready'] ?? false,
            'Ponto normal não deve ativar is_reward_ready');
    }
}
