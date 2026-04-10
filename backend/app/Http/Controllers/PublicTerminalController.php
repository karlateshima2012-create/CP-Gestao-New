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

        $balance = $customer->points_balance;
        $goal = $tenant->points_goal;
        
        // Load loyalty settings for custom goals/levels if any
        $loyalty = \App\Models\LoyaltySetting::where('tenant_id', $tenant->id)->first();
        if ($loyalty && is_array($loyalty->levels_config) && isset($loyalty->levels_config[0])) {
             $goal = (int)($loyalty->levels_config[0]['goal'] ?? $goal);
        }

        return ApiResponse::ok([
            'customer_exists' => true,
            'id' => $customer->id,
            'name' => $customer->name,
            'points_balance' => $balance,
            'points_goal' => $goal,
            'remaining' => max(0, $goal - $balance),
            'loyalty_level_name' => $customer->loyalty_level_name,
            'foto_perfil_url' => $customer->photo_url_full,
            'history' => PointMovement::where('customer_id', $customer->id)->latest()->limit(5)->get()->map(fn($m) => [
                'amount' => $m->points, 'type' => $m->type, 'date' => $m->created_at->format('d/m/Y')
            ])
        ]);
    }

    public function earn(Request $request, $slug, $uid = null)
    {
        return DB::transaction(function () use ($request, $slug, $uid) {
            [$tenant, $device] = $this->validateDevice($slug, $uid, $request->token);
            if (!$this->validateSessionToken($request, $request->session_token, $tenant->id)) {
                return ApiResponse::error('Sessão inválida.', 'SESSION_REQUIRED', 403);
            }
            if (!$device) {
                return ApiResponse::error('Esta ação exige presença física na loja.', 'DEVICE_REQUIRED', 403);
            }
            $phone = PhoneHelper::normalize($request->phone);
            $customer = Customer::where('tenant_id', $tenant->id)->where('phone', $phone)->first();
            return $this->pointEngineService->processEarn($tenant, $device, $customer, $request->token, $request->all());
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
            [$tenant, $device] = $this->validateDevice($slug, $uid, $request->token);
            if (!$device) {
                return ApiResponse::error('Presença física exigida para cadastro.', 'DEVICE_REQUIRED', 403);
            }
            if ($tenant->isLimitReached()) {
                return ApiResponse::error('Limite da loja atingido.', 'LIMIT_REACHED', 403);
            }

            $phone = PhoneHelper::normalize($request->phone);
            $customer = Customer::create([
                'tenant_id' => $tenant->id,
                'name' => $request->name,
                'phone' => $phone,
                'source' => 'terminal'
            ]);

            return ApiResponse::ok(['customer_exists' => true, 'id' => $customer->id, 'name' => $customer->name], 'Cadastro realizado!');
        });
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
}
