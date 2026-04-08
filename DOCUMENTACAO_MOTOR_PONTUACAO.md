# Motor de Pontuação e Regras de Negócio (CP Gestão e Fidelidade)

Este arquivo documenta toda a lógica do Motor de Pontuação (Point Engine), regras de negócio avançadas, mensagens do sistema, travas de segurança e fluxos de aprovação de pontos ou resgates do projeto. Toda a documentação descrita baseia-se na implementação refatorada garantindo segurança contra fraudes ("blinded architecture") e um fluxo limpo de "Aprovar Ponto" x "Premiação".

---

## 🔒 1. Travas e Cooldowns (Regras de Segurança)
Para evitar que clientes mal-intencionados abusem do sistema (como ler o mesmo QR Code várias vezes ou passar no Totem repetidas vezes), existem diversas travas em vigor:

1. **Cooldown de Visita Geral (12 Horas) — Inteligente:**
   - O sistema bloqueia uma nova pontuação se o cliente tiver alguma visita registrada nas últimas **12 horas**.
   - **Exceção de Cadastro:** Pontos de **Bônus de Cadastro** (Signup Bonus) não acionam o cooldown de 12 horas. O cliente pode se cadastrar (ganhar o bônus) e efetuar sua primeira compra no estabelecimento no mesmo dia sem ser bloqueado.
   - **Comportamento para Meta Atingida:** Se o cliente bater a meta e consultar o terminal em menos de 12h, a mensagem exibida será: *"🎉 Meta Atingida! Seu prêmio estará esperando na sua próxima visita!"*.
   - **Liberação de Resgate (> 12h):** Após transcorrida a visita de 12 horas, se o cliente consultar o saldo ou tentar pontuar, a mensagem mudará para: *"🎁 Você tem um prêmio esperando! Informe ao atendente para resgatar e subir para o próximo nível."*
   - No estado de resgate pendente (> 12h), o sistema dispara um alerta ao lojista (Telegram/Dashboard) solicitando a entrega do prêmio.
   - **REGRA DE TETO:** O saldo do cliente **NUNCA** ultrapassa a meta. Ao atingir o valor exato configurado, o sistema bloqueia qualquer nova pontuação automática ou manual até que o ciclo seja reiniciado após a entrega do prêmio.

2. **Cooldown Auto-Checkin (Pelo Totem):**
   - Se o dispositivo opera no modo `auto_checkin`, verifica-se o intervalo mínimo parametrizado pelo *PlanService* respectivo da Loja.
   - *Mensagem de Erro/Retorno:* HTTP 429 - `CHECKIN_COOLDOWN` - "Check-in já realizado hoje!"

3. **Trava de Meta Atingida (Reward Pending):**
   - Quando o saldo de pontos *já for maior ou igual à meta estipulada*, o motor **impede** o registro de novos ganhos de pontos.
   - **Fluxo de Mensagens (Modelo A):**
      - *Antes de 12h:* "🎉 Meta Atingida! Resgate na próxima visita."
      - *Após 12h:* "🎁 Você tem um prêmio esperando! Informe ao atendente para resgatar."
   - **Trava de Redenção:** O cliente não volta a pontuar até que o prêmio seja resgatado (via Telegram ou Dashboard).

4. **Cadastro Único e Início no Bronze:**
   - O cadastro é vinculado ao número de telefone. Cada cliente se cadastra apenas **uma vez** e permanece no programa.
   - **Regra de Entrada:** Todo novo cliente inicia obrigatoriamente no nível **BRONZE**. Apenas este nível possui configuração de "Pontos de Cadastro".

5. **Progressão de Nível e Loop no Último Nível:**
   - Ao bater a meta, o resgate ocorre na **próxima visita** (após o cooldown de 12h).
   - **Loop no Último Nível:** O sistema identifica dinamicamente o último nível ativo (seja Nível 1, 2, 3 ou 4). Ao resgatar o prêmio do último nível, o cliente permanece nele (loop), reiniciando o saldo com o ponto da visita atual.
   - No ato do resgate:
      1. O cliente sobe de nível (ou reinicia o loop no último).
      2. O cliente **ganha os pontos equivalentes a 1 visita** do novo nível/ciclo.

6. **Limite de Contatos do Plano:**
   - Se o estabelecimento bateu no limite total de contatos do seu plano ativo (ex: limitação do plano Pro ou Elite), o sistema aborta a criação de novos clientes e notifica via Telegram.
   - *Mensagem do Telegram:* "🚫 **Limite Atingido!** O cadastro de novos clientes foi pausado."

