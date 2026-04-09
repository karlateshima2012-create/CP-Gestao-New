# 🚀 Guia Oficial de Deploy: CP Gestão New

Este documento é a fonte única de verdade para o deploy deste projeto. O deploy é **100% automatizado** via GitHub Actions para o subdomínio `cpgestaonew.creativeprintjp.com`.

---

## 🏗️ 1. Preparação Inicial (Hostinger hPanel)
Antes de realizar o primeiro deploy ou em caso de migração, certifique-se de configurar o ambiente:

1.  **Banco de Dados**: Crie um Banco de Dados MySQL/MariaDB no painel da Hostinger e anote: `DB_DATABASE`, `DB_USERNAME` e `DB_PASSWORD`.
2.  **Versão PHP**: Garanta que o subdomínio está usando **PHP 8.2 ou superior**.
3.  **Habilitar SSH**: Vá em **Avançado > Acesso SSH** e clique em **Habilitar**.
4.  **Conectividade Local**: Para configurar o acesso SSH do seu computador ao servidor:
    ```bash
    ssh-keyscan -p 65002 46.202.186.144 >> ~/.ssh/known_hosts
    ```

---

## 🏗️ 2. Como Funciona o Deploy Automático
Toda vez que você realiza um `git push` para a branch **master**, o GitHub Actions realiza:
1.  **Build do Frontend:** Utiliza Node 20 para compilar o React/Vite.
2.  **Build do Backend:** Instala as dependências do Laravel via Composer.
3.  **Cleanup (SSH):** Limpa os arquivos antigos na Hostinger (preservando `/storage`).
4.  **Transferência (SCP):** Envia os novos arquivos (pasta `deploy/`) para o servidor.
5.  **Finalização (SSH):** Executa as migrações (`migrate`) e limpa os caches do Laravel.

---

## 🔑 3. Configuração de Secrets (GitHub)
No repositório (Settings > Secrets and variables > Actions), configure as seguintes Secrets:

| Secret | Descrição | Exemplo |
| :--- | :--- | :--- |
| `SSH_HOST` | IP do servidor da Hostinger | `46.202.186.144` |
| `SSH_USER` | Usuário de acesso SSH (hPanel) | `u176367625` |
| `SSH_PASSWORD` | Senha de acesso SSH | `**********` |
| `SSH_PORT` | Porta SSH (Padrão Hostinger: 65002) | `65002` |
| `DB_DATABASE` | Nome do banco de dados criado | `u176367625_cpgestaonew` |
| `DB_USERNAME` | Usuário do banco de dados | `u176367625_cpgestaonew` |
| `DB_PASSWORD` | Senha do banco de dados | `**********` |
| `APP_KEY` | Chave de segurança do Laravel | `base64:XG8p...` |

---

## 📂 4. Estrutura e Permissões no Servidor
O projeto é entregue no diretório:
`domains/creativeprintjp.com/public_html/cpgestaonew`

### Permissões de Pastas
O deploy ajusta as permissões automaticamente, mas em caso de erro 500, verifique:
- `api_backend/storage` (775)
- `api_backend/bootstrap/cache` (775)

> [!IMPORTANT]
> **Document Root**: No painel da Hostinger, o subdomínio deve apontar exatamente para `/public_html/cpgestaonew`.

---

## ⚠️ 5. Lições Aprendidas (Manutenção)

- **Simplicidade nos Scripts**: Mantenha os comandos de SSH no `deploy.yml` simples (evite `if/else` complexos).
- **Funções PHP**: A função `exec()` deve estar **Habilitada** no PHP da Hostinger para que o Laravel limpe os caches corretamente.

---

## ✅ Checklist de Sucesso
- [ ] Frontend: `https://cpgestaonew.creativeprintjp.com`
- [ ] Backend Status: `https://cpgestaonew.creativeprintjp.com/api/up`
