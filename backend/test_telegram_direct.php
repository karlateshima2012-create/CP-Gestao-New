<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Http;

$token = "8703394325:AAEZTczYtHMHx_POwTfFGUezU5EVXTZYyP4";
$chatId = "1280107206";

echo "Testing Telegram with Token: " . substr($token, 0, 10) . "..." . PHP_EOL;
echo "Target Chat ID: " . $chatId . PHP_EOL;

$url = "https://api.telegram.org/bot{$token}/sendMessage";
$response = Http::post($url, [
    'chat_id' => $chatId,
    'text' => "🚀 Teste de Conexão - Sistema CP Gestão\nStatus: Online\nData: " . date('d/m/Y H:i:s'),
    'parse_mode' => 'HTML'
]);

if ($response->successful()) {
    echo "✅ Success! Message sent." . PHP_EOL;
    print_r($response->json());
} else {
    echo "❌ Failed!" . PHP_EOL;
    echo "Status: " . $response->status() . PHP_EOL;
    echo "Body: " . $response->body() . PHP_EOL;
}
