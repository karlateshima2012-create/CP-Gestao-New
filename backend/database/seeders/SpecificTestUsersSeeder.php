<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Tenant;
use App\Models\Plan;
use App\Models\TenantSetting;
use App\Models\LoyaltySetting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SpecificTestUsersSeeder extends Seeder
{
    public function run(): void
    {
        // Certificar que os planos existem
        $this->call(PlanSeeder::class);
        $elitePlan = Plan::where('slug', 'elite')->first();
        $proPlan = Plan::where('slug', 'pro')->first();

        // 1. ADMIN MASTER (Super Admin)
        User::updateOrCreate(
            ['email' => 'admin@cpgestaonew.com'],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Admin Master',
                'password' => Hash::make('Admin123!'),
                'role' => 'super_admin',
                'active' => true,
                'onboarding_completed' => true,
            ]
        );

        // 2. USUÁRIO ELITE (Auto-Aprovação)
        $tenantElite = Tenant::updateOrCreate(
            ['slug' => 'loja-elite-teste'],
            [
                'name' => 'Teste Elite (Automático)',
                'owner_name' => 'Dono Elite',
                'email' => 'elite@cpgestaonew.com',
                'plan' => 'Elite',
                'plan_id' => $elitePlan?->id,
                'loyalty_active' => true,
                'points_goal' => 10,
                'reward_text' => 'Prêmio Elite Especial',
                'status' => 'active',
            ]
        );
        TenantSetting::updateOrCreate(['tenant_id' => $tenantElite->id], ['pin_hash' => Hash::make('1234')]);
        LoyaltySetting::updateOrCreate(['tenant_id' => $tenantElite->id], ['points_goal' => 10, 'signup_bonus_points' => 1]);

        User::updateOrCreate(
            ['email' => 'elite@cpgestaonew.com'],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Lojista Elite',
                'password' => Hash::make('Elite123!'),
                'role' => 'admin',
                'tenant_id' => $tenantElite->id,
                'active' => true,
                'onboarding_completed' => true,
            ]
        );

        // 3. USUÁRIO PRO (Aprovação Manual)
        $tenantPro = Tenant::updateOrCreate(
            ['slug' => 'loja-pro-teste'],
            [
                'name' => 'Teste Pro (Manual)',
                'owner_name' => 'Dono Pro',
                'email' => 'pro@cpgestaonew.com',
                'plan' => 'Pro',
                'plan_id' => $proPlan?->id,
                'loyalty_active' => true,
                'points_goal' => 10,
                'reward_text' => 'Prêmio Pro Especial',
                'status' => 'active',
            ]
        );
        TenantSetting::updateOrCreate(['tenant_id' => $tenantPro->id], ['pin_hash' => Hash::make('1234')]);
        LoyaltySetting::updateOrCreate(['tenant_id' => $tenantPro->id], ['points_goal' => 10]);

        User::updateOrCreate(
            ['email' => 'pro@cpgestaonew.com'],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Lojista Pro',
                'password' => Hash::make('Pro123!'),
                'role' => 'admin',
                'tenant_id' => $tenantPro->id,
                'active' => true,
                'onboarding_completed' => true,
            ]
        );
    }
}
