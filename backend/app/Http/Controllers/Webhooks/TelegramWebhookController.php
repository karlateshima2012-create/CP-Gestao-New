<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\PointRequest;
use App\Services\PointRequestService;
use App\Services\TelegramService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class TelegramWebhookController extends Controller
{
    protected $pointRequestService;
    protected $telegramService;

    public function __construct(PointRequestService $pointRequestService, TelegramService $telegramService)
    {
        $this->pointRequestService = $pointRequestService;
        $this->telegramService = $telegramService;
    }

    /**
     * Handle incoming Telegram Webhook.
     */
    public function handle(Request $request)
    {
        $update = $request->all();
        Log::info('Incoming Telegram Update', ['payload' => $update]);

        if (isset($update['callback_query'])) {
            return $this->handleCallbackQuery($update['callback_query']);
        }

        if (isset($update['message'])) {
            return $this->handleMessage($update['message']);
        }

        return response()->json(['status' => 'ignored']);
    }

    /**
     * Handle incoming text messages.
     */
    private function handleMessage($message)
    {
        $chatId = $message['chat']['id'];
        $text = $message['text'] ?? '';

        if (strpos($text, '/start') === 0) {
            $escChatId = TelegramService::escapeMarkdownV2((string)$chatId);
            $response = "Olá\! Bem\-vindo ao assistente do *CPgestão Fidelidade* 🚀\.\n\n" .
                        "🆔 Seu Chat ID: `{$escChatId}` \n\n" .
                        "📍 *O que fazer agora?*\n" .
                        "1️⃣ Copie o número acima\.\n" .
                        "2️⃣ Vá até o seu painel em *Gerenciar Dispositivos*\.\n" .
                        "3️⃣ No Totem desejado, cole esse número no campo *ID*\.\n\n" .
                        "Pronto\! Agora você receberá as notificações por aqui\. ⚡";

            $this->telegramService->sendDirectMessage($chatId, $response);
            return response()->json(['status' => 'start_handled']);
        }

        return response()->json(['status' => 'message_ignored']);
    }

    /**
     * Handle Callback Queries (Buttons).
     */
    private function handleCallbackQuery($callbackQuery)
    {
        $callbackQueryId = $callbackQuery['id'];
        $data = $callbackQuery['data'];
        $chatId = $callbackQuery['message']['chat']['id'];
        $messageId = $callbackQuery['message']['message_id'];
        $originalText = $callbackQuery['message']['text'] ?? $callbackQuery['message']['caption'] ?? '';
        
        // Se já tiver "Ponto aprovado" ou similar no texto, evitamos duplicar o histórico se for re-aprovado
        $originalText = preg_replace('/(?i)(Ponto aprovado|SOLICITAÇÃO RECUSADA).*$/s', '', $originalText);
        // Remover a linha de "Visitas" do texto original para não ficar duplicado (já mostramos o novo saldo acima)
        $originalText = preg_replace('/^Visitas:.*$/m', '', $originalText);
        $originalText = preg_replace('/^<b>Visitas:<\/b>.*$/m', '', $originalText);
        $originalText = trim($originalText);

        if (strpos($data, 'approve_visit:') === 0) {
            $visitId = trim(str_replace('approve_visit:', '', $data));
            return $this->processVisit($visitId, 'approved', $chatId, $messageId, $originalText, $callbackQueryId, $callbackQuery);
        }

        if (strpos($data, 'reject_visit:') === 0) {
            $visitId = trim(str_replace('reject_visit:', '', $data));
            return $this->processVisit($visitId, 'denied', $chatId, $messageId, $originalText, $callbackQueryId, $callbackQuery);
        }

        if (strpos($data, 'approve_request:') === 0) {
            $requestId = trim(str_replace('approve_request:', '', $data));
            return $this->processRequest($requestId, 'approved', $chatId, $messageId, $originalText, $callbackQueryId, $callbackQuery);
        }

        if (strpos($data, 'reject_request:') === 0) {
            $requestId = trim(str_replace('reject_request:', '', $data));
            return $this->processRequest($requestId, 'denied', $chatId, $messageId, $originalText, $callbackQueryId, $callbackQuery);
        }

        if ($data === 'already_processed') {
            $this->telegramService->answerCallbackQuery($callbackQueryId, "ℹ️ Já processada.");
            return response()->json(['status' => 'already_processed']);
        }

        if (strpos($data, 'redeem_reward:') === 0) {
            $customerId = str_replace('redeem_reward:', '', $data);
            return $this->handleRedeemReward($customerId, $chatId, $messageId, $callbackQueryId, $callbackQuery);
        }

        return response()->json(['status' => 'data_ignored']);
    }

    /**
     * Process the visit approval or rejection.
     */
    private function processVisit($visitId, $action, $chatId, $messageId, $originalText, $callbackQueryId, $callbackQuery)
    {
        \Illuminate\Support\Facades\Log::info('TelegramWebhook processVisit', [
            'raw_callback_data' => $callbackQuery['data'] ?? 'N/A',
            'extracted_id'      => $visitId,
            'action'            => $action,
            'chat_id'           => $chatId
        ]);

        \Illuminate\Support\Facades\Log::info("TelegramWebhook processVisit attempt", ['id' => $visitId, 'action' => $action]);

        $visit = \App\Models\Visit::withoutGlobalScopes()->where('id', (string)$visitId)->first();

        // Fallback: If not found in visits, search in point_requests (legacy/hybrid support)
        if (!$visit) {
            \Illuminate\Support\Facades\Log::info('TelegramWebhook: Visit not found in visits table, checking point_requests', ['id' => $visitId]);
            $request = \App\Models\PointRequest::withoutGlobalScopes()->where('id', (string)$visitId)->first();
            if ($request) {
                \Illuminate\Support\Facades\Log::info('TelegramWebhook: Found in point_requests, forwarding...', ['id' => $visitId]);
                return $this->processRequest($visitId, $action, $chatId, $messageId, $originalText, $callbackQueryId, $callbackQuery);
            }

            \Illuminate\Support\Facades\Log::error('TelegramWebhook: Record NOT FOUND in ANY table after full check', ['id' => $visitId]);
            $this->telegramService->answerCallbackQuery($callbackQueryId, "❌ Erro: Visita não encontrada (ID: " . substr($visitId, 0, 8) . "...)", true);
            return response()->json(['status' => 'not_found']);
        }

        if ($visit->status !== 'pendente') {
            $statusLabel = $visit->status === 'aprovado' ? 'Aprovada' : 'Recusada';
            $this->telegramService->answerCallbackQuery($callbackQueryId, "ℹ️ Já processada: {$statusLabel}");
            return response()->json(['status' => 'already_processed']);
        }

        // Security check: Validate if the Chat ID is authorized
        $settings = \App\Models\TenantSetting::where('tenant_id', $visit->tenant_id)->first();
        $authorizedId = $settings ? $settings->telegram_chat_id : null;

        if ($authorizedId && (string)$chatId !== (string)$authorizedId) {
            $this->telegramService->answerCallbackQuery($callbackQueryId, "⚠️ Acesso negado.", true);
            return response()->json(['status' => 'unauthorized'], 403);
        }

        $this->telegramService->answerCallbackQuery($callbackQueryId, $action === 'approved' ? "✅ Ponto Aprovado!" : "❌ Ponto Recusado!");

        try {
            if ($action === 'approved') {
                \Illuminate\Support\Facades\DB::transaction(function() use ($visit) {
                    $customerData = DB::table('customers')->where('id', $visit->customer_id)->first();
                    if (!$customerData) {
                        throw new \Exception("Customer not found for visit {$visit->id}");
                    }
                    
                    $service = app(\App\Services\PointRequestService::class);
                    $service->applyPoints($visit);

                    $visit->update([
                        'status' => 'aprovado',
                        'approved_at' => now()
                    ]);
                });

                $customerObj = DB::table('customers')->where('id', $visit->customer_id)->first();
                $tenantData = DB::table('tenants')->where('id', $visit->tenant_id)->first();
                
                $currentGoal = (int)($tenantData->points_goal ?? 10);
                $loyaltyData = DB::table('loyalty_settings')->where('tenant_id', $visit->tenant_id)->first();
                $levels = $loyaltyData ? json_decode($loyaltyData->levels_config ?? '[]', true) : [];
                $lvlIdx = max(0, (int)($customerObj->loyalty_level ?? 1) - 1);
                if (is_array($levels) && isset($levels[$lvlIdx]['goal'])) {
                    $currentGoal = (int)$levels[$lvlIdx]['goal'];
                }

                $newText = "<b>Ponto aprovado ✅</b>\n"
                         . "Cliente agora possui <b>" . ($customerObj->points_balance ?? 0) . "</b> pontos\n"
                         . "Meta Atual: <b>" . ($customerObj->points_balance ?? 0) . " / " . $currentGoal . "</b>\n"
                         . "Total de visitas: <b>" . ($customerObj->attendance_count ?? 0) . "</b>\n\n"
                         . "--- Dados da Solicitação ---\n"
                         . $originalText;

                $markup = [
                    'inline_keyboard' => [
                        [['text' => '✅ APROVADO', 'callback_data' => 'already_processed']]
                    ]
                ];

                if (isset($callbackQuery['message']['photo'])) {
                    $this->telegramService->editMessageCaption($chatId, $messageId, $newText, $markup);
                } else {
                    $this->telegramService->editMessage($chatId, $messageId, $newText, $markup);
                }
            } else {
                $visit->update([
                    'status' => 'negado',
                    'approved_at' => now()
                ]);

                $newText = "❌ <b>SOLICITAÇÃO RECUSADA</b>\n\n"
                         . "--- Dados da Solicitação ---\n"
                         . $originalText;
                $markup = [
                    'inline_keyboard' => [
                        [['text' => '❌ RECUSADO', 'callback_data' => 'already_processed']]
                    ]
                ];
                if (isset($callbackQuery['message']['photo'])) {
                    $this->telegramService->editMessageCaption($chatId, $messageId, $newText, $markup);
                } else {
                    $this->telegramService->editMessage($chatId, $messageId, $newText, $markup);
                }
            }
        } catch (\Throwable $e) {
            Log::error("Telegram processVisit Error: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }

        return response()->json(['status' => 'success']);
    }

    /**
     * Process the approval or rejection.
     */
    private function processRequest($requestId, $action, $chatId, $messageId, $originalText, $callbackQueryId, $callbackQuery)
    {
        // Answer eventually if not answered already, but better to answer after checking auth
        
        \Illuminate\Support\Facades\Log::info("TelegramWebhook processRequest attempt", ['id' => $requestId, 'action' => $action]);

        $request = PointRequest::withoutGlobalScopes()->where('id', (string)$requestId)->first();

        if (!$request) {
            \Illuminate\Support\Facades\Log::warning('TelegramWebhook: PointRequest NOT FOUND', ['id' => $requestId]);
            $this->telegramService->answerCallbackQuery($callbackQueryId, "❌ Erro: Solicitação não encontrada (" . substr($requestId, 0, 8) . "...)", true);
            return response()->json(['status' => 'not_found']);
        }

        if ($request->status !== 'pending') {
            $statusLabel = $request->status === 'approved' ? 'Aprovada' : 'Recusada';
            $this->telegramService->answerCallbackQuery($callbackQueryId, "ℹ️ Já processada: {$statusLabel}");
            $this->telegramService->editMessage($chatId, $messageId, $originalText . "\n\nℹ️ <b>Esta solicitação já foi {$statusLabel}.</b>");
            return response()->json(['status' => 'already_processed']);
        }

        // Security check: Validate if the Chat ID is authorized for this totem
        $device = $request->device;
        $authorizedId = $device ? $device->telegram_chat_id : null;
        
        // If device has no ID, fallback to Tenant Settings
        if (!$authorizedId) {
            $settings = \App\Models\TenantSetting::where('tenant_id', $request->tenant_id)->first();
            $authorizedId = $settings ? $settings->telegram_chat_id : null;
        }

        if ($authorizedId && (string)$chatId !== (string)$authorizedId) {
            Log::warning("Unauthorized Telegram approval attempt for request {$requestId} from chat {$chatId}. Expected {$authorizedId}.");
            $this->telegramService->answerCallbackQuery($callbackQueryId, "⚠️ Acesso negado. Você não tem permissão para esta ação.", true);
            return response()->json(['status' => 'unauthorized'], 403);
        }

        // Answer now to stop spinner and give feedback
        $this->telegramService->answerCallbackQuery($callbackQueryId, $action === 'approved' ? "✅ Ponto Aprovado!" : "❌ Ponto Recusado!");

        try {
            if ($action === 'approved') {
                $this->pointRequestService->applyPoints($request);
                $request->update([
                    'status' => 'approved',
                    'approved_at' => now(),
                ]);

                // Clear cache and reload customer using direct DB query to ensure fresh data and bypass Scope
                $customerObj = DB::table('customers')->where('id', $request->customer_id)->first();
                $tenantData = DB::table('tenants')->where('id', $request->tenant_id)->first();
                
                if (!$customerObj) {
                   throw new \Exception("Customer not found for request {$request->id} in DB lookup");
                }

                // Temporary accessor-replacement for display (Null-Safe)
                $currentGoal = (int)($tenantData?->points_goal ?? 10);
                $loyaltyData = DB::table('loyalty_settings')->where('tenant_id', $request->tenant_id)->first();
                $levels = $loyaltyData ? json_decode($loyaltyData->levels_config ?? '[]', true) : [];
                $lvlIdx = max(0, (int)($customerObj->loyalty_level ?? 1) - 1);
                if (is_array($levels) && isset($levels[$lvlIdx]['goal'])) {
                    $currentGoal = (int)$levels[$lvlIdx]['goal'];
                }

                $newText = "<b>Ponto aprovado ✅</b>\n"
                         . "Cliente agora possui <b>" . ($customerObj->points_balance ?? 0) . "</b> pontos\n"
                         . "Meta Atual: <b>" . ($customerObj->points_balance ?? 0) . " / " . $currentGoal . "</b>\n"
                         . "Total de visitas: <b>" . ($customerObj->attendance_count ?? 0) . "</b>\n\n"
                         . "--- Dados da Solicitação ---\n"
                         . $originalText;

                $markup = [
                    'inline_keyboard' => [
                        [['text' => '✅ APROVADO', 'callback_data' => 'already_processed']]
                    ]
                ];

                if (isset($callbackQuery['message']['photo'])) {
                    $this->telegramService->editMessageCaption($chatId, $messageId, $newText, $markup);
                } else {
                    $this->telegramService->editMessage($chatId, $messageId, $newText, $markup);
                }
            } else {
                $request->update([
                    'status' => 'denied',
                    'approved_at' => now(),
                ]);

                $newText = "❌ <b>SOLICITAÇÃO RECUSADA</b>\n\n"
                         . "--- Dados da Solicitação ---\n"
                         . $originalText;
                
                $markup = [
                    'inline_keyboard' => [
                        [['text' => '❌ RECUSADO', 'callback_data' => 'already_processed']]
                    ]
                ];

                if (isset($callbackQuery['message']['photo'])) {
                    $this->telegramService->editMessageCaption($chatId, $messageId, $newText, $markup);
                } else {
                    $this->telegramService->editMessage($chatId, $messageId, $newText, $markup);
                }
            }

            // Fire Broadcast Event for real-time UI updates (Public Terminal & Admin)
            event(new \App\Events\PointRequestStatusUpdated($request));

            return response()->json(['status' => 'success']);
        } catch (\Throwable $e) {
            Log::error("Telegram processRequest Error: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            // Return 200 even on error to satisfy webhook retry logic, but log the error
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 200);
        }
    }

    /**
     * Handle Manual Reward Redemption from Telegram.
     */
    private function handleRedeemReward($customerId, $chatId, $messageId, $callbackQueryId, $callbackQuery)
    {
        $customer = \App\Models\Customer::withoutGlobalScopes()->find($customerId);
        if (!$customer) {
            $this->telegramService->answerCallbackQuery($callbackQueryId, "❌ Erro: Cliente não encontrado.", true);
            return response()->json(['status' => 'not_found']);
        }

        $tenantId = $customer->tenant_id;
        $loyalty = \App\Models\LoyaltySetting::where('tenant_id', $tenantId)->first();
        if (!$loyalty) {
            $this->telegramService->answerCallbackQuery($callbackQueryId, "❌ Erro: Fidelidade não configurada.", true);
            return response()->json(['status' => 'error']);
        }

        $levelsConfig = $loyalty->levels_config;
        $currentLevel = (int)($customer->loyalty_level ?? 1);
        
        // Get Goal
        $settings = \App\Models\TenantSetting::where('tenant_id', $tenantId)->first();
        $goal = 10; // Default
        if ($settings && $settings->points_goal) $goal = (int)$settings->points_goal;
        
        $lvlIdx = max(0, $currentLevel - 1);
        if (is_array($levelsConfig) && isset($levelsConfig[$lvlIdx])) {
            $goal = (int)($levelsConfig[$lvlIdx]['goal'] ?? $goal);
        }

        if ($customer->points_balance < $goal) {
            $this->telegramService->answerCallbackQuery($callbackQueryId, "⚠️ Saldo insuficiente ({$customer->points_balance}/{$goal}).", true);
            return response()->json(['status' => 'insufficient_points']);
        }

        // Apply reward
        try {
            \Illuminate\Support\Facades\DB::transaction(function() use ($customer, $loyalty, $goal, $currentLevel, $levelsConfig) {
                $nextLevelIdx = $currentLevel; 
                $pointsToAdd = (int)($loyalty->regular_points_per_scan ?? 1);
                
                if (is_array($levelsConfig) && isset($levelsConfig[$nextLevelIdx]) && isset($levelsConfig[$nextLevelIdx]['points_per_visit'])) {
                    $pointsToAdd = (int) $levelsConfig[$nextLevelIdx]['points_per_visit'];
                }

                // Create a mock request for applyPoints
                $mockRequest = (object)[
                    'tenant_id' => $customer->tenant_id,
                    'customer_id' => $customer->id,
                    'requested_points' => $pointsToAdd,
                    'id' => 'redeem_telegram_' . uniqid(),
                    'source' => 'telegram_remote_manual',
                    'meta' => [
                        'is_redemption' => true,
                        'goal' => $goal
                    ]
                ];

                $service = app(\App\Services\PointRequestService::class);
                $service->applyPoints($mockRequest);
            });

            $customer = $customer->fresh();
            $this->telegramService->answerCallbackQuery($callbackQueryId, "🏆 RECOMPENSA ENTREGUE! 🏆");

            $originalText = $callbackQuery['message']['text'] ?? $callbackQuery['message']['caption'] ?? '';
            $newText = "🏆 <b>RECOMPENSA ENTREGUE!</b> 🏆\n"
                     . "Cliente: <b>{$customer->name}</b>\n"
                     . "Novo nível: <b>{$customer->loyalty_level_name}</b>\n"
                     . "Ponto inicial: <b>{$customer->points_balance}</b>\n\n"
                     . "<i>Ação realizada via Telegram</i>\n\n"
                     . $originalText;

            $markup = [
                'inline_keyboard' => [
                    [['text' => '🏆 PREMIADO (VIA TELEGRAM)', 'callback_data' => 'already_processed']]
                ]
            ];

            if (isset($callbackQuery['message']['photo'])) {
                $this->telegramService->editMessageCaption($chatId, $messageId, $newText, $markup);
            } else {
                $this->telegramService->editMessage($chatId, $messageId, $newText, $markup);
            }

            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            Log::error('Telegram Redemption Error: ' . $e->getMessage());
            $this->telegramService->answerCallbackQuery($callbackQueryId, "❌ Erro ao processar: " . $e->getMessage(), true);
            return response()->json(['status' => 'error']);
        }
    }
}
