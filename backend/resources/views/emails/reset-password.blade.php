<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperação de Senha</title>
</head>
<body style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc; margin: 0; padding: 0;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                            <div style="display: inline-block; padding: 16px 24px; background-color: #f1f5f9; border-radius: 16px; border: 1px solid #e2e8f0;">
                                <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: 0.1em; text-transform: uppercase;">CP GESTÃO</h1>
                                <p style="margin: 4px 0 0 0; font-size: 8px; font-weight: 800; color: #64748b; letter-spacing: 0.3em; text-transform: uppercase;">Creative Print</p>
                            </div>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 20px 40px 40px 40px;">
                            <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a; text-align: center;">Recuperação de Senha</h2>
                            <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #475569; text-align: center;">
                                Você está recebendo este e-mail porque recebemos uma solicitação de redefinição de senha para sua conta no sistema <strong>CP Gestão</strong>.
                            </p>

                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center" style="padding: 10px 0;">
                                        <a href="{{ $resetUrl }}" style="display: inline-block; background-color: #38B6FF; color: #ffffff; padding: 18px 36px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 10px 15px -3px rgba(56, 182, 255, 0.2);">
                                            Redefinir Minha Senha
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 32px 0 16px 0; font-size: 13px; line-height: 20px; color: #64748b; text-align: center; font-style: italic;">
                                Este link de redefinição de senha expirará em 60 minutos por segurança.
                            </p>
                            
                            <div style="margin-top: 32px; padding-top: 32px; border-top: 1px solid #f1f5f9;">
                                <p style="margin: 0; font-size: 13px; color: #94a3b8; text-align: center;">
                                    Se você não solicitou esta alteração, ignore este e-mail. Nenhuma ação adicional é necessária.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer Details -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;">
                            <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px;">
                                <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">Problemas com o botão?</p>
                                <p style="margin: 0; font-size: 11px; color: #38B6FF; word-break: break-all; text-align: center;">
                                    <a href="{{ $resetUrl }}" style="color: #38B6FF; text-decoration: none;">{{ $resetUrl }}</a>
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>

                <!-- Bottom Copyright -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin-top: 24px;">
                    <tr>
                        <td style="text-align: center;">
                            <p style="margin: 0; font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.2em;">
                                © 2026 Creative Print. Todos os direitos reservados.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
