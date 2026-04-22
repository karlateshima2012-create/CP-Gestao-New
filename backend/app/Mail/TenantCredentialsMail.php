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
        $uniqueId = uniqid();
        $date = date('d/m/Y H:i:s');
        
        return "
        <div style=\"font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #ffffff;\">
            <h2 style=\"color: #38B6FF; text-align: center; font-size: 24px; margin-bottom: 25px;\">Bem-vindo ao CP Gestão!</h2>
            
            <p style=\"font-size: 16px; line-height: 1.5;\">Olá <strong>{$this->tenant->owner_name}</strong> ({$this->tenant->name}),</p>
            <p style=\"font-size: 16px; line-height: 1.5;\">Seu acesso ao sistema <strong>CPgestão Fidelidade</strong> foi configurado com sucesso.</p>
            
            <div style=\"background-color: #f8fbff; padding: 25px; border-radius: 10px; margin: 25px 0; border: 1px solid #e1f0ff;\">
                <p style=\"margin-top: 0; color: #555; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;\">📍 Dados de Acesso:</p>
                <div style=\"margin: 15px 0; font-size: 16px;\">
                    <span style=\"margin-right: 10px;\">📧</span> <strong>Login:</strong> <span style=\"color: #38B6FF;\">{$this->loginEmail}</span>
                </div>
                <div style=\"margin: 15px 0; font-size: 16px;\">
                    <span style=\"margin-right: 10px;\">🔑</span> <strong>Senha:</strong> <span style=\"background: #fff; padding: 2px 5px; border: 1px dashed #ccc; border-radius: 4px;\">{$this->password}</span>
                </div>
            </div>

            <div style=\"margin: 25px 0;\">
                <p style=\"font-weight: bold; font-size: 16px;\">Como acessar seu painel:</p>
                <div style=\"margin-left: 10px;\">
                    <p style=\"margin: 12px 0; font-size: 15px; line-height: 1.4;\">
                        🌐 <strong>Site Oficial:</strong><br>
                        <a href=\"{$this->landingPageUrl}\" style=\"color: #38B6FF; text-decoration: none; font-weight: bold;\">{$this->landingPageUrl}</a><br>
                        <span style=\"color: #888; font-size: 13px;\">(Basta clicar em 'Login' no menu superior)</span>
                    </p>
                    
                    <p style=\"margin: 12px 0; font-size: 15px; line-height: 1.4;\">
                        🔗 <strong>Link Direto:</strong><br>
                        <a href=\"{$this->systemUrl}\" style=\"color: #38B6FF; text-decoration: none; font-weight: bold;\">{$this->systemUrl}</a>
                    </p>
                </div>
            </div>

            <div style=\"padding: 15px; background-color: #fff5f5; border-left: 4px solid #dc3545; border-radius: 4px; margin-top: 30px;\">
                <p style=\"color: #dc3545; font-size: 14px; margin: 0; font-weight: bold;\">
                    ⚠️ Importante: Por segurança, você deverá alterar sua senha logo no primeiro acesso.
                </p>
            </div>

            <hr style=\"border: none; border-top: 1px dotted #eee; margin: 40px 0 20px 0;\">
            
            <p style=\"font-size: 11px; color: #aaa; text-align: center; line-height: 1.6;\">
                CP Gestão - Sistema de Fidelidade e CRM<br>
                Enviado em: {$date} | Ref: {$uniqueId}
            </p>
            
            <div style=\"display:none; white-space:nowrap; font:15px courier; line-height:0;\">
                &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; 
                &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
            </div>
        </div>
        ";
    }
}
