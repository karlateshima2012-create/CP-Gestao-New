<?php

namespace App\Utils;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Throwable;

class Monitor
{
    /**
     * Captura uma exceção e envia alerta formatado para o Telegram.
     * 
     * @param Throwable $e
     * @return void
     */
    public static function handleException(Throwable $e): void
    {
        // Ignorar erros 404 ou 401 se não quisermos spam de roteamento
        if ($e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException) {
            return;
        }

        self::sendToTelegram($e);
    }

    /**
     * Envia um alerta crítico manual (instrumentação de pontos específicos).
     * 
     * @param string $title
     * @param string $message
     * @param array $context
     * @return void
     */
    public static function logCritical(string $title, string $message, array $context = []): void
    {
        self::sendToTelegram(null, [
            'title' => $title,
            'message' => $message,
            'context' => $context
        ]);
    }

    /**
     * Core logic para envio de mensagens com rate limiting e fail-safe.
     */
    private static function sendToTelegram(?Throwable $e, array $manualData = []): void
    {
        try {
            $botToken = config('services.telegram.monitor_token') ?: config('services.telegram.bot_token');
            $chatId = config('services.telegram.monitor_chat_id') ?: env('TELEGRAM_MONITORING_CHAT_ID', '1280107206');

            if (!$botToken || !$chatId) {
                return;
            }

            // Identificador único para o erro (Rate Limiting)
            $errorIdentifier = $e ? ($e->getFile() . $e->getLine() . $e->getCode()) : ($manualData['title'] . ($manualData['message'] ?? ''));
            $cacheKey = 'monitor_error_' . md5($errorIdentifier);

            // Rate limiting: 1 alerta a cada 5 minutos para erros idênticos
            if (Cache::has($cacheKey)) {
                return;
            }

            $timestamp = now()->format('d/m/Y H:i:s');
            $url = request()->fullUrl();
            $method = request()->method();
            $ip = request()->ip();

            if ($e) {
                $isFatal = ($e instanceof \Error || $e instanceof \ParseError || $e instanceof \CompileError);
                $isDB = ($e instanceof \Illuminate\Database\QueryException || $e instanceof \PDOException);
                
                if ($isDB) {
                    $title = "🔴 <b>FALHA NO BANCO DE DADOS</b>";
                } elseif ($isFatal) {
                    $title = "🔥 <b>ERRO FATAL PHP</b>";
                } else {
                    $title = "💥 <b>EXCEÇÃO NÃO TRATADA</b>";
                }
                
                $errorMessage = $e->getMessage();
                $file = $e->getFile();
                $line = $e->getLine();
                $stackTrace = substr($e->getTraceAsString(), 0, 800) . '...';
            } else {
                $title = "🚨 <b>{$manualData['title']}</b>";
                $errorMessage = $manualData['message'];
                $file = $manualData['context']['file'] ?? 'N/A';
                $line = $manualData['context']['line'] ?? 'N/A';
                $stackTrace = $manualData['context']['stack'] ?? 'N/A';
            }

            // Formatação rica para Telegram (HTML)
            $formattedMessage = "{$title}\n\n";
            $formattedMessage .= "🔴 <b>Erro:</b> <code>{$errorMessage}</code>\n";
            $formattedMessage .= "📂 <b>Arquivo:</b> <code>{$file}</code>\n";
            $formattedMessage .= "📍 <b>Linha:</b> {$line}\n\n";
            $formattedMessage .= "<b>CONTEXTO:</b>\n";
            $formattedMessage .= "⏰ <b>Hora:</b> {$timestamp}\n";
            $formattedMessage .= "🔗 <b>URL:</b> {$url}\n";
            $formattedMessage .= "📡 <b>Método:</b> {$method}\n";
            $formattedMessage .= "👤 <b>IP:</b> {$ip}\n\n";
            $formattedMessage .= "📜 <b>STACK TRACE:</b>\n<pre>{$stackTrace}</pre>";

            // Envio via HTTP nativo (mais resiliente)
            Http::timeout(5)->post("https://api.telegram.org/bot{$botToken}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $formattedMessage,
                'parse_mode' => 'HTML',
            ]);

            // Grava no cache por 5 minutos
            Cache::put($cacheKey, true, now()->addMinutes(5));

        } catch (Throwable $internalException) {
            // Fail-safe: se o monitor falhar, apenas logamos no arquivo para não derrubar o app
            Log::error("Monitor Telegram Fail-safe: " . $internalException->getMessage());
        }
    }
}
