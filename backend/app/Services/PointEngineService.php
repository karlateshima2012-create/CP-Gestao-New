<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\PointMovement;
use App\Models\PointRequest;
use App\Models\Visit;
use Illuminate\Support\Facades\DB;
use App\Http\Responses\ApiResponse;
use App\Events\VisitRecorded;

class PointEngineService
{
    protected $telegramService;
    protected $pointRequestService;
    protected $planService;
    protected $qrTokenService;

    public function __construct(
        TelegramService $telegramService, 
        PointRequestService $pointRequestService,
        PlanService $planService,
        QrTokenService $qrTokenService
    ) {
        $this->telegramService = $telegramService;
        $this->pointRequestService = $pointRequestService;
        $this->planService = $planService;
        $this->qrTokenService = $qrTokenService;
    }

    public function processEarn($tenant, $device, $customer, $token, array $data)
    {
        $isNew = false;
        if (!$customer) {
            if ($tenant->isLimitReached()) {
                $this->telegramService->sendMessage($tenant->id, "🚫 <b>Limite Atingido!</b> O cadastro de novos clientes foi pausado.");
                return ApiResponse::error('Limite de clientes atingido para esta loja.', 'PLAN_LIMIT_REACHED', 403);
            }
            $isNew = true;
            $customer = Customer::create([
                'tenant_id' => $tenant->id,
                'phone' => $data['phone'],
                'name' => $data['name'] ?? 'Cliente',
                'city' => $data['city'] ?? null,
                'province' => $data['province'] ?? null,
                'address' => $data['address'] ?? null,
                'email' => $data['email'] ?? null,
                'birthday' => $data['birthday'] ?? null,
                'source' => 'terminal',
                'last_activity_at' => now()
            ]);

            $tenant->verifyAndNotifyLimit();

            $pointsToAdd = (int)($data['points'] ?? 1); // We know it's a new customer being created during an earn process
            $newMessage = "✨ <b>Novo Cliente (Terminal)</b>\n"
                        . "👤 <b>Nome:</b> {$customer->name}\n"
                        . "📞 <b>Tel:</b> {$customer->phone}\n"
                        . "💰 <b>Bônus:</b> +{$pointsToAdd} pts";
            
            \App\Jobs\SendTelegramNotificationJob::dispatchSync(
                $tenant->id, 
                $newMessage, 
                'registration'
            );
        }

        if ($token) {
            try {
                $this->qrTokenService->consumeToken($token, $tenant->id);
            } catch (\Throwable $te) {
                if (!auth('sanctum')->check()) {
                    return ApiResponse::error($te->getMessage(), 'TOKEN_ERROR', 400);
                }
            }
        }

        $loyalty = \App\Models\LoyaltySetting::withoutGlobalScopes()->where('tenant_id', $tenant->id)->first();
        $cooldownSeconds = $loyalty->cooldown_seconds ?? (12 * 3600);
        $cooldownHours = round($cooldownSeconds / 3600, 1);
        
        $recentVisit = Visit::withoutGlobalScopes()
            ->where('customer_id', $customer->id)
            ->where('tenant_id', $tenant->id)
            ->where(function($q) {
                // Cooldown now ONLY applies to points already granted (approved).
                // Pending requests do NOT trigger the cooldown, allowing customers to accumulate requests.
                $q->whereIn('status', ['aprovado', 'approved', 'auto_approved'])
                  ->where('points_granted', '>', 0);
            })
            ->where('visit_at', '>=', now()->subSeconds($cooldownSeconds))
            ->first();

        if ($recentVisit) {
            $loyalty = \App\Models\LoyaltySetting::withoutGlobalScopes()->where('tenant_id', $tenant->id)->first();
            $currentLevel = $customer->loyalty_level ?? 1;
            $levelsConfig = $loyalty ? $loyalty->levels_config : null;
            
            $goal = $tenant->points_goal;
            $lvlIdx = max(0, (int)$currentLevel - 1);
            if (is_array($levelsConfig) && isset($levelsConfig[$lvlIdx]) && isset($levelsConfig[$lvlIdx]['goal'])) {
                $goal = (int) $levelsConfig[$lvlIdx]['goal'];
            }

            // Se ele já bateu a meta hoje (< 12h), mostramos a mensagem de sucesso da meta atingida
            if ($customer->points_balance >= $goal) {
                return ApiResponse::ok([
                    'customer_name' => $customer->name,
                    'new_balance' => $customer->points_balance,
                    'points_goal' => $goal,
                    'message' => "🎉 META ATINGIDA! Seu prêmio estará esperando na próxima visita.",
                    'is_reward_ready' => false, // Ainda não pode resgatar (dentro das 12h)
                    'is_goal_reached' => true
                ]);
            }

            $timeMsg = $cooldownHours < 1 ? round($cooldownSeconds / 60) . ' min' : $cooldownHours . 'h';
            return ApiResponse::error("Aguarde {$timeMsg} entre visitas para pontuar novamente.", 'VISIT_COOLDOWN', 429);
        }

        if ($device && $device->mode === 'auto_checkin') {
            $minInterval = $this->planService->getMinCheckinInterval($tenant);
            if ($minInterval > 0) {
                $lastCheckin = PointMovement::where('customer_id', $customer->id)
                    ->where('tenant_id', $tenant->id)
                    ->where('origin', 'auto_checkin')
                    ->where('created_at', '>', now()->subMinutes($minInterval))
                    ->latest()
                    ->first();

                if ($lastCheckin) {
                    return ApiResponse::error('Check-in já realizado hoje!', 'CHECKIN_COOLDOWN', 429);
                }
            }
        }

        $loyalty = \App\Models\LoyaltySetting::withoutGlobalScopes()->where('tenant_id', $tenant->id)->first();
        if (!$loyalty) {
            $loyalty = \App\Models\LoyaltySetting::withoutGlobalScopes()->create(['tenant_id' => $tenant->id]);
            \Illuminate\Support\Facades\Cache::forget("tenant_{$tenant->id}_loyalty_config");
        }
        $levelsConfig = $loyalty->levels_config;
        $currentLevel = $customer->loyalty_level ?? 1;

        if ($isNew && $loyalty->signup_bonus_points > 0) {
            $bonus = $loyalty->signup_bonus_points;
            $bonusRequest = PointRequest::create([
                'tenant_id' => $tenant->id,
                'customer_id' => $customer->id,
                'phone' => $customer->phone,
                'device_id' => $device ? $device->id : null,
                'source' => 'online_qr', 
                'status' => 'pending',
                'requested_points' => $bonus,
                'meta' => ['is_signup_bonus' => true]
            ]);
            
            $this->pointRequestService->applyPoints($bonusRequest);
            $bonusRequest->update(['status' => 'auto_approved', 'approved_at' => now()]);
        }

        $pointsToAdd = ($loyalty->regular_points_per_scan ?? 1); 

        if (is_array($levelsConfig)) {
            $lvlIdx = max(0, (int)$currentLevel - 1);
            if (isset($levelsConfig[$lvlIdx]) && isset($levelsConfig[$lvlIdx]['points_per_visit'])) {
                $pointsToAdd = (int) $levelsConfig[$lvlIdx]['points_per_visit'];
            }
        }

        if (is_array($levelsConfig)) {
            $lvlIdx = max(0, (int)$currentLevel - 1);
            if (isset($levelsConfig[$lvlIdx]) && isset($levelsConfig[$lvlIdx]['goal'])) {
                $currentGoal = (int) $levelsConfig[$lvlIdx]['goal'];
            }
        }

        // TRAVA DE SEGURANÇA: Não permite ultrapassar a meta
        $remainingToGoal = max(0, $currentGoal - $customer->points_balance);
        $pointsToAdd = min($pointsToAdd, $remainingToGoal);

        if ($customer->points_balance >= $currentGoal || $pointsToAdd <= 0) {
            $visit = \App\Models\Visit::create([
                'tenant_id' => $tenant->id,
                'customer_id' => $customer->id,
                'customer_name' => $customer->name,
                'customer_phone' => $customer->phone,
                'visit_at' => now(),
                'origin' => $token ? 'nfc' : ($device ? ($device->mode ?? 'terminal') : 'terminal'),
                'plan_type' => $tenant->plan,
                'status' => 'reward_pending',
                'points_granted' => 0,
                'device_id' => $device ? $device->id : null,
                'is_seen' => false
            ]);

            $customerNameEscaped = \App\Services\TelegramService::escapeMarkdownV2($customer->name);
            $msg = "🏆 *RESGATE PENDENTE* 🏆\n"
                 . "O cliente *{$customerNameEscaped}* já atingiu a meta e aguarda o prêmio\.\n\n"
                 . "Clique abaixo para entregar a recompensa e reiniciar o ciclo:";
                 
            $markup = [
                'inline_keyboard' => [
                    [
                        ['text' => '🎁 ENTREGAR PRÊMIO', 'callback_data' => "redeem_reward:{$customer->id}"]
                    ]
                ]
            ];

            \App\Jobs\SendTelegramNotificationJob::dispatchSync($tenant->id, $msg, 'visit', null, $markup);

            $rewardName = "o prêmio";
            if (is_array($levelsConfig) && isset($levelsConfig[$lvlIdx])) {
                $rewardName = $levelsConfig[$lvlIdx]['reward'] ?? $rewardName;
            }

            return ApiResponse::ok([
                'request_id' => null,
                'customer_name' => $customer->name,
                'points_earned' => 0, 
                'new_balance' => $customer->points_balance,
                'loyalty_level' => $customer->loyalty_level,
                'loyalty_level_name' => $customer->loyalty_level_name,
                'points_goal' => $currentGoal,
                'reward_name' => $rewardName,
                'message' => "🎁 Você tem um prêmio esperando! Informe ao atendente para resgatar e subir para o próximo nível.",
                'auto_approved' => false,
                'is_reward_ready' => true
            ]);
        }

        $isElite = strtolower($tenant->plan) === 'elite';
        $isPro = strtolower($tenant->plan) === 'pro';
        
        $status = $isElite ? 'aprovado' : 'pendente';
        $approvedAt = $isElite ? now() : null;

        $visit_data = [
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
            'customer_name' => $customer->name,
            'customer_phone' => $customer->phone,
            'customer_company' => $customer->company_name,
            'foto_perfil_url' => $customer->foto_perfil_url,
            'visit_at' => now(),
            'origin' => $token ? 'nfc' : ($device ? ($device->mode ?? 'terminal') : 'terminal'),
            'plan_type' => $tenant->plan,
            'status' => $status,
            'points_granted' => $pointsToAdd,
            'approved_at' => $approvedAt,
            'is_seen' => false,
        ];

        try {
            if ($device) {
                $visit_data['device_id'] = $device->id;
            }
            $visit = Visit::create($visit_data);
        } catch (\Exception $de) {
            \Illuminate\Support\Facades\Log::error("EARN_ERROR: Visit creation failed: " . $de->getMessage());
            if (isset($visit_data['device_id'])) {
                unset($visit_data['device_id']);
                $visit = Visit::create($visit_data);
            } else {
                throw $de;
            }
        }

        if ($isElite) {
            $customer->increment('points_balance', $visit->points_granted);
            $customer->increment('attendance_count');
            
            PointMovement::create([
                'tenant_id' => $tenant->id,
                'customer_id' => $customer->id,
                'type' => 'earn',
                'points' => $visit->points_granted,
                'origin' => $visit->origin,
                'description' => 'Pontos creditados automaticamente (Plano Elite)',
                'meta' => ['visit_id' => $visit->id]
            ]);
        }

        $customer->update(['last_activity_at' => now()]);
        $customer = $customer->fresh();

        event(new VisitRecorded($visit, $customer, $tenant, $device, $pointsToAdd, $isElite, $isPro));

        $newBalance = $customer->points_balance;
        $newLevel = (int)($customer->loyalty_level ?? 1);
        
        $rewardName = "o prêmio";
        if (is_array($levelsConfig) && isset($levelsConfig[$lvlIdx])) {
            $currentGoal = (int)($levelsConfig[$lvlIdx]['goal'] ?? $currentGoal);
            $rewardName = $levelsConfig[$lvlIdx]['reward'] ?? $rewardName;
        }

        $canAutoApprove = ($status === 'aprovado' || $status === 'auto_approved');
        $remaining = $currentGoal - $newBalance;

        // Custom messages based on defined rules
        if ($newBalance >= $currentGoal) {
            $msg = $canAutoApprove 
                ? "🎉 META ATINGIDA! Seu prêmio estará esperando na próxima visita."
                : "Solicitação enviada. Se aprovada, você atingirá sua meta!";
        } elseif ($remaining === 1) {
            $msg = $canAutoApprove
                ? "Você está a 1 ponto da meta! Quase lá! 🎯"
                : "Solicitação enviada. Falta apenas 1 ponto para sua meta!";
        } else {
            $msg = ($canAutoApprove ? "✅ +{$pointsToAdd} ponto(s) adicionado(s)." : "Solicitação de ponto enviada.") 
                 . " Saldo: {$newBalance}/{$currentGoal}.";
        }

        return ApiResponse::ok([
            'request_id' => $visit->id,
            'customer_name' => $customer->name,
            'points_earned' => $pointsToAdd, 
            'new_balance' => $newBalance,
            'loyalty_level' => $customer->loyalty_level,
            'loyalty_level_name' => $customer->loyalty_level_name,
            'points_goal' => $currentGoal,
            'reward_name' => $rewardName,
            'remaining' => max(0, $remaining),
            'message' => $msg,
            'auto_approved' => $canAutoApprove,
            'is_reward_ready' => ($newBalance >= $currentGoal && $canAutoApprove)
        ]);
    }

