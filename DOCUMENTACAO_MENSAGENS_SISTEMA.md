# 📖 Dicionário Geral de Mensagens e Comunicação (CP Gestão)

Este documento centraliza toda a camada de comunicação do sistema, dividida entre o que o **Cliente** vê (Interface) e o que o **Lojista** recebe (Notificações).

---

## 📱 1. Interface do Cliente (Portal e Totem)
Mensagens exibidas nas telas do `/p/{slug}` e `/terminal/{slug}`.

### A. Telas de Sucesso (Pós-Pontuação)
*   **Plano ELITE (Auto-Aprovação):**
    *   **Título:** "Ponto registrado com sucesso!"
    *   **Subtítulo:** "Você pode consultar seu saldo clicando no botão abaixo:"
*   **Plano PRO (Aprovação Manual):**
    *   **Título:** "Ponto registrado com sucesso!"
    *   **Subtítulo:** "Assim que aprovado, ele entrará no seu saldo."

### B. Fluxo de Cadastro (Novos Clientes)
*   **Convite:** "PRIMEIRA VEZ AQUI? Cadastre-se em segundos para começar a ganhar pontos!"
*   **Sucesso no Cadastro:** "Cadastro realizado com sucesso! Você recebeu 1 ponto de bônus, consulte seu saldo clicando no botão abaixo:"

### C. Evolução e Metas (Level Up)
*   **Conquista de Nível:** "Parabéns, {Nome}! Você conquistou o nível: {Nível}"
*   **Feedback:** "Seus benefícios foram atualizados! Agora você ganha pontos mais rápido."
*   **Barra de Progresso:**
    *   *Meta Atingida:* "Meta Atingida! 🎁"
    *   *Progresso:* "Faltam {X} pontos para: {Nome do Prêmio}"

### D. Alertas e Modals (Feedback Instantâneo)
*   **Número Inválido:** "Número Inválido: Por favor, verifique se o número está correto." (Disparado quando não segue o padrão 070/080/090 ou falta dígitos).
*   **QR Code Inválido:** "QR Inválido: Este QR Code já foi utilizado ou é inválido."
*   **Aguarde (Cooldown):** "Aguarde 12h entre visitas para pontuar novamente."
*   **Saldo Insuficiente:** "Saldo insuficiente para resgate."
*   **Solicitação Negada:** "Solicitação Recusada: Sua solicitação não foi aprovada pelo gerente."

---

## 🤖 2. Notificações do Lojista (Telegram)
Modelos de alertas enviados em tempo real para o canal da loja.

### A. Novos Cadastros
*   **Via Terminal:** `✨ Novo Cliente (Terminal) 👤 Nome: {$name} 📞 Tel: {$phone} 💰 Bônus: +{$points} pts`
*   **Via CRM (Manual):** `👤 Novo Cliente Cadastrado (CRM) Nome: {$name} Telefone: {$phone}`

### B. Gestão de Pontos
*   **Solicitação Manual (Botões):** `📥 SOLICITAÇÃO DE PONTO 👤 Cliente: {$name} 💰 Saldo: {$balance} pts [ Aprovar ] [ Negar ]`
*   **Confirmação Automática:** `✅ PONTO COMPUTADO 👤 Cliente: {$name} 💰 Saldo: {$balance} pts 🎯 Meta: {$goal} pts`
*   **Alerta Crítico:** `🏆 META SENDO ALCANÇADA! Ao aprovar, o cliente atingirá a meta!`

### C. Resgate e Premiação
*   **Alerta de Resgate:** `🏆 RESGATE PENDENTE 🏆 O cliente {$name} atingiu a meta. [ 🎁 ENTREGAR PRÊMIO ]`
*   **Sucesso:** `🏆 RECOMPENSA ENTREGUE! 🏆 Cliente avançou de nível. 💰 Novo Saldo: {$points} pts`

---

## ⚠️ 3. Estados Técnicos e Erros de Sistema
Mensagens de "segurança" exibidas em casos de falha de rede ou configuração.

*   **Carregamento:** "CARREGANDO TERMINAL..."
*   **Erro de Dispositivo:** "DISPOSITIVO INVÁLIDO" (Exibido se a URL estiver mal formada ou a loja estiver inativa).
*   **Instabilidade:** "Houve uma instabilidade momentânea no processamento do seu ponto."
*   **Limite de Contatos:** "🚫 Limite Atingido! O cadastro de novos clientes foi pausado."

---
*Documentação consolidada em 11/04/2026 - CP Gestão v3.0*
