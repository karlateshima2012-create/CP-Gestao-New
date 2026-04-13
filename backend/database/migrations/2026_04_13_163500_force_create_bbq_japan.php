<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Device;
use App\Models\TenantSetting;
use App\Models\LoyaltySetting;

return new class extends Migration
{
    public function up(): void
    {
        $email = 'ricardoyassuyo@gmail.com';
        $slug = 'bbq-in-japan';
        $nfcUid = 'auBrnT2GxdjY';

        // 1. Create Tenant if not exists
        $tenant = Tenant::where('slug', $slug)->orWhere('email', $email)->first();
        
        if (!$tenant) {
            $tenant = Tenant::create([
                'name' => 'BBQ IN JAPAN',
                'owner_name' => 'Ricardo Suzuki',
                'phone' => '080-9725-6389',
                'email' => $email,
                'slug' => $slug,
                'plan' => 'Pro',
                'plan_started_at' => now(),
                'plan_expires_at' => now()->addMonths(6),
                'status' => 'active',
            ]);
            echo "Tenant BBQ IN JAPAN created.\n";
        } else {
            // Update existing
            $tenant->update([
                'name' => 'BBQ IN JAPAN',
                'owner_name' => 'Ricardo Suzuki',
                'phone' => '080-9725-6389',
                'email' => $email,
                'plan' => 'Pro',
                'plan_expires_at' => now()->addMonths(6),
            ]);
            echo "Tenant BBQ IN JAPAN updated.\n";
        }

        // 2. Ensure User exists
        $user = User::where('email', $email)->first();
        if (!$user) {
            $password = 'BbqJapan2026'; // Temporary password
            User::create([
                'name' => 'Ricardo Suzuki',
                'email' => $email,
                'password' => \Illuminate\Support\Facades\Hash::make($password),
                'tenant_id' => $tenant->id,
                'role' => 'client',
                'active' => true,
                'must_change_password' => true,
            ]);
            echo "User for Ricardo created.\n";
        }

        // 3. Ensure Settings exist
        TenantSetting::updateOrCreate(['tenant_id' => $tenant->id], []);
        
        LoyaltySetting::updateOrCreate(
            ['tenant_id' => $tenant->id],
            [
                'levels_config' => [
                    [
                        'level' => 1,
                        'name' => 'Bronze',
                        'goal' => 10,
                        'points_per_signup' => 1,
                        'reward' => 'Prêmio Bronze'
                    ]
                ]
            ]
        );

        // 4. Ensure Device with specific UID exists
        $device = Device::where('tenant_id', $tenant->id)
            ->where('nfc_uid', $nfcUid)
            ->first();

        if (!$device) {
            // If there's already a 'Totem 1', we might want to update it or create another
            $existingTotem1 = Device::where('tenant_id', $tenant->id)->where('name', 'Totem 1')->first();
            if ($existingTotem1) {
                $existingTotem1->update(['nfc_uid' => $nfcUid]);
                echo "Updated existing Totem 1 with printed UID.\n";
            } else {
                Device::create([
                    'tenant_id' => $tenant->id,
                    'name' => 'Totem 1',
                    'nfc_uid' => $nfcUid,
                    'mode' => 'approval',
                    'active' => true,
                ]);
                echo "Created new Totem 1 with printed UID.\n";
            }
        }

        // 5. Ensure 2 totems total
        $count = Device::where('tenant_id', $tenant->id)->count();
        if ($count < 2) {
            Device::create([
                'tenant_id' => $tenant->id,
                'name' => 'Totem 2',
                'nfc_uid' => Str::random(12),
                'mode' => 'approval',
                'active' => true,
            ]);
            echo "Created Totem 2.\n";
        }
    }

    public function down(): void
    {
        // No down migration for force creation
    }
};
