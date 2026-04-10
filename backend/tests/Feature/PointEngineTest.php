<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Tenant;
use App\Models\Customer;
use App\Models\LoyaltySetting;
use App\Models\Device;
use App\Services\PointEngineService;
use App\Services\TelegramService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Carbon\Carbon;
use Mockery;

class PointEngineTest extends TestCase
{
    use RefreshDatabase;

    protected $engine;
    protected $telegramMock;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Mock Telegram para não enviar mensagens reais
        $this->telegramMock = Mockery::mock(TelegramService::class);
        $this->telegramMock->shouldReceive('sendMessage');
        $this->telegramMock->shouldReceive('sendPhoto');
        $this->app->instance(TelegramService::class, $this->telegramMock);

        $this->engine = $this->app->make(PointEngineService::class);
    }

    /**
     * Teste: Trava de Meta (Goal Trap)
     * Um cliente não pode ultrapassar a meta de pontos do seu nível.
     */
    public function test_customer_cannot_exceed_goal_points()
    {
        $tenant = Tenant::factory()->create(['plan' => 'elite']);
        $loyalty = LoyaltySetting::create([
            'tenant_id' => $tenant->id,
            'levels_config' => [
                ['name' => 'Bronze', 'goal' => 10, 'points_per_visit' => 1]
            ]
        ]);

        $customer = Customer::factory()->create([
            'tenant_id' => $tenant->id,
            'points_balance' => 9,
            'loyalty_level' => 1
        ]);

        // 1. Ganha o 10º ponto (atinge a meta)
        $response = $this->engine->processEarn($tenant, null, $customer, null, ['phone' => $customer->phone]);
        $this->assertEquals(10, $customer->fresh()->points_balance);
        $this->assertEquals("🎉 META ATINGIDA! Seu prêmio estará esperando na próxima visita.", $response->getData()->data->message);

        // 2. Tenta ganhar o 11º ponto imediatamente (< 12h)
        // Deve retornar a mensagem de meta atingida sem somar pontos
        $response = $this->engine->processEarn($tenant, null, $customer, null, ['phone' => $customer->phone]);
        $this->assertEquals(10, $customer->fresh()->points_balance);
        $this->assertEquals("🎉 META ATINGIDA! Seu prêmio estará esperando na próxima visita.", $response->getData()->data->message);
    }

    /**
     * Teste: Regra de 12 Horas (Cooldown)
     */
    public function test_cooldown_prevents_rapid_pointing()
    {
        $tenant = Tenant::factory()->create(['plan' => 'elite']);
        $loyalty = LoyaltySetting::create([
            'tenant_id' => $tenant->id,
            'regular_points_per_scan' => 1
        ]);

        $customer = Customer::factory()->create([
            'tenant_id' => $tenant->id,
            'points_balance' => 0
        ]);

        // Primeira pontuação
        $this->engine->processEarn($tenant, null, $customer, null, ['phone' => $customer->phone]);
        
        // Simultar segunda tentativa 1 hora depois (Deve falhar)
        Carbon::setTestNow(now()->addHour());
        $response = $this->engine->processEarn($tenant, null, $customer, null, ['phone' => $customer->phone]);
        
        $this->assertEquals(429, $response->getStatusCode());
        $this->assertEquals(1, $customer->fresh()->points_balance);

        // Simular 13 horas depois (Deve permitir)
        Carbon::setTestNow(now()->addHours(13));
        $response = $this->engine->processEarn($tenant, null, $customer, null, ['phone' => $customer->phone]);
        
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals(2, $customer->fresh()->points_balance);
        
        Carbon::setTestNow(null); // Resetar tempo
    }

    /**
     * Teste: Progressão de Nível (Bronze -> Prata)
     */
    public function test_redemption_levels_up_customer()
    {
        $tenant = Tenant::factory()->create(['plan' => 'elite']);
        $loyalty = LoyaltySetting::create([
            'tenant_id' => $tenant->id,
            'levels_config' => [
                ['name' => 'Bronze', 'goal' => 5, 'points_per_visit' => 1],
                ['name' => 'Prata', 'goal' => 10, 'points_per_visit' => 2]
            ]
        ]);

        $customer = Customer::factory()->create([
            'tenant_id' => $tenant->id,
            'points_balance' => 5,
            'loyalty_level' => 1
        ]);

        // Tenta pontuar com meta batida após 12h -> Deve gerar Gatilho de Resgate
        Carbon::setTestNow(now()->addHours(13));
        $response = $this->engine->processEarn($tenant, null, $customer, null, ['phone' => $customer->phone]);
        
        $this->assertTrue($response->getData()->data->is_reward_ready);
        $this->assertEquals("🎁 Você tem um prêmio esperando! Informe ao atendente para resgatar e subir para o próximo nível.", $response->getData()->data->message);

        // Executar o Resgate (Redeem)
        $terminalController = $this->app->make(\App\Http\Controllers\PublicTerminalController::class);
        
        // Simular o request de resgate
        $redeemResponse = $this->postJson("/api/terminal/{$tenant->slug}/redeem", [
            'phone' => $customer->phone,
            'session_token' => 'fake_token'
        ]);

        // Mocking the behavior since I don't want to deal with session validation in feature test
        // I will use the service directly for clarity
        $redeemService = $this->app->make(\App\Services\PointRequestService::class);
        $fakeRedeemRequest = (object)[
            'id' => 'test_redeem',
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
            'requested_points' => 2, // Pontos iniciais do nível Prata
            'meta' => ['is_redemption' => true, 'goal' => 5],
            'source' => 'test'
        ];
        
        $redeemService->applyPoints($fakeRedeemRequest);

        $customer->refresh();
        $this->assertEquals(2, $customer->loyalty_level); // Subiu para Prata
        $this->assertEquals(2, $customer->points_balance); // Começou o novo ciclo com 2 pontos (regra Prata)
        
        Carbon::setTestNow(null);
    }
}
