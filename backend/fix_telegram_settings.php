<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\TenantSetting;
use App\Models\Tenant;

$chatId = "1280107206";

echo "--- Telegram Settings Fixer ---" . PHP_EOL;

try {
    $tenants = Tenant::all();
    foreach ($tenants as $tenant) {
        $settings = TenantSetting::updateOrCreate(
            ['tenant_id' => $tenant->id],
            ['telegram_chat_id' => $chatId]
        );
        echo "✅ Updated Tenant: {$tenant->name} (Slug: {$tenant->slug}) with Chat ID: {$chatId}" . PHP_EOL;
    }
    echo "--- All tenants updated successfully ---" . PHP_EOL;
} catch (\Exception $e) {
    echo "❌ Error connecting to database: " . $e->getMessage() . PHP_EOL;
    echo "This script should be run in an environment where the database is accessible." . PHP_EOL;
}
