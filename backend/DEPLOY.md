# Guia de Deploy Automatizado (GitHub Actions)

Este projeto utiliza **GitHub Actions** para automação total do deploy no servidor Hostinger (Subdomínio Único).

## 🚀 Como funciona o Deploy?

O deploy é disparado automaticamente sempre que um **push** é realizado nas branches `master` ou `main`.

### O que a automação faz:
1. **Frontend:** Faz o `npm install` e `npm run build`.
2. **Backend:** Faz o `composer install`, configura as permissões e limpa caches.
3. **Ambiente:** Gera o arquivo `.env` de produção usando os **Secrets** do GitHub.
4. **Transferência:** Envia os arquivos via `SCP` e executa comandos remotos via `SSH`.

---

## 🛠️ Configuração de Secrets (GitHub)

Para que o deploy funcione corretamente, as seguintes chaves devem estar configuradas em **Settings > Secrets and variables > Actions** no seu repositório GitHub:

### Banco de Dados
- `DB_DATABASE`: Nome do banco de dados na Hostinger.
- `DB_USERNAME`: Usuário do banco de dados.
- `DB_PASSWORD`: Senha do banco de dados.

### Acesso ao Servidor (SSH)
- `SSH_HOST`: IP ou hostname do servidor.
- `SSH_USER`: Usuário SSH.
- `SSH_PASSWORD`: Senha SSH.
- `SSH_PORT`: Porta SSH (padrão 65002 na Hostinger).

### Notificações
- `TELEGRAM_BOT_TOKEN`: Token do seu bot do Telegram.
  - *Nota: O sistema possui um fallback automático para o token atual caso este secret esteja vazio.*

---

## ⚠️ Checklist de Manutenção
- **Migrações:** O deploy executa `php artisan migrate --force` automaticamente.
- **Cache:** Configurações e rotas são cacheadas no deploy para máxima performance.
- **Permissões:** As pastas `storage` e `bootstrap/cache` são configuradas automaticamente com permissão de escrita.

---

*Última atualização: 14/04/2026*
