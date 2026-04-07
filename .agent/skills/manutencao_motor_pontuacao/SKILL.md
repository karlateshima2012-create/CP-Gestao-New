---
name: Manutenção do Motor de Pontuação
description: Regra de leitura estrita e obrigatória sempre que a solicitação do usuário envolver alterações em pontos de clientes, fluxos de resgate, travas, webhook do Telegram, mensagens de notificação, aprovações automáticas ou comportamento do fidelidade (Point Engine e Webhooks).
---

# 🛑 ALERTA DE SEGURANÇA E INTEGRIDADE ARQUITETURAL 🛑

Você, Agente Inteligente, está **EXPRESSAMENTE PROIBIDO** de modificar regras de pontuação, botões do Telegram, fluxos de resgate, textos das mensagens interativas ou verificações de restrição (como cooldown e meta atingida) neste projeto sem antes realizar as seguintes ações:

1. **LEITURA OBRIGATÓRIA:** Você deve imperativamente consultar o arquivo `DOCUMENTACAO_MOTOR_PONTUACAO.md` na raiz do projeto para entender as travas da regra de negócios atual.
2. **ZERO EFEITO CASCATA:** É vital garantir que qualquer correção solicitada **não fira ou desfaça** a blindagem anti-fraude já implementada. Exemplo Crítico: A exibição do botão "Entregar Prêmio" jamais pode existir de forma síncrona/ao mesmo tempo com o "Aprovar Ponto" de uma mesma solicitação de visita que precede o atingimento da meta de fato.
3. **PREVENÇÃO DE SOBRESCRITAS INDEVIDAS:** Todo o parse do Histórico do Webhook via regex não pode ser acidentalmente corrompido em novas formatações de texto. 
4. **PEDIDO DE PERMISSÃO:** Nenhuma mudança de estado profundo (`app/Services/PointEngineService.php`, `Controllers/Webhooks/*` ou `Listeners/*`) que cause quebras do fluxo estabelecido no `DOCUMENTACAO_MOTOR_PONTUACAO.md` deve ser feita sem elaboração de plano e confirmação expressa do usuário. 

Se a tarefa de hoje esbarra no fidelidade e pontos: **PARE e vá ler a documentação base!**