4. **Token de Segurança Anti-Fraude (QR Code / NFC):**
   - Se um token único é transferido, a API o queima (consumo imediato via `QrTokenService`) impossibilitando que aquele mesmo token seja lido uma segunda vez ou por terceiros fora da loja.

8. **Validação Rigorosa de Telefone (Novo):**
   - O sistema agora exige que todos os números de telefone sigam o formato padrão:
     - **Limpeza (Sanitização):** Todos os espaços, parênteses e hífens são removidos antes da validação.
     - **Regra de 11 Dígitos:** O número resultante deve conter exatamente **11 dígitos numéricos**.
     - **Prefixos Obrigatórios:** Os três primeiros dígitos devem ser obrigatoriamente **070, 080 ou 090**.
   - Se o número for inválido, o sistema impede o prosseguimento e exibe o alerta: *"Número Inválido: Por favor, verifique se o número está correto."*

---

## 🚦 2. Fluxos Baseados no Plano do Lojista

Existe um comportamento de automação diferente a depender do plano contratado pelo estabelecimento.

### Plano ELITE 🏆
No plano Elite, toda visita possui **Auto-Aprovação**. 
- Status da visita é gerado imediatamente como `aprovado`.
- `PointMovement` (extrato de pontos) da entrada é gerado de forma síncrona.
- Os saldos do cliente (`points_balance` e `attendance_count`) são atualizados de imediato.
- **Notificação:** "✅ PONTO REGISTRADO" informando saldo e horário, sem necessidade de aceitar cliques adicionais.

### Plano PRO (e Demais) 🚀
As visitas dependem da moderação (via App, Totem ou Telegram) do lojista.
- Criação inicial da visita com o status: `pendente`.
- Nenhum saldo de pontos é movimentado na criação.
- Dispara notificação baseada em botões e fluxos de aprovação ("Solicitação de ponto").

---

## 📱 3. Fluxo de TELAS (Interface Pública /p/)

Este fluxo descreve a jornada do cliente ao acessar a URL de fidelidade (`/p/{slug}`), que permite consulta de saldo e novos cadastros.

### A. Tela de Entrada: PORTAL DO CLIENTE
- **Visual:** Interface limpa com logo e imagem de capa da loja.
- **Campo:** "Digite seu telefone" (Máscara automática: 090-0000-0000).
- **Validação:** Aplica a regra de 11 dígitos e prefixos (070/080/090) ao clicar em entrar.
- **Botão:** **ENTRAR**.
  - *Comportamento:* Se o telefone não for válido, exibe modal de erro solicitando verificação.

### B. Fluxo: Cliente Já Cadastrado (TELA DE SALDO DO CLIENTE)
Se o número for identificado, o cliente entra imediatamente na visualização de sua ficha:
- **Elementos da Tela:**
  - Imagem de perfil circular (editável, permite upload de foto pelo cliente).
  - Nome completo do cliente.
  - Nível atual no programa (Badge: Bronze, Prata, Ouro, Diamante).
  - **Saldo Disponível:** Mostrado em destaque (Ex: 8 / 10).
  - **Status da Meta:** Texto dinâmico indicando quantos pontos faltam ou se a meta foi atingida.
  - **Prêmio:** Exibe o nome do prêmio configurado para o nível atual.

### C. Fluxo: Cliente Não Cadastrado (PRIMEIRA VEZ AQUI? 🌟)
Caso o número digitado seja válido mas não exista no banco de dados:
- **Título:** PRIMEIRA VEZ AQUI? 🌟
- **Mensagem:** "Não encontramos este número. Cadastre-se em segundos para começar a ganhar pontos!"
- **Ações:**
  1. **CADASTRAR AGORA:** Abre a tela de cadastro com o telefone já preenchido e bloqueado para edição (garante integridade).
  2. **Tentar outro número:** Limpa o campo e volta para a tela inicial.

### D. Tela de Cadastro Público
- **Campos Obrigatórios:** Nome Completo, Cidade e Província.
- **Botão:** **CADASTRAR E GANHAR PONTO**.
- **Resultado:** O cliente é cadastrado, recebe o bônus de boas-vidas (se configurado no Bronze) e vê a tela de sucesso:
  - **Mensagem:** *"Obrigado pela visita! Ponto Adicionado!"*
  - **Botão:** **VER MEU SALDO** (direciona para a Tela de Saldo).

