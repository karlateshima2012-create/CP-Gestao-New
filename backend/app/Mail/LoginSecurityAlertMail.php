<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
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

    public function build()
    {
        return $this->subject('Alerta de Segurança: Tentativas de Login')
                    ->html("
                        <div style='font-family: sans-serif; padding: 20px; color: #1e293b;'>
                            <h2 style='color: #ef4444;'>Alerta de Segurança</h2>
                            <p>Olá,</p>
                            <p>Detectamos <strong>3 tentativas falhas de login</strong> para sua conta no <strong>CP Gestão</strong>.</p>
                            <div style='background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;'>
                                <p style='margin: 0;'><strong>E-mail:</strong> {$this->email}</p>
                                <p style='margin: 0;'><strong>IP de Origem:</strong> {$this->ip}</p>
                                <p style='margin: 0;'><strong>Data:</strong> " . now()->format('d/m/Y H:i') . "</p>
                            </div>
                            <p>Se foi você, não se preocupe. Caso contrário, recomendamos que você redefine sua senha imediatamente.</p>
                            <p style='color: #64748b; font-size: 12px; margin-top: 30px;'>Este é um aviso automático gerado pelo sistema de proteção do CP Gestão.</p>
                        </div>
                    ");
    }
}
