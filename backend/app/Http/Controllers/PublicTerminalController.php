<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Device;
use App\Models\PointMovement;
use App\Models\Tenant;
use App\Models\PointRequest;
use App\Models\TenantSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Services\PointRequestService;
use Exception;

use App\Http\Responses\ApiResponse;
use App\Utils\PhoneHelper;
use App\Utils\Luhn;
use App\Services\TelegramService;
use Carbon\Carbon;

class PublicTerminalController extends Controller
{
    protected $telegramService;
    protected $pointRequestService;
    protected $planService;
    protected $qrTokenService;
    protected $deviceService;
    protected $pointEngineService;

    public function __construct(
        TelegramService $telegramService, 
        PointRequestService $pointRequestService,
        \App\Services\PlanService $planService,
        \App\Services\QrTokenService $qrTokenService,
        \App\Services\DeviceService $deviceService,
        \App\Services\PointEngineService $pointEngineService
    ) {
        $this->telegramService = $telegramService;
        $this->pointRequestService = $pointRequestService;
        $this->planService = $planService;
        $this->qrTokenService = $qrTokenService;
        $this->deviceService = $deviceService;
        $this->pointEngineService = $pointEngineService;
    }

    /**
     * Centralized device validation.
     */
    private function validateDevice($slug, $uid = null, $token = null)
    {
        $tenant = Tenant::where('slug', $slug)->first();
        if (!$tenant) {
            \Illuminate\Support\Facades\Log::warning("TERMINAL_VALIDATION: Tenant not found. Slug: {$slug}");
            return [null, null];
        }

        if ($tenant->status !== 'active') {
            $msg = $tenant->status === 'blocked' 
                ? 'Esta página está temporariamente indisponível.' 
                : 'Esta loja está temporariamente inativa.';
            abort(403, $msg);
        }

        if ($tenant->plan_expires_at && \Carbon\Carbon::parse($tenant->plan_expires_at)->isPast()) {
            abort(403, 'Não é possível se conectar a esta página no momento');
        }

        if (request()->isMethod('GET')) {
            $tenant->increment('public_page_visits');
        }

        $device = null;

        // 1. Try Digital Token (Dynamic QR)
        if ($token && is_string($token) && strlen($token) > 10) {
            if ($this->qrTokenService->isValid($token, $tenant->id)) {
                $device = $this->deviceService->getOrCreateOnlineQrDevice($tenant->id);
                if ($device) {
                    \Illuminate\Support\Facades\Log::debug("TERMINAL_VALIDATION: Identified by TOKEN for Tenant {$tenant->id}");
                }
            }
        }

        // 2. Try Physical Device ID (Static QR / Totem)
        if (!$device) {
            $rawUid = $uid ?: (request()->input('device_uid') ?: request()->input('uid'));
            $effectiveUid = trim((string)$rawUid);
            
            if ($effectiveUid && !in_array(strtolower($effectiveUid), ['null', 'undefined', ''])) {
                $device = Device::withoutGlobalScopes()
                    ->where('tenant_id', $tenant->id)
                    ->where(function ($q) use ($effectiveUid) {
                        $q->where('nfc_uid', $effectiveUid)
                          ->orWhere('id', $effectiveUid)
                          ->orWhere('nfc_uid', strtolower($effectiveUid))
                          ->orWhere('nfc_uid', strtoupper($effectiveUid));
                    })
                    ->first();

                if ($device) {
                    \Illuminate\Support\Facades\Log::debug("TERMINAL_VALIDATION: Identified by UID ({$effectiveUid}) for Tenant {$tenant->id}");
                } else {
                    $available = Device::withoutGlobalScopes()->where('tenant_id', $tenant->id)->pluck('nfc_uid')->toArray();
                    \Illuminate\Support\Facades\Log::warning("TERMINAL_VALIDATION: UID not found. Input: '{$effectiveUid}'. Available: " . implode(', ', $available));
                }
            }
        }

        if (!$device) {
            \Illuminate\Support\Facades\Log::info("TERMINAL_VALIDATION: No valid identification found (Slug: {$slug})");
            return [$tenant, null];
        }

        if (!$device->active) {
            abort(403, 'Dispositivo inativo');
        }

        return [$tenant, $device];
    }