    /**
     * Process a reward redemption from Terminal/Portal.
     */
    public function processRedeem($tenant, $device, $customer, $token)
    {
        $isElite = strtolower($tenant->plan) === 'elite';
        
        $status = $isElite ? 'aprovado' : 'pendente';
        $approvedAt = $isElite ? now() : null;

        $loyalty = \App\Models\LoyaltySetting::withoutGlobalScopes()->where('tenant_id', $tenant->id)->first();
        $currentLevel = $customer->loyalty_level ?? 1;
        $lvlIdx = max(0, (int)$currentLevel - 1);
        $currentGoal = 10;
        if ($loyalty && is_array($loyalty->levels_config) && isset($loyalty->levels_config[$lvlIdx])) {
            $currentGoal = (int)($loyalty->levels_config[$lvlIdx]['goal'] ?? 10);
        }

        return DB::transaction(function () use ($tenant, $device, $customer, $status, $approvedAt, $currentGoal, $isElite) {
            $visit = Visit::create([
                'tenant_id' => $tenant->id,
                'customer_id' => $customer->id,
                'customer_name' => $customer->name,
                'customer_phone' => $customer->phone,
                'customer_company' => $customer->company_name,
                'foto_perfil_url' => $customer->foto_perfil_url,
                'visit_at' => now(),
                'origin' => $device ? ($device->mode ?? 'terminal') : 'terminal',
                'plan_type' => $tenant->plan,
                'status' => $status,
                'points_granted' => 1, // Redemptions usually count as a new visit with 1 point in the new level
                'approved_at' => $approvedAt,
                'is_seen' => false,
                'meta' => [
                    'is_redemption' => true,
                    'goal' => $currentGoal
                ]
            ]);

            if ($isElite) {
                // Apply redemption logic immediately
                $this->pointRequestService->applyPoints($visit);
            }

            // Telegram Notification
            $customerNameEscaped = \App\Services\TelegramService::escapeMarkdownV2($customer->name);
            $msg = $isElite 
                ? "🎁 <b>RESGATE REALIZADO (Elite)</b>\n"
                  . "O cliente <b>{$customerNameEscaped}</b> acabou de resgatar o prêmio e subiu de nível\!"
                : "🎁 <b>SOLICITAÇÃO DE RESGATE</b>\n"
                  . "O cliente <b>{$customerNameEscaped}</b> solicitou o resgate do prêmio\. Aguardando sua aprovação\.";

            \App\Jobs\SendTelegramNotificationJob::dispatchSync($tenant->id, $msg, 'visit');

            return ApiResponse::ok([
                'status' => $status,
                'message' => $isElite ? 'Resgate realizado com sucesso!' : 'Solicitação de resgate enviada! Aguarde a aprovação do lojista.',
                'auto_approved' => $isElite
            ]);
        });
    }
}
