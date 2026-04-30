<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class AuditLogMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Somente logamos métodos que alteram estado (POST, PUT, PATCH, DELETE)
        if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            $user = $request->user();
            
            // Sanitização do body para não logar senhas
            $payload = $request->except(['password', 'password_confirmation', 'token', 'session_token']);

            Log::channel('audit')->info('ADMIN_ACTION', [
                'user_id' => $user?->id,
                'user_email' => $user?->email,
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'payload' => $payload,
                'status' => $response->getStatusCode()
            ]);
        }

        return $response;
    }
}
