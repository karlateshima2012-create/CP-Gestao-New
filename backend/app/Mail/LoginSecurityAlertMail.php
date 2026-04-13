<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Queue\SerializesModels;

class LoginSecurityAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public $email;
    public $ip;

    public function __construct($email, $ip)
    {
        $this->email = $email;
        $this->ip = $ip;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address('suporte@creativeprintjp.com', 'suporte@creativeprintjp.com'),
            subject: 'Alerta de Segurança: Tentativas de Login',
        );
    }

    public function content(): Content
    {
        return new Content(
            html: "
                <div style='font-family: sans-serif; padding: 20px; color: #1e293b; background: #f8fafc;'>
                    <div style='max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);'>
                        <h2 style='color: #ef4444; margin: 0 0 20px 0; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em;'>Alerta de Segurança</h2>
                        <p style='color: #475569; font-size: 15px; line-height: 1.6;'>Olá,</p>
                        <p style='color: #475569; font-size: 15px; line-height: 1.6;'>Detectamos <strong>3 tentativas falhas de login</strong> para sua conta no sistema <strong>CP Gestão</strong>.</p>
                        
                        <div style='background: #f1f5f9; padding: 24px; border-radius: 16px; margin: 30px 0; font-family: monospace; font-size: 13px;'>
                            <p style='margin: 0 0 10px 0; color: #64748b;'><strong>E-MAIL:</strong> <span style='color: #0f172a;'>{$this->email}</span></p>
                            <p style='margin: 0 0 10px 0; color: #64748b;'><strong>IP DE ORIGEM:</strong> <span style='color: #0f172a;'>{$this->ip}</span></p>
                            <p style='margin: 0;'><strong>DATA:</strong> <span style='color: #0f172a;'>" . now()->format('d/m/Y H:i') . "</span></p>
                        </div>
                        
                        <p style='color: #475569; font-size: 14px; line-height: 1.6;'>Se foi você, não se preocupe. Caso contrário, recomendamos que você redefina sua senha e ative medidas de segurança adicionais.</p>
                        
                        <div style='margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px;'>
                            <p style='color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; text-align: center;'>Este é um aviso automático gerado pelo sistema de proteção do CP Gestão.</p>
                        </div>
                    </div>
                </div>
            ",
        );
    }
}