---

## 💬 4. Fluxo de Notificações, Interações e Webhooks (Telegram)

O componente `TelegramWebhookController` atua em forte união com a refatoração do Motor de Pontos garantindo mensagens curtas, não-duplicadas (as atualizações editam as mensagens originais passadas para limpeza de histórico) e sem botões prematuros de resgate.

### A. Novo Cadastro de Cliente
- Cliente novato detectado: Ganha os pontos de "Signup Bonus" configurados e auto-aprovados.
- Telegram é notificado: "🆕 **Novo Cliente (Pontuação Balcão)**". Caso feito no CRM da Loja (manual): "👤 **Novo Cliente Cadastrado (CRM)**".

### B. Solicitação de Ponto Padrão (Meta NÃO alcançada no ato)
- Gera alerta de notificação via bot (pode acompanhar áudio habilitado pelo estabelecimento).
- *Alerta Padrão:* "⭐ Solicitação de ponto" + Dados do cliente.
- É enviado o "Teclado Inline":
  - ✅ **APROVAR PONTO** (chama o callback `approve_visit:{id}`)
  - ❌ **Negar** (chama o callback `reject_visit:{id}`)

#### Casos Especiais nas Solicitações:
1. **Quase Meta (Notificação Antecipada):** Se a aprovação manual da *visita recém-enviada* fizer o usuário furar a meta programada, o bot envia uma string forte no topo: "🏆 **META SENDO ALCANÇADA!** Ao aprovar, o cliente atingirá a meta!". No entanto, *aqui não há o botão "Premiar Agora"* prematuro, quebrando fraudes.  
2. **Ponto Aprovado:** A mensagem de notificação atualiza o texto (via Webhook) para um banner final: "**Ponto aprovado ✅** (removendo os botões dinâmicos) -> mostrando que ação final de aceite foi processada e mostrando o saldo recém contabilizado.

### C. Sistema de Entrega de Prêmios (Restrito ao Limiar da Meta)
- É a política estrita de "next-visit". 
- Se um cliente estiver com saldo `>=` Meta, ao realizar um check-in, **ele NÃO PONTUA MAS SIM GERA O GATILHO DO PRÊMIO**:
   - `PointEngineService` emite a captura do QR que cai no retorno json: "Você atingiu a meta! Pode resgatar seu prêmio. Você não pode pontuar até reiniciar no próximo nível."
   - É enviado ao Painel de Telegram Lojista um card de Alerta de Resgate:
   
   _"🏆 **RESGATE PENDENTE** 🏆"_ 
   _"O cliente *{nome}* já atingiu a meta aguarda o prêmio. Clique abaixo para entregar a recompensa e reiniciar o ciclo:"_

- **Somente através deste alerta (ou no dashboard pelo botão resgatar cliente apto)** existirá o botão unificado de: 
   - 🎁 **ENTREGAR PRÊMIO** (chama callback `redeem_reward:{id}`).

#### Lógica Externa de Resgate (`handleRedeemReward` & Controller):
Quando acionado (via botão do dashboard no `ClientController` ou Telegram Webhook):
1. **Validação Estrita:** Checa de novo se `points_balance >= goal` para a segurança garantida do nível.
2. **Execução Virtual:** Um Objeto Fake Request (`mockRequest`) é montado para ser injetado passivamente no motor com metas de conversão de ponto de resgate (metadado de `is_redemption`).
3. **Mudança de Ciclo:** A mensagem reage entregando à loja um fechamento limpo substituindo por completo pelo header final "🏆 **RECOMPENSA ENTREGUE!**" atualizando ciclo, o rank/nível do cliente e resetando ou descontando seus pontos apropriados.

---

## 🛠️ 5. Benefícios Arquiteturais Atuais (Conclusões)
- **Eliminação Total de Estados Confusos:** Removeu a ambiguidade de ter botões "Aprovar" mesclados e concorrendo com botões de "Resgate" simultaneamente.
- **Cooldown Educativo:** O cliente recebe feedback positivo mesmo quando está na trava de 12h, desde que tenha batido a meta.
- **Configuração Estática:** Metas e níveis do programa devem ser configurados preferencialmente antes do início do programa para garantir a integridade da jornada do cliente.

---
*Documentação atualizada em 08/04/2026 - CPgestao-v2.7.5*