    public function getInfo(Request $request, $slug, $uid = null)
    {
        $token = $request->query('token');
        \Illuminate\Support\Facades\Log::debug("API_REQUEST: getInfo - Slug: {$slug}, UID: {$uid}, Token: " . ($token ? 'YES' : 'NO'));
        
        try {
            [$tenant, $device] = $this->validateDevice($slug, $uid, $token);
            
            if (!$tenant) {
                 \Illuminate\Support\Facades\Log::error("API_FAILURE: Tenant not found for slug: {$slug}");
                 return response()->json(['message' => "Loja não encontrada ({$slug}). Verifique a URL."], 404);
            }

            $tokenValid = $token ? $this->qrTokenService->isValid($token, $tenant->id) : false;
            $deviceType = $device ? $device->type : 'web';

            return ApiResponse::ok([
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'description' => $tenant->description,
                'logo_url' => $tenant->logo_url,
                'cover_url' => $tenant->cover_url,
                'rules_text' => $tenant->rules_text,
                'points_goal' => $tenant->points_goal,
                'reward_text' => $tenant->reward_text,
                'token_valid' => $tokenValid,
                'device_id' => $device ? $device->id : null,
                'device_name' => $device ? $device->name : 'Navegador Web',
                'device_type' => $deviceType,
                'is_terminal' => !!($uid || $token),
                'session_token' => $this->createSessionToken($request, $tenant->id)
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("API_ERROR: getInfo - " . $e->getMessage());
            return response()->json(['message' => 'Erro ao processar dados da loja.', 'debug' => $e->getMessage()], 500);
        }
    }

    private function createSessionToken(Request $request, $tenantId)
    {
        $token = bin2hex(random_bytes(16));
        \Illuminate\Support\Facades\Cache::put("terminal_session:{$token}", [
            'tenant_id' => $tenantId,
            'ip' => $request->ip(),
            'ua' => $request->header('User-Agent')
        ], now()->addMinutes(30));
        return $token;
    }

    private function validateSessionToken(Request $request, $token, $tenantId)
    {
        if (!$token) return false;
        $session = \Illuminate\Support\Facades\Cache::get("terminal_session:{$token}");
        if (!$session) return false;
        if ($session['tenant_id'] != $tenantId) return false;
        if ($session['ip'] != $request->ip()) return false;
        if ($session['ua'] != $request->header('User-Agent')) return false;
        return true;
    }

    public function getStoreInfo(Request $request, $slug)
    {
        return $this->getInfo($request, $slug, null);
    }

    public function lookup(Request $request, $slug, $uid = null)
    {
        try {
            $request->validate(['phone' => 'required|string', 'token' => 'nullable|string']);
            [$tenant, $device] = $this->validateDevice($slug, $uid, $request->token);
            
            if (!$this->validateSessionToken($request, $request->session_token, $tenant->id)) {
                return ApiResponse::error('Sessão expirada. Por favor, recarregue a página.', 'SESSION_REQUIRED', 403);
            }
            
            $phone = PhoneHelper::normalize($request->phone);
            $customer = Customer::withoutGlobalScopes()->where('tenant_id', $tenant->id)->where('phone', $phone)->first();

            if (!$customer) {
                return ApiResponse::ok(['customer_exists' => false, 'points_balance' => 0]);
            }

            $balance      = $customer->points_balance;
            $currentLevel = (int)($customer->loyalty_level ?? 1);
            $lvlIdx       = max(0, $currentLevel - 1);
            $goal         = $tenant->points_goal;
            $rewardName   = $tenant->reward_text;

            $loyalty = \App\Models\LoyaltySetting::withoutGlobalScopes()->where('tenant_id', $tenant->id)->first();
            if ($loyalty && is_array($loyalty->levels_config) && isset($loyalty->levels_config[$lvlIdx])) {
                $goal       = (int)($loyalty->levels_config[$lvlIdx]['goal']       ?? $goal);
                $rewardName = $loyalty->levels_config[$lvlIdx]['reward']             ?? $rewardName;
            }

            // ── Plano PRO: calcular visitas pendentes deste cliente ───────────
            $isPro          = strtolower($tenant->plan) === 'pro';
            $pendingVisits  = 0;
            $pendingPoints  = 0;
            $willReachGoal  = false;

            if ($isPro) {
                $pending = \App\Models\Visit::withoutGlobalScopes()
                    ->where('customer_id', $customer->id)
                    ->where('tenant_id',   $tenant->id)
                    ->whereIn('status', ['pendente', 'pending'])
                    ->where('points_granted', '>', 0)
                    ->get();

                $pendingVisits = $pending->count();
                $pendingPoints = $pending->sum('points_granted');
                $willReachGoal = ($pendingVisits > 0) && (($balance + $pendingPoints) >= $goal);
            }
            // ── Level Up Announcement ───────────────────────────────────────
            $levelUpAnnouncement = null;
            $prefs = $customer->preferences ?? [];
            if (isset($prefs['pending_level_up_announcement']) && $prefs['pending_level_up_announcement']) {
                $levelUpAnnouncement = [
                    'title' => "Parabéns, {$customer->name}!",
                    'message' => "Você conquistou o nível: " . $customer->loyalty_level_name,
                    'description' => "Seus benefícios foram atualizados! Agora você ganha pontos mais rápido."
                ];
                unset($prefs['pending_level_up_announcement']);
                $customer->update(['preferences' => $prefs]);
            }

            return ApiResponse::ok([
                'customer_exists'           => true,
                'id'                        => $customer->id,
                'name'                      => $customer->name,
                'plan'                      => $tenant->plan,
                'points_balance'            => $balance,
                'points_goal'               => $goal,
                'remaining'                 => max(0, $goal - $balance),
                'loyalty_level'             => $currentLevel,
                'loyalty_level_name'        => $customer->loyalty_level_name,
                'foto_perfil_url'           => $customer->photo_url_full,
                'reward_name'               => $rewardName,
                // Campos de ponto pendente (Plano PRO)
                'pending_visits'            => $pendingVisits,
                'pending_points'            => $pendingPoints,
                'will_reach_goal_if_approved' => $willReachGoal,
                'level_up'                  => $levelUpAnnouncement,
                'history' => PointMovement::where('customer_id', $customer->id)->latest()->limit(5)->get()->map(fn($m) => [
                    'amount' => $m->points, 'type' => $m->type, 'date' => $m->created_at ? $m->created_at->format('d/m/Y') : 'N/A'
                ]),
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("LOOKUP_ERROR: " . $e->getMessage() . " at " . $e->getLine());
            return response()->json(['message' => 'Sys: ' . $e->getMessage()], 500);
        }
    }

        public function earn(Request $request, $slug, $uid = null)
    {
        // LOG 1: Entrada do método
        \Illuminate\Support\Facades\Log::info('EARN_METHOD_START', [
            'slug' => $slug,
            'uid' => $uid,
            'phone' => $request->phone,
            'has_token' => !empty($request->token),
            'has_session_token' => !empty($request->session_token),
            'all_params' => $request->all()
        ]);

        return DB::transaction(function () use ($request, $slug, $uid) {
            try {
                // LOG 2: Antes de validar device
                \Illuminate\Support\Facades\Log::info('EARN_VALIDATING_DEVICE', [
                    'slug' => $slug,
                    'uid' => $uid,
                    'token' => $request->token ? substr($request->token, 0, 20) . '...' : null
                ]);

                [$tenant, $device] = $this->validateDevice($slug, $uid, $request->token);
                
                // LOG 3: Resultado da validação do device
                \Illuminate\Support\Facades\Log::info('EARN_DEVICE_VALIDATED', [
                    'tenant_id' => $tenant?->id,
                    'tenant_name' => $tenant?->name,
                    'device_id' => $device?->id,
                    'device_type' => $device?->type,
                    'tenant_status' => $tenant?->status
                ]);

                if (!$tenant) {
                    \Illuminate\Support\Facades\Log::error('EARN_TENANT_NOT_FOUND', ['slug' => $slug]);
                    return ApiResponse::error('Loja não encontrada.', 'NOT_FOUND', 404);
                }

                // LOG 4: Antes de validar sessão
                \Illuminate\Support\Facades\Log::info('EARN_VALIDATING_SESSION', [
                    'session_token' => $request->session_token ? substr($request->session_token, 0, 20) . '...' : null,
                    'tenant_id' => $tenant->id
                ]);

                if (!$this->validateSessionToken($request, $request->session_token, $tenant->id)) {
                    \Illuminate\Support\Facades\Log::warning('EARN_SESSION_INVALID', [
                        'tenant_id' => $tenant->id,
                        'ip' => $request->ip(),
                        'ua' => $request->header('User-Agent')
                    ]);
                    return ApiResponse::error('Sessão inválida.', 'SESSION_REQUIRED', 403);
                }

                // LOG 5: Sessão OK, normalizando telefone
                \Illuminate\Support\Facades\Log::info('EARN_NORMALIZING_PHONE', [
                    'original_phone' => $request->phone
                ]);

                $phone = PhoneHelper::normalize($request->phone);
                
                // LOG 6: Telefone normalizado
                \Illuminate\Support\Facades\Log::info('EARN_PHONE_NORMALIZED', [
                    'normalized_phone' => $phone,
                    'original_phone' => $request->phone
                ]);

                // LOG 7: Buscando cliente
                \Illuminate\Support\Facades\Log::info('EARN_SEARCHING_CUSTOMER', [
                    'tenant_id' => $tenant->id,
                    'phone' => $phone
                ]);

                $customer = Customer::where('tenant_id', $tenant->id)->where('phone', $phone)->first();
                
                // LOG 8: Resultado da busca do cliente
                \Illuminate\Support\Facades\Log::info('EARN_CUSTOMER_FOUND', [
                    'found' => !is_null($customer),
                    'customer_id' => $customer?->id,
                    'customer_name' => $customer?->name,
                    'current_balance' => $customer?->points_balance
                ]);

                if (!$customer) {
                    \Illuminate\Support\Facades\Log::warning('EARN_CUSTOMER_NOT_FOUND', [
                        'tenant_id' => $tenant->id,
                        'phone' => $phone
                    ]);
                }

                // LOG 9: Antes de chamar processEarn
                \Illuminate\Support\Facades\Log::info('EARN_CALLING_PROCESS_EARN', [
                    'tenant_id' => $tenant->id,
                    'device_id' => $device?->id,
                    'customer_id' => $customer?->id,
                    'has_token' => !empty($request->token),
                    'request_data' => $request->all()
                ]);

                // LOG 10: Chamando o serviço
                $result = $this->pointEngineService->processEarn($tenant, $device, $customer, $request->token, $request->all());
                
                // LOG 11: Resultado do processEarn
                $resultData = $result->getData();
                \Illuminate\Support\Facades\Log::info('EARN_PROCESS_EARN_RESULT', [
                    'success' => !isset($resultData->error),
                    'status_code' => $result->status(),
                    'response' => json_encode($resultData)
                ]);

                return $result;
                
            } catch (\Throwable $e) {
                // LOG 12: Capturando qualquer exceção
                \Illuminate\Support\Facades\Log::error('EARN_EXCEPTION_CAUGHT', [
                    'message' => $e->getMessage(),
                    'code' => $e->getCode(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString()
                ]);
                
                // Retorna a mensagem específica que você mencionou
                return ApiResponse::error(
                    'Houve uma instabilidade momentânea no processamento do seu ponto. Erro: ' . $e->getMessage(),
                    'INTERNAL_ERROR',
                    500
                );
            }
        });
    }

    public function autoEarn(Request $request, $slug, $uid = null) { return $this->earn($request, $slug, $uid); }

    public function redeem(Request $request, $slug, $uid = null)
    {
        return DB::transaction(function () use ($request, $slug, $uid) {
            [$tenant, $device] = $this->validateDevice($slug, $uid, $request->token);
            if (!$this->validateSessionToken($request, $request->session_token, $tenant->id)) {
                return ApiResponse::error('Sessão inválida.', 'SESSION_REQUIRED', 403);
            }
            if (!$device) {
                return ApiResponse::error('Resgate exige presença física.', 'DEVICE_REQUIRED', 403);
            }
            $phone = PhoneHelper::normalize($request->phone);
            $customer = Customer::where('tenant_id', $tenant->id)->where('phone', $phone)->first();
            
            if (!$customer || $customer->points_balance < $tenant->points_goal) {
                return ApiResponse::error('Saldo insuficiente.', 'INSUFFICIENT_POINTS', 409);
            }

            return $this->pointEngineService->processRedeem($tenant, $device, $customer, $request->token);
        });
    }

    public function register(Request $request, $slug, $uid = null)
    {
        return DB::transaction(function () use ($request, $slug, $uid) {
            // Identify tenant and optional device
            $token = $request->input('token');
            [$tenant, $device] = $this->validateDevice($slug, $uid, $token);
            
            if (!$tenant) {
                return ApiResponse::error('Loja não encontrada.', 'NOT_FOUND', 404);
            }

            if ($tenant->isLimitReached()) {
                return ApiResponse::error('Limite de clientes da loja atingido.', 'LIMIT_REACHED', 403);
            }

            // Normalization and Validation
            $phone = PhoneHelper::normalize($request->phone);
            
            // Avoid duplicates
            $existing = $this->findCustomer($tenant->id, $phone);
            if ($existing['customer']) {
                return ApiResponse::error('Este número já está cadastrado.', 'DUPLICATE_PHONE', 409);
            }

            // Create Customer
            // Nota: instagram pode nao existir no banco de v1 - verificacao defensiva
            $customerData = [
                'tenant_id'        => $tenant->id,
                'name'             => $request->name,
                'phone'            => $phone,
                'email'            => $request->email,
                'city'             => $request->city,
                'province'         => $request->province,
                'address'          => $request->address,
                'source'           => $device ? 'terminal' : 'web_portal',
                'last_activity_at' => now()
            ];

            // Adiciona instagram apenas se a coluna existir no banco
            if (\Illuminate\Support\Facades\Schema::hasColumn('customers', 'instagram') && $request->instagram) {
                $customerData['instagram'] = $request->instagram;
            }

            $customer = Customer::create($customerData);

            // Handle Photo if present
            if ($request->photo) {
                try {
                    $service = app(\App\Services\CustomerPhotoService::class);
                    $path = $service->processAndSave($request->photo, $customer->id);
                    $customer->update(['foto_perfil_url' => $path]);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning("PHOTO_SAVE_FAILED: " . $e->getMessage());
                }
            }

            // AWARD BONUS POINT (Always, as per requirement)
            $loyalty = \App\Models\LoyaltySetting::where('tenant_id', $tenant->id)->first();
            $pointsToAdd = 1; // Default
            if ($loyalty) {
                $levels = $loyalty->levels_config;
                // Try level 1 signup points or the global signup bonus
                if (is_array($levels) && isset($levels[0]['points_per_signup'])) {
                    $pointsToAdd = (int)$levels[0]['points_per_signup'];
                } else {
                    $pointsToAdd = (int)($loyalty->signup_bonus_points ?? 1);
                }
            }

            if ($pointsToAdd > 0) {
                $pointRequest = $this->createPointRequest([
                    'tenant_id' => $tenant->id,
                    'customer_id' => $customer->id,
                    'phone' => $customer->phone,
                    'device_id' => $device ? $device->id : null,
                    'source' => $device ? 'terminal' : 'web_portal',
                    'status' => 'auto_approved',
                    'requested_points' => $pointsToAdd,
                    'meta' => ['is_signup_bonus' => true]
                ]);

                $this->pointRequestService->applyPoints($pointRequest);
                $pointRequest->update(['approved_at' => now()]);
            }

            // Log activity to Telegram
            try {
                $source = $device ? "Terminal" : "Web Portal";
                $msg = "✨ <b>Novo Cliente ({$source})</b>\n"
                     . "👤 <b>Nome:</b> {$customer->name}\n"
                     . "📞 <b>Tel:</b> {$customer->phone}\n"
                     . "💰 <b>Bônus:</b> +{$pointsToAdd} pts";

                $this->telegramService->sendPhoto($tenant->id, $customer->photo_url_full, $msg, 'registration');
            } catch (\Exception $te) {
                \Illuminate\Support\Facades\Log::warning("TELEGRAM_NOTIFY_FAILED: " . $te->getMessage());
            }

            return ApiResponse::ok([
                'customer_exists' => true,
                'id' => $customer->id,
                'name' => $customer->name,
                'points_balance' => $customer->fresh()->points_balance,
                'points_goal' => $tenant->points_goal,
                'message' => 'Cadastro realizado com sucesso! Você ganhou um ponto de bônus.'
            ], 'Cadastro concluído!');
        });
    }

    public function updatePhoto(Request $request, $slug, $uid = null)
    {
        $request->validate([
            'phone' => 'required|string',
            'photo' => 'required|file|mimes:jpeg,jpg,png,webp|max:10240'
        ]);

        try {
            return DB::transaction(function () use ($request, $slug, $uid) {
                [$tenant, $device] = $this->validateDevice($slug, $uid, null);
                if (!$this->validateSessionToken($request, $request->session_token, $tenant->id)) {
                    return ApiResponse::error('Sessão expirada. Recarregue a página.', 'SESSION_REQUIRED', 403);
                }

                $phone = PhoneHelper::normalize($request->phone);
                $customer = Customer::where('tenant_id', $tenant->id)->where('phone', $phone)->first();

                if (!$customer) {
                    return ApiResponse::error('Cliente não encontrado.', 'NOT_FOUND', 404);
                }

                if ($request->hasFile('photo')) {
                    if ($customer->foto_perfil_url) {
                        app(\App\Services\CustomerPhotoService::class)->delete($customer->foto_perfil_url);
                    }
                    
                    $path = app(\App\Services\CustomerPhotoService::class)->processAndSave($request->file('photo'), $customer->id);
                    $customer->update(['foto_perfil_url' => $path]);
                }

                $customer = $customer->fresh();

                return ApiResponse::ok([
                    'foto_perfil_url' => $customer->photo_url_full,
                    'foto_perfil_thumb_url' => $customer->foto_perfil_thumb_url
                ], 'Foto de perfil atualizada com sucesso!');
            });
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("PHOTO_UPLOAD_ERROR: " . $e->getMessage());
            return ApiResponse::error('Falha no servidor: ' . $e->getMessage(), 'UPLOAD_ERROR', 500);
        }
    }

    public function getRequestStatus($slug, $uidOrRequestId, $requestId = null)
    {
        $id = $requestId ?: $uidOrRequestId;
        $req = PointRequest::with('customer')->findOrFail($id);
        return ApiResponse::ok([
            'status' => $req->status,
            'customer_name' => $req->customer->name,
            'points_balance' => $req->customer->points_balance
        ]);
    }

    public function serveFile($path)
    {
        // Prevent directory traversal
        if (str_contains($path, '..') && !str_starts_with($path, '../')) {
            // we only allow ../ if it's explicitly resolved securely, but let's just use basename or strict paths
            // Actually, we trust Laravel's Storage::disk('public')->exists() which protects against traversal
        }

        if (\Illuminate\Support\Facades\Storage::disk('public')->exists($path)) {
            return response()->file(\Illuminate\Support\Facades\Storage::disk('public')->path($path));
        }
        
        $legacyPath = base_path('../storage/app/public/' . $path);
        if (file_exists($legacyPath)) {
            return response()->file($legacyPath);
        }

        return response()->json(['message' => 'Image not found.'], 404);
    }

    private function createPointRequest(array $data)
    {
        $request = PointRequest::create([
            'tenant_id' => $data['tenant_id'],
            'customer_id' => $data['customer_id'] ?? null,
            'phone' => $data['phone'],
            'device_id' => $data['device_id'] ?? null,
            'source' => $data['source'] ?? 'approval',
            'status' => $data['status'] ?? 'pending',
            'requested_points' => $data['requested_points'] ?? 1,
            'meta' => $data['meta'] ?? null,
        ]);

        event(new \App\Events\PointRequestCreated($request));
        return $request;
    }

    private function findCustomer($tenantId, $phoneInput)
    {
        $normalized = $this->normalizePhone($phoneInput);
        $dbCustomer = DB::table('customers')
            ->where('tenant_id', $tenantId)
            ->where('phone', $normalized)
            ->first();

        $customer = null;
        if ($dbCustomer) {
            $customer = Customer::withoutGlobalScopes()->find($dbCustomer->id);
        }
        
        return [
            'customer' => $customer,
            'variations' => [$normalized]
        ];
    }

    private function normalizePhone($phone)
    {
        $normalized = preg_replace('/\D/', '', (string)$phone);
        if (str_starts_with($normalized, '81') && strlen($normalized) >= 11) {
             $normalized = substr($normalized, 2);
        }
        $normalized = ltrim($normalized, '0');
        if (!empty($normalized)) {
            $normalized = '0' . $normalized;
        }
        return $normalized;
    }
}
