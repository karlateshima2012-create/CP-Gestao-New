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
            <p>Olá <strong>{$this->tenant->owner_name}</strong>! 👋</p>
            <p>Seu acesso ao sistema <strong>CPgestão Fidelidade</strong> foi configurado com sucesso.</p>
            
            <div style=\"margin: 20px 0;\">
                <p><strong>🌐 Site Oficial:</strong><br>
                <a href=\"{$this->landingPageUrl}\" style=\"color: #38B6FF;\">{$this->landingPageUrl}</a><br>
                <small>(Basta clicar em 'Login' para acessar seu painel)</small></p>

                <p><strong>🔗 Link Direto do Sistema:</strong><br>
                <a href=\"{$this->systemUrl}\" style=\"color: #38B6FF;\">{$this->systemUrl}</a></p>

                <p><strong>📧 E-mail:</strong><br>
                <code>{$this->loginEmail}</code></p>

                <p><strong>🔑 Senha Provisória:</strong><br>
                <code>{$this->password}</code></p>
            </div>

            <p style=\"background: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 0.9em; border-left: 4px solid #38B6FF;\">
                No primeiro acesso, o sistema irá redirecionar automaticamente para a alteração de senha, que é obrigatória para sua segurança.
            </p>

            <hr style=\"border: none; border-top: 1px solid #eee; margin: 30px 0;\">
            <p style=\"font-size: 0.8em; color: #999; text-align: center;\">
                Este é um e-mail automático. Em caso de dúvidas, responda para suporte@creativeprintjp.com
            </p>
        </div>
        ";
    }
}
