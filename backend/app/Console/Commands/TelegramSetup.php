<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class TelegramSetup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:telegram-setup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Configura o Webhook do Telegram com o Secret Token de Segurança';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $token = config('services.telegram.bot_token');
        $secret = config('services.telegram.webhook_secret');
        $baseUrl = config('app.url');
        
        $webhookUrl = "{$baseUrl}/api/webhooks/telegram";

        if (!$token || !$secret) {
            $this->error("Erro: TELEGRAM_BOT_TOKEN ou TELEGRAM_WEBHOOK_SECRET não configurados no .env");
            return;
        }

        $this->info("Configurando Webhook...");
        $this->line("URL: {$webhookUrl}");
        $this->line("Secret Token: " . str_repeat('*', strlen($secret) - 4) . substr($secret, -4));

        $response = Http::post("https://api.telegram.org/bot{$token}/setWebhook", [
            'url' => $webhookUrl,
            'secret_token' => $secret,
            'allowed_updates' => ['message', 'callback_query']
        ]);

        if ($response->successful()) {
            $this->info("✅ Webhook configurado com sucesso!");
            $this->line($response->body());
        } else {
            $this->error("❌ Falha ao configurar Webhook.");
            $this->line($response->body());
        }
    }
}
