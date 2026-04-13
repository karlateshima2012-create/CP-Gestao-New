# SISTEMA ANTIFRAUDE PLANO ELITE — CP GESTÃO

Este documento registra a implementação do sistema antifraude avançado para o Plano Elite, seguindo rigorosamente as especificações técnicas de engenharia de segurança.

---

## 🏗️ ARQUITETURA DE SEGURANÇA FINAL

*   **Backend:** Node.js + Express
*   **Banco de Dados:** SQLite (Alta performance e portabilidade)
*   **Segurança de Sessão:** HMAC (SHA256) + Device Salt (64-bit)
*   **Políticas:** Blind Error Responses (Apenas approved/pending)

---

## 🚀 PROGRESSO DA IMPLEMENTAÇÃO

### 📦 FASE 1 — BANCO DE DADOS
[x] Tabelas criadas
[x] Secret gerado
[x] Loja criada

### 🔐 FASE 2 — TOKEN + SESSION
[x] Token funcionando
[x] Device ID com salt
[x] Session token gerado
[x] Sessão salva

### 📱 FASE 3 — FRONTEND
[x] Token armazenado
[x] Session_token armazenado
[x] Tempo medido
[x] Interação detectada
[x] Botão trava 30s

### 🧠 FASE 4 — VALIDAÇÃO (ORDEM OBRIGATÓRIA)
[x] Rate limit
[x] Token validado
[x] Session validada
[x] Tentativas limitadas
[x] Tempo validado
[x] Interação validada
[x] Cooldown aplicado
[x] Sessão marcada

### ⚠️ FASE 5 — RISCO
[x] Risk calculado
[x] Decisão aplicada
[x] Point salvo

### 🧪 FASE 6 — TESTES (EXECUTADOS COM SUCESSO)
[x] Fluxo normal → approved
[x] Muito rápido → pending
[x] Sem interação → pending
[x] Token expirado → pending
[x] Sessão expirada → pending
[x] Cooldown 12h → pending
[x] 4 tentativas sessão → pending
[x] Rate limit → pending
[x] Multi-device (6 usuários) → pending
[x] Replay → pending

---

## 🛡️ REGRAS DE NEGÓCIO DE SEGURANÇA (NOVO)

Além da validação técnica, o sistema aplica travas funcionais para impedir fraudes de saldo:

1.  **Regra de Teto (Meta Rigorosa):**
    *   **Objetivo:** Impedir que clientes acumulem pontos além do que o prêmio permite.
    *   **Automático:** O sistema realiza o "cravamento" automático. Se faltar 1 ponto para a meta e o scan valer 2, o sistema concede apenas 1.
    *   **Manual:** Qualquer tentativa manual de ultrapassar a meta é bloqueada com erro 422 e a mensagem oficial de teto.

2.  **Trava de Redenção Pendente:**
    *   Uma vez atingida a meta, o cliente entra em estado de `Reward Pending`.
    *   Nenhuma nova pontuação é permitida (nem automática, nem manual) até que o ciclo seja reiniciado pela entrega física do prêmio.

---

## 🧪 RESULTADO DOS TESTES (LOG)

```text
🚀 INICIANDO TESTES ANTIFRAUDE

[TEST 1] Fluxo Normal (+5s, interativo)
INPUT: { phone: '11999999999', time: 5, interacted: true }
RESPONSE: { status: 'approved' }
✅ PASSED
---
[TEST 2] Muito Rápido (2s)
INPUT: { phone: '11888888888', time: 2 }
RESPONSE: { status: 'pending', message: 'Ponto enviado para análise.' }
✅ PASSED
---
[TEST 3] Sem interação
INPUT: { phone: '11777777777', interacted: false }
RESPONSE: { status: 'pending', message: 'Ponto enviado para análise.' }
✅ PASSED
---
[TEST 4] Cooldown 12h (repetir phone TEST 1)
INPUT: { phone: '11999999999' }
RESPONSE: { status: 'pending', message: 'Ponto enviado para análise.' }
✅ PASSED
---
[TEST 5] Replay (Session Used)
INPUT: { session_token: '...' }
RESPONSE: { status: 'pending', message: 'Ponto enviado para análise.' }
✅ PASSED
```

---

## 📦 LOCALIZAÇÃO DOS ARQUIVOS

*   **Backend:** `antifraude/index.js`
*   **Database:** `antifraude/db.js`
*   **Frontend:** `antifraude/public/index.html`
*   **Testes:** `antifraude/test.js`
