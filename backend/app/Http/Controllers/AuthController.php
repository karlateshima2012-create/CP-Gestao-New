<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Mail;
use App\Mail\ResetPasswordMail;
use App\Mail\LoginSecurityAlertMail;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $email = Str::lower($request->email);
        $throttleKey = "login_attempt:{$email}|" . $request->ip();

        if (\Illuminate\Support\Facades\RateLimiter::tooManyAttempts($throttleKey, 3)) {
            $seconds = \Illuminate\Support\Facades\RateLimiter::availableIn($throttleKey);
            
            \Log::info("Login blocked for {$email} at IP {$request->ip()}. Retrying in {$seconds}s.");

            return response()->json([
                'ok' => false,
                'message' => "Muitas tentativas falhas. Sua conta foi temporariamente bloqueada por segurança. Tente novamente em {$seconds} segundos.",
                'retry_after' => $seconds
            ], 429);
        }

        $user = User::where('email', $request->email)->with('tenant')->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            // Incrementa falhas e define o tempo de bloqueio para 60 segundos
            \Illuminate\Support\Facades\RateLimiter::hit($throttleKey, 60);
            
            $attempts = \Illuminate\Support\Facades\RateLimiter::attempts($throttleKey);
            \Log::warning("Failed login attempt #{$attempts} for {$email} from IP {$request->ip()}");
            
            // Notificação após 3 falhas
            if ($attempts === 3 && $user) {
                try {
                    Mail::to($user->email)->send(new LoginSecurityAlertMail($user->email, $request->ip()));
                    \Log::info("Security alert email sent to {$user->email}");
                } catch (\Exception $e) {
                    \Log::error("Failed to send security alert: " . $e->getMessage());
                }
            }

            throw ValidationException::withMessages([
                'email' => ["E-mail ou senha incorretos. Tentativa {$attempts} de 3 antes do bloqueio."],
            ]);
        }

        \Illuminate\Support\Facades\RateLimiter::clear($throttleKey);

        $token = $user->createToken('auth_token')->plainTextToken;

        return \App\Http\Responses\ApiResponse::ok([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }

    public function me(Request $request)
    {
        return $request->user()->load('tenant');
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'ok' => true,
            'message' => 'Token revogado com sucesso'
        ]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'password' => 'required|min:8|max:255|regex:/[A-Z]/|regex:/[0-9]/|confirmed',
        ]);

        $user = $request->user();
        $user->update([
            'password' => Hash::make($request->password),
            'must_change_password' => false
        ]);

        return response()->json([
            'ok' => true,
            'message' => 'Senha alterada com sucesso'
        ]);
    }

    // Note: Standard Laravel Password Resets usually use a dedicated table
    // For simplicity in this CRM, we'll implement a straightforward flow
    // In a full production app, you'd use Password::broker()

    public function forgotPassword(Request $request)
    {
        $email = preg_replace('/\.+$/', '', trim($request->email));
        $request->merge(['email' => $email]);
        
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $email)->first();
        if (!$user) {
            // Return success even if user not found for security
            return response()->json(['ok' => true, 'message' => 'Se o e-mail existir, um link foi enviado.']);
        }

        $token = Str::random(60);
        \DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            ['token' => $token, 'created_at' => now()]
        );

        // Generate dynamic link for frontend
        $frontendUrl = config('app.frontend_url');
        if (!$frontendUrl) {
            // Se não estiver no config, detectamos o domínio atual automaticamente
            $scheme = $request->getScheme();
            $host = $request->getHost();
            $frontendUrl = "{$scheme}://{$host}";
        }
        
        $resetUrl = rtrim($frontendUrl, '/') . "/?reset_token={$token}&email=" . urlencode($request->email);

        try {
            Mail::to($request->email)->send(new ResetPasswordMail($resetUrl));
        } catch (\Exception $e) {
            // Log if needed, but return success to avoid leaking email existence
            \Log::error("Failed to send reset email: " . $e->getMessage());
        }

        return response()->json([
            'ok' => true, 
            'message' => 'Link de recuperação enviado.',
            'debug_token' => app()->environment('local') ? $token : null
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required',
            'password' => 'required|min:8|max:255|regex:/[A-Z]/|regex:/[0-9]/|confirmed',
        ]);

        $reset = \DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->token)
            ->first();

        if (!$reset || now()->subHours(2) > $reset->created_at) {
            return response()->json(['ok' => false, 'message' => 'Token inválido ou expirado.'], 400);
        }

        $user = User::where('email', $request->email)->first();
        $user->update([
            'password' => Hash::make($request->password),
            'must_change_password' => false
        ]);

        \DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json(['ok' => true, 'message' => 'Senha redefinida com sucesso.']);
    }

    public function completeOnboarding(Request $request)
    {
        $request->user()->update(['onboarding_completed' => true]);

        return response()->json([
            'ok' => true,
            'message' => 'Onboarding concluído'
        ]);
    }
}
