<!DOCTYPE html>
<html lang="pt-br" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>Recuperação de Senha</title>
    <style>
        :root { color-scheme: light; supported-color-schemes: light; }
        /* Força fundo branco no Modo Escuro (Apple Mail/Outlook) */
        @media (prefers-color-scheme: dark) {
            .body-wrapper { background-color: #ffffff !important; }
            .content-table { background-color: #ffffff !important; }
            h1, h2, p, span, td, strong { color: #000000 !important; }
            .footer-text { color: #64748b !important; }
            .btn-blue { background-color: #38B6FF !important; color: #ffffff !important; }
        }
    </style>
</head>
<body class="body-wrapper" style="font-family: 'Inter', sans-serif; background-color: #ffffff !important; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
    <div style="background-color: #ffffff !important;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff !important; padding: 40px 20px;">
            <tr>
                <td align="center" style="background-color: #ffffff !important;">
                    <table class="content-table" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff !important; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden;">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #ffffff !important;">
                                <div style="display: inline-block; padding: 16px 24px; background-color: #ffffff !important; border-radius: 16px; border: 2px solid #38B6FF;">
                                    <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #000000 !important; letter-spacing: 0.1em; text-transform: uppercase;">CP GESTÃO</h1>
                                    <p style="margin: 4px 0 0 0; font-size: 9px; font-weight: 800; color: #38B6FF !important; letter-spacing: 0.3em; text-transform: uppercase;">Creative Print</p>
                                </div>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="padding: 20px 40px 40px 40px; background-color: #ffffff !important;">
                                <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #000000 !important; text-align: center;">Recuperação de Senha</h2>
                                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #334155 !important; text-align: center;">
                                    Olá! Recebemos uma solicitação de redefinição de senha para sua conta no sistema <strong>CP Gestão</strong>.
                                </p>

                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff !important;">
                                    <tr>
                                        <td align="center" style="padding: 10px 0; background-color: #ffffff !important;">
                                            <a href="{{ $resetUrl }}" class="btn-blue" style="display: inline-block; background-color: #38B6FF !important; color: #ffffff !important; padding: 18px 36px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 10px 15px -3px rgba(56, 182, 255, 0.4);">
                                                Redefinir Minha Senha
                                            </a>
                                        </td>
                                    </tr>
                                </table>

                                <p style="margin: 32px 0 16px 0; font-size: 13px; line-height: 20px; color: #64748b !important; text-align: center; font-style: italic;">
                                    Este link é válido por 60 minutos.
                                </p>
                                
                                <div style="margin-top: 32px; padding-top: 32px; border-top: 1px solid #f1f5f9;">
                                    <p style="margin: 0; font-size: 13px; color: #94a3b8 !important; text-align: center;">
                                        Se você não solicitou isso, ignore este e-mail com segurança.
                                    </p>
                                </div>
                            </td>
                        </tr>

                        <!-- Footer Details -->
                        <tr>
                            <td style="padding: 0 40px 40px 40px; background-color: #ffffff !important;">
                                <div style="background-color: #f8fafc !important; border-radius: 12px; padding: 16px;">
                                    <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 800; color: #94a3b8 !important; text-align: center;">BOTÃO NÃO FUNCIONA?</p>
                                    <p style="margin: 0; font-size: 11px; color: #38B6FF !important; word-break: break-all; text-align: center;">
                                        <a href="{{ $resetUrl }}" style="color: #38B6FF !important; text-decoration: none;">{{ $resetUrl }}</a>
                                    </p>
                                </div>
                            </td>
                        </tr>
                    </table>

                    <!-- Bottom Copyright -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin-top: 24px;">
                        <tr>
                            <td style="text-align: center;">
                                <p class="footer-text" style="margin: 0; font-size: 11px; font-weight: 900; color: #000000 !important; text-transform: uppercase; letter-spacing: 0.2em;">
                                    © 2026 Creative Print. Todos os direitos reservados.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
