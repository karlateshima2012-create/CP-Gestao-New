# 🔍 Diagnóstico e Correções de Deploy: CP Gestão New

Este documento detalha o histórico de erros encontrados, as soluções aplicadas no workflow de deploy e as recomendações finais para estabilidade do sistema na Hostinger.

---

## 🛑 Histórico de Erros Encontrados

### 1. Erro 403 Forbidden (Raiz) e 404 Not Found (Arquivos)
- **Causa**: Inicialmente, os arquivos estavam sendo enviados para a pasta errada (`public_html` em vez de `public_html/cpgestaonew`). Além disso, o servidor LiteSpeed da Hostinger estava bloqueando o acesso devido a diretivas PHP (`php_value`) incompatíveis no arquivo `.htaccess`.

### 2. Interferência do WordPress (Site Principal)
- **Causa**: O site principal instalado na raiz (`creativeprintjp.com`) é um WordPress. As regras de reescrita dele estavam interceptando as requisições do subdomínio. O usuário relatou erros de caminhos como `wp-content/uploads/`, confirmando que o WordPress pai estava tentando processar o subdomínio.

### 3. Erro Crítico PHP: `Call to undefined function Illuminate\Filesystem\exec()`
- **Causa**: A função `exec()` estava desabilitada no PHP da Hostinger. O Laravel utiliza essa função para criar caches e links de armazenamento. Sem ela, o backend travava durante a finalização do deploy.

---

## 🛠️ Ações Tomadas (Workflow de Deploy)

### ✅ Correção de Caminhos e SCP
- Atualizamos o `source` do SCP para `deploy/**` (recursivo) e configuramos o `strip_components: 1`.
- Criamos um script de **Self-Healing** (Auto-Cura) que:
    1. Procura pelo arquivo `default.php` da Hostinger para identificar a pasta raiz **real** do subdomínio.
    2. Move automaticamente os arquivos para essa pasta identificada.

### ✅ Isolamento Total no `.htaccess`
- Adicionamos a regra `RewriteOptions None` e `DirectoryIndex index.html index.php`.
- Isso garante que o subdomínio ignore as regras do WordPress pai e saiba exatamente qual arquivo de índice carregar.

### ✅ Ponte de Compatibilidade (index.php)
- Criamos um arquivo `index.php` minimalista que apenas faz o `include 'index.html'`. Isso resolve problemas em servidores que exigem um arquivo PHP para iniciar o processo de execução em diretórios.

### ✅ Permissões e Segurança
- Forçamos a permissão `755` em todas as pastas e arquivos via SSH.
- Bloqueamos o acesso direto ao arquivo `.env` para proteção de dados sensíveis.

---

## 🚀 Sugestão de Correção e Manutenção

Para garantir que o sistema continue funcionando perfeitamente, recomendamos:

1.  **Document Root**: No Painel da Hostinger, certifique-se de que o subdomínio `cpgestaonew` aponta para `/public_html/cpgestaonew`.
2.  **Função exec()**: Se houver erros no backend, verifique se a função `exec` continua habilitada nas configurações PHP da Hostinger.
3.  **Ambiente de Produção**: O repositório `CP-Gestao-New` agora está configurado para deploy automático em cada `push` na branch `master`.

---
**Diagnóstico realizado pela equipe Antigravity (Advanced Agentic Coding).**
