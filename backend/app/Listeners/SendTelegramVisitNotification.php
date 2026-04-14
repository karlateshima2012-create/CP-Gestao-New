<?php

namespace App\Listeners;

use App\Events\VisitRecorded;
use App\Services\TelegramService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendTelegramVisitNotification
{
    use InteractsWithQueue;

    protected $telegramService;

    public function __construct(TelegramService $telegramService)
    {
        $this->telegramService = $telegramService;
    }

    public function handle(VisitRecorded $event): void
    {
        $tenant = $event->tenant;
        $customer = $event->customer;
        $visit = $event->visit;
        $device = $event->device;
        $pointsToAdd = $event->pointsToAdd;
        $isElite = $event->isElite;
        $isPro = $event->isPro;

        $settings = \App\Models\TenantSetting::where('tenant_id', $tenant->id)->first();
        $targetChatId = ($device && $device->telegram_chat_id) ? $device->telegram_chat_id : ($settings ? $settings->telegram_chat_id : null);
        
        if (!$targetChatId) {
            return;
        }

        // Check if Goal Reached for the notification
        $goal = $tenant->points_goal;
        $loyalty = \App\Models\LoyaltySetting::withoutGlobalScopes()->where('tenant_id', $tenant->id)->first();
        $levelsConfig = $loyalty ? $loyalty->levels_config : null;
        $lvlIdx = max(0, (int)$customer->loyalty_level - 1);
        if (is_array($levelsConfig) && isset($levelsConfig[$lvlIdx])) {
            $goal = (int)($levelsConfig[$lvlIdx]['goal'] ?? $goal);
        }

        $locationName = $device ? ($device->responsible_name ?: $device->name) : 'Terminal Público';
        $metaAlert = "";

        if ($isElite) {
            // Note: points_balance was already incremented by PointEngineService on Elite.
            if ($customer->points_balance >= $goal) {
                $metaAlert = "🏆 <b>META ALCANÇADA!</b> 🏆\n"
                           . "Prêmio disponível na <b>próxima visita</b>! 🎁\n\n";
            }

            $caption = $metaAlert 
                     . "✅ <b>PONTO REGISTRADO</b>\n\n"
                     . "👤 {$customer->name}\n"
                     . "📊 Total de visitas: {$customer->attendance_count}\n"
                     . "💰 Saldo atual: {$customer->points_balance} / {$goal}\n"
                     . "📅 " . now()->format('d/m/Y') . "\n"
                     . "🕒 " . now()->format('H:i');
            
            $replyMarkup = null;

            \App\Jobs\SendTelegramNotificationJob::dispatchSync(
                $tenant->id, 
                $caption, 
                'points', 
                $targetChatId, 
                $replyMarkup, 
                $customer->photo_url_full
            );

        } elseif ($isPro) {
            $isSoundEnabled = $device ? $device->telegram_sound_points : ($settings ? $settings->telegram_sound_points : true);
            if (!$isSoundEnabled) {
                // To keep parity with previous code, if targetChatId and sound wasn't enabled, they blocked it?
                // Wait! Parity: previous code was if ($targetChatId && $isSoundEnabled).
                return;
            }

            $potentialBalance = $customer->points_balance + $pointsToAdd;
            if ($potentialBalance >= $goal) {
                $metaAlert = "🏆 <b>META SENDO ALCANÇADA!</b> 🏆\n"
                           . "Ao aprovar, o cliente atingirá a meta!\n\n";
            }

            $caption = $metaAlert
                     . "⭐ <b>Solicitação de ponto</b>\n\n"
                     . "<b>Cliente:</b> {$customer->name}\n"
                     . "<b>Telefone:</b> {$customer->phone}\n";
            if ($customer->company_name) {
                $caption .= "<b>Empresa:</b> {$customer->company_name}\n";
            }
            $caption .= "<b>Visitas:</b> {$customer->attendance_count}\n"
                     . "<b>Saldo:</b> {$customer->points_balance} (+{$pointsToAdd}) / {$goal}\n"
                     . "<b>Hora:</b> " . now()->format('H:i') . "\n\n"
                     . "<b>📍 Local:</b> {$locationName}";
            
            $replyMarkup = [
                'inline_keyboard' => [
                    [
                        ['text' => '✅ APROVAR PONTO', 'callback_data' => "approve_visit:{$visit->id}"],
                        ['text' => '❌ Negar', 'callback_data' => "reject_visit:{$visit->id}"]
                    ]
                ]
            ];

            \Illuminate\Support\Facades\Log::debug("Sending Telegram PRO notification with visit ID: {$visit->id}");
            $tgRes = $this->telegramService->sendPhoto($tenant->id, $customer->photo_url_full, $caption, 'points', $replyMarkup, $targetChatId);
            
            if ($tgRes && isset($tgRes['result']['message_id'])) {
                $meta = $visit->meta ?? [];
                $meta['telegram_message_id'] = $tgRes['result']['message_id'];
                $meta['telegram_chat_id'] = $targetChatId;
                $visit->update(['meta' => $meta]);
            }
        }
    }
}
