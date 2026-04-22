<?php

namespace App\Mail;

use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TenantCredentialsMail extends Mailable
{
    use Queueable, SerializesModels;

    public $tenant;
    public $password;
    public $loginEmail;
    public $landingPageUrl = 'https://saibamaiscpgestao.creativeprintjp.com/';
    public $systemUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(Tenant $tenant, $loginEmail, $password, $systemUrl)
    {
        $this->tenant = $tenant;
        $this->loginEmail = $loginEmail;
        $this->password = $password;
        $this->systemUrl = $systemUrl;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->from('suporte@creativeprintjp.com', 'CP Gestão Suporte')
            ->subject('Seu acesso ao CP Gestão e Fidelidade foi configurado!')
            ->html($this->renderHtml());
    }

    private function renderHtml()
    {
        return "
        <div style=\"font-family: sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;\">
            <h2 style=\"color: #38B6FF; text-align: center;\">Bem-vindo ao CP Gestão!</h2>
            <p>Olá <strong>{$this->tenant->owner_name}</strong> (<em>{$this->tenant->name}</em>),</p>
            <p>Seu acesso ao sistema <strong>CPgestão Fidelidade</strong> foi configurado com sucesso.</p>
            
            <div style=\"background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;\">
                <p><strong>📍 Dados de Acesso:</strong></p>
                <p style=\"margin: 5px 0;\">📧 Login: <code>{$this->loginEmail}</code></p>
                <p style=\"margin: 5px 0;\">🔑 Senha: <code>{$this->password}</code></p>
            </div>

            <div style=\"margin: 20px 0; text-align: center;\">
                <p><strong>🔗 Painel de Gestão (Acesso Principal):</strong></p>
                <a href=\"{$this->landingPageUrl}\" style=\"display: inline-block; background: #38B6FF; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-bottom: 10px;\">Acessar Landing Page</a>
                <p style=\"font-size: 0.85em; color: #666;\">
                    <em>URL do Sistema (Alternativa): <a href=\"{$this->systemUrl}\" style=\"color: #38B6FF;\">{$this->systemUrl}</a></em>
                </p>
            </div>

            <p style=\"background: #fff3cd; padding: 10px; border-radius: 5px; font-size: 0.9em;\">
                <strong>⚠️ OBS:</strong> Por segurança, sua senha deve ser redefinida no primeiro acesso. 
                (A nova senha deve ter exatamente 8 dígitos, contendo pelo menos uma letra maiúscula e um número).
            </p>

            <hr style=\"border: none; border-top: 1px solid #eee; margin: 30px 0;\">
            <p style=\"font-size: 0.8em; color: #999; text-align: center;\">
                Este é um e-mail automático. Em caso de dúvidas, responda para suporte@creativeprintjp.com
            </p>
        </div>
        ";
    }
}
