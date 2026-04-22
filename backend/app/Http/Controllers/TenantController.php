<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Tenant;
use App\Models\TenantSetting;
use App\Services\DeviceService;
use App\Services\PlanService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

use App\Http\Responses\ApiResponse;

class TenantController extends Controller
{
    protected $deviceService;
    protected $planService;

    public function __construct(DeviceService $deviceService, PlanService $planService)
    {
        $this->deviceService = $deviceService;
        $this->planService = $planService;
    }

    public function index()
    {
        $tenants = Tenant::withCount('customers')
            ->orderBy('created_at', 'desc')
            ->get();
        return ApiResponse::ok($tenants);
    }

    public function getGlobalMetrics()
    {
        $totalTenants = Tenant::count();
        // Devices table is now for Totems
        $totalTotems = \App\Models\Device::count();
        
        $expiringSoon = Tenant::whereNotNull('plan_expires_at')
            ->where('plan_expires_at', '>', now())
            ->where('plan_expires_at', '<=', now()->addDays(10))
            ->count();

        return ApiResponse::ok([
            'total_tenants' => $totalTenants,
            'total_totems' => $totalTotems,
            'expiring_soon' => $expiringSoon,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'owner_name' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'email' => 'required|email|max:100|unique:users,email',
            'plan' => 'required|string',
            'plan_expires_at' => 'nullable|date',
            'plan_started_at' => 'nullable|date',
            'custom_contact_limit' => 'nullable|integer',
            'extra_contacts_quota' => 'nullable|integer',
            'totems_count' => 'nullable|integer|min:0|max:10',
        ]);

        try {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($request) {
                // Generate and ensure unique slug
                $baseSlug = \Illuminate\Support\Str::slug($request->name);
                if (empty($baseSlug)) {
                    $baseSlug = 'tenant-' . \Illuminate\Support\Str::random(5);
                }
                
                $slug = $baseSlug;
                $counter = 1;
                while (Tenant::where('slug', $slug)->exists()) {
                    $slug = $baseSlug . '-' . $counter;
                    $counter++;
                }

                $tenant = Tenant::create([
                    'name' => $request->name,
                    'owner_name' => $request->owner_name,
                    'phone' => $request->phone,
                    'email' => $request->email,
                    'plan' => $request->plan,
                    'plan_expires_at' => $request->plan_expires_at ?: now()->addDays(30),
                    'plan_started_at' => $request->plan_started_at ?: now(),
                    'custom_contact_limit' => $request->custom_contact_limit,
                    'extra_contacts_quota' => $request->extra_contacts_quota ?? 0,
                    'slug' => $slug,
                ]);

                // Provision Totems (Devices) if requested
                $totemsCount = (int) $request->input('totems_count', 0);
                if ($totemsCount > 0) {
                    $mode = $tenant->plan === 'elite' ? 'auto_checkin' : 'approval';
                    for ($i = 1; $i <= $totemsCount; $i++) {
                        \App\Models\Device::create([
                            'tenant_id' => $tenant->id,
                            'name' => "Totem {$i}",
                            'nfc_uid' => \Illuminate\Support\Str::random(12),
                            'mode' => $mode,
                            'auto_approve' => $tenant->plan === 'elite',
                            'active' => true,
                        ]);
                    }
                }

                // Initialize Tenant Settings
                $settings = new TenantSetting();
                $settings->tenant_id = $tenant->id;
                $settings->save();

                // Initialize Loyalty Settings (Critical for Point Engine)
                \App\Models\LoyaltySetting::create([
                    'tenant_id' => $tenant->id,
                    'levels_config' => [
                        [
                            'level' => 1,
                            'name' => 'Bronze',
                            'goal' => 10,
                            'points_per_signup' => 1,
                            'reward' => 'Prêmio Bronze'
                        ]
                    ]
                ]);

                // Populate default tags for the new tenant
                \App\Jobs\PopulateDefaultTagsJob::dispatch($tenant->id);

                // Create initial User (Admin for this tenant)
                $password = \Illuminate\Support\Str::random(8);
                $user = User::create([
                    'name' => $request->owner_name ?? $request->name,
                    'email' => $request->email,
                    'password' => Hash::make($password),
                    'tenant_id' => $tenant->id,
                    'role' => 'client',
                    'active' => true,
                    'must_change_password' => true,
                ]);

                // Automatic Email Notification
                try {
                    $systemUrl = config('app.url') ?? 'https://cpgestao.creativeprintjp.com';
                    \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\TenantCredentialsMail($tenant, $user->email, $password, $systemUrl));
                } catch (\Exception $mailEx) {
                    \Illuminate\Support\Facades\Log::error("Failed to send credentials email: " . $mailEx->getMessage());
                }

                return ApiResponse::ok([
                    'tenant' => $tenant,
                    'credentials' => [
                        'email' => $user->email,
                        'password' => $password,
                        'system_url' => config('app.url') ?? 'https://cpgestao.creativeprintjp.com'
                    ]
                ], 'Tenant e usuário criados com sucesso');
            });
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Tenant Creation Failed: " . $e->getMessage());
            return ApiResponse::error('Erro ao criar novo CRM: ' . $e->getMessage(), 'ERROR', 500);
        }
    }

    public function update(Request $request, $id)
    {
        $tenant = Tenant::findOrFail($id);
        
        try {
            $validated = $request->validate([
                'name' => 'sometimes|string',
                'owner_name' => 'sometimes|string|nullable',
                'phone' => 'sometimes|string|nullable',
                'email' => 'sometimes|email',
                'status' => 'sometimes|string|in:active,warning,expired,blocked',
                'plan' => 'sometimes|string',
                'plan_expires_at' => 'sometimes|date|nullable',
                'plan_started_at' => 'sometimes|date|nullable',
                'custom_contact_limit' => 'sometimes|integer|nullable',
                'extra_contacts_quota' => 'sometimes|integer|nullable',
                'loyalty_active' => 'sometimes|boolean',
                'points_goal' => 'sometimes|integer|min:1',
                'reward_text' => 'sometimes|string',
                'logo_url' => 'sometimes|string|nullable',
                'description' => 'sometimes|string|nullable',
                'renewal_date' => 'sometimes|string|nullable',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Illuminate\Support\Facades\Log::error('Tenant Update Validation Failed', [
                'tenant_id' => $id,
                'errors' => $e->errors(),
                'input' => $request->all()
            ]);
            throw $e;
        }

        // Normalize date format if present to avoid precision issues in database
        if (!empty($validated['plan_expires_at'])) {
            $validated['plan_expires_at'] = \Illuminate\Support\Carbon::parse($validated['plan_expires_at'])->format('Y-m-d');
        }
        if (!empty($validated['plan_started_at'])) {
            $validated['plan_started_at'] = \Illuminate\Support\Carbon::parse($validated['plan_started_at'])->format('Y-m-d');
        }

        try {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($tenant, $validated, $request) {
                $oldEmail = $tenant->email;
                $newEmail = $validated['email'] ?? null;

                // 1. If email is changing, check for uniqueness in users table (excluding current users of this tenant)
                if ($newEmail && $newEmail !== $oldEmail) {
                    $emailTaken = User::where('email', $newEmail)
                        ->where('tenant_id', '!=', $tenant->id)
                        ->exists();
                    
                    if ($emailTaken) {
                        return ApiResponse::error('Este e-mail já está sendo utilizado por outro administrador ou loja.', 'VALIDATION_ERROR', 422);
                    }
                }

                // 2. Update Tenant
                $tenant->update($validated);

                // 3. Sync User Table (Owner Accounts) and Invalidate Sessions
                if ($newEmail && $newEmail !== $oldEmail) {
                    $usersUpdated = 0;
                    // Sincroniza o e-mail de TODOS os usuários com papel 'client' vinculados a este tenant.
                    // Isso garante que o lojista principal sempre mude de login junto com os dados da loja.
                    $users = User::where('tenant_id', $tenant->id)
                        ->where('role', 'client')
                        ->get();

                    foreach ($users as $user) {
                        $user->email = $newEmail;
                        $user->save();
                        
                        // Invalida sessões ativas (Sanctum Tokens) para forçar novo login com novo e-mail
                        $user->tokens()->delete();
                        $usersUpdated++;
                    }

                    \Illuminate\Support\Facades\Log::info("Sincronização de E-mail (Lojista):", [
                        'tenant_id' => $tenant->id,
                        'old_email' => $oldEmail,
                        'new_email' => $newEmail,
                        'users_affected' => $usersUpdated
                    ]);
                }

                return ApiResponse::ok($tenant, 'Loja atualizada com sucesso');
            });
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Erro Crítico no Update do Tenant: " . $e->getMessage(), [
                'tenant_id' => $id,
                'trace' => $e->getTraceAsString()
            ]);
            return ApiResponse::error('Não foi possível atualizar os dados. Por favor, tente novamente ou contate o suporte.', 'ERROR', 500);
        }
    }

    public function resetPin(Request $request, $id)
    {
        // PINs are now obsolete as of April 2026 update, but we return a fake success 
        // to avoid breaking the UI for legacy admins until UI is fully updated.
        return ApiResponse::ok([
            'temp_pin' => '0000'
        ], 'Sistema de PIN descontinuado (Acesso via Senha)');
    }


    public function destroy($id)
    {
        $tenant = Tenant::findOrFail($id);
        
        \Illuminate\Support\Facades\DB::transaction(function() use ($tenant) {
            // Delete associated data
            $tenant->settings()->delete();
            $tenant->loyaltySettings()->delete();
            
            // Delete movements, devices, and customers
            \App\Models\PointMovement::where('tenant_id', $tenant->id)->delete();
            \App\Models\Device::where('tenant_id', $tenant->id)->delete();
            \App\Models\Customer::where('tenant_id', $tenant->id)->delete();
            
            // Delete users (all users associated with this tenant)
            $tenant->users()->delete();
            
            // Finally delete the tenant
            $tenant->delete();
        });

        return ApiResponse::ok(null, 'Loja e todos os dados associados foram excluídos com sucesso');
    }

    public function listDevices($id)
    {
        $devices = \App\Models\Device::where('tenant_id', $id)->get();
        return ApiResponse::ok($devices);
    }

    public function storeDevice(Request $request, $id)
    {
        try {
            $tenant = Tenant::findOrFail($id);
            
            $this->planService->validateDeviceLimit($tenant);

            $request->validate([
                'name' => 'required|string',
                'mode' => 'required|string|in:approval,auto_checkin',
                'telegram_chat_id' => 'nullable|string',
                'responsible_name' => 'nullable|string',
            ]);

            $device = \App\Models\Device::create([
                'tenant_id' => $tenant->id,
                'name' => $request->name,
                'nfc_uid' => Str::random(12),
                'mode' => $request->mode,
                'telegram_chat_id' => $request->telegram_chat_id,
                'responsible_name' => $request->responsible_name ?: $request->name,
                'auto_approve' => $request->mode === 'auto_checkin',
                'active' => true,
            ]);

            return ApiResponse::ok($device, 'Terminal registrado com sucesso');
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }
    }

    public function updateDevice(Request $request, $id, $deviceId)
    {
        try {
            $device = \App\Models\Device::where('tenant_id', $id)->findOrFail($deviceId);

            $request->validate([
                'name' => 'sometimes|string',
                'mode' => 'sometimes|string|in:approval,auto_checkin',
                'nfc_uid' => 'sometimes|string|unique:devices,nfc_uid,' . $deviceId,
                'telegram_chat_id' => 'nullable|string',
                'responsible_name' => 'nullable|string',
            ]);

            $data = $request->only(['name', 'mode', 'nfc_uid', 'telegram_chat_id', 'responsible_name']);
            if (isset($data['mode'])) {
                $data['auto_approve'] = $data['mode'] === 'auto_checkin';
            }

            $device->update($data);

            return ApiResponse::ok($device, 'Terminal atualizado com sucesso');
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }
    }

    public function deleteDevice($id, $deviceId)
    {
        $device = \App\Models\Device::where('tenant_id', $id)->findOrFail($deviceId);
        $device->delete();
        return ApiResponse::ok(null, 'Terminal excluído com sucesso');
    }
}
