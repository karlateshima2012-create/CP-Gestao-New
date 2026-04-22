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
            <p>Olá <strong>{$this->tenant->owner_name}</strong> ({$this->tenant->name}),</p>
            <p>Seu acesso ao sistema <strong>CPgestão Fidelidade</strong> foi configurado com sucesso.</p>
            
            <div style=\"background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;\">
                <p style=\"margin-top: 0;\"><strong>📍 Dados de Acesso:</strong></p>
                <p style=\"margin: 10px 0;\">📧 Login: <code>{$this->loginEmail}</code></p>
                <p style=\"margin: 10px 0;\">🔑 Senha: <code>{$this->password}</code></p>
            </div>

            <div style=\"margin: 20px 0;\">
                <p><strong>Você pode acessar seu painel de duas formas:</strong></p>
                <ol style=\"padding-left: 20px;\">
                    <li style=\"margin-bottom: 10px;\">Pelo nosso <strong>Site Oficial:</strong> <a href=\"{$this->landingPageUrl}\" style=\"color: #38B6FF;\">{$this->landingPageUrl}</a> (clique em Login)</li>
                    <li style=\"margin-bottom: 10px;\">Pela <strong>Link Direto:</strong> <a href=\"{$this->systemUrl}\" style=\"color: #38B6FF;\">{$this->systemUrl}</a></li>
                </ol>
            </div>

            <p style=\"color: #dc3545; font-size: 0.9em; font-style: italic;\">
                * Por segurança, você deverá alterar sua senha logo no primeiro acesso.
            </p>

            <hr style=\"border: none; border-top: 1px solid #eee; margin: 30px 0;\">
            <p style=\"font-size: 0.8em; color: #999; text-align: center;\">
                Este é um e-mail automático. Se precisar de suporte, responda a este e-mail ou entre em contato via WhatsApp.
            </p>
        </div>
        ";
    }
}
