<?php

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\PlanFeature;
use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MigratePlansSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🚀 Saneando planos e limites de dispositivos...');

        // 1. Garantir que os planos existam
        $pro = Plan::updateOrCreate(
            ['slug' => 'pro'],
            ['name' => 'Pro', 'description' => 'Plano Profissional']
        );

        $elite = Plan::updateOrCreate(
            ['slug' => 'elite'],
            ['name' => 'Elite', 'description' => 'Plano Elite Ilimitado']
        );

        // 2. Configurar Features do Pro
        $this->setFeature($pro->id, 'contact_limit', '4000');
        $this->setFeature($pro->id, 'device_limit', '10'); // Aumentado para 10
        $this->setFeature($pro->id, 'allow_online_qr', '1');
        $this->setFeature($pro->id, 'allow_auto_approve', '0');

        // 3. Configurar Features do Elite
        $this->setFeature($elite->id, 'contact_limit', '10000');
        $this->setFeature($elite->id, 'device_limit', '99');
        $this->setFeature($elite->id, 'allow_online_qr', '1');
        $this->setFeature($elite->id, 'allow_auto_approve', '1');

        // 4. Vincular Tenants existentes aos planos corretos
        Tenant::where('plan', 'Pro')->orWhere('plan', 'pro')->update(['plan_id' => $pro->id, 'plan' => 'Pro']);
        Tenant::where('plan', 'Elite')->orWhere('plan', 'elite')->update(['plan_id' => $elite->id, 'plan' => 'Elite']);

        $this->command->info('✅ Planos e limites atualizados com sucesso!');
    }

    private function setFeature($planId, $slug, $value)
    {
        PlanFeature::updateOrCreate(
            ['plan_id' => $planId, 'feature_slug' => $slug],
            ['feature_value' => $value]
        );
    }
}
