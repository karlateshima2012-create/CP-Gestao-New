# REGRAS DE ALTERAÇÃO - MOTOR DE PONTUAÇÃO

Atenção Agente / Desenvolvedor,

Sempre que a sua tarefa envolver alterar pontuação de cliente, mensagens de sucesso e fluxos lógicas de webhook, **PARE E LEIA O ARQUIVO `DOCUMENTACAO_MOTOR_PONTUACAO.md`** localizado na raiz deste projeto.

O objetivo desta pasta `rules/` (atrelada debaixo das Skills Automáticas do ecossistema do seu Agente Inteligente) é assegurar que todas as edições nas regras de pontuações obedeçam às seguintes diretrizes:

1. **Nenhum texto de segurança deve ser sobrescrito sem autorização do responsável do projeto.**
2. **Arquitetura Blindada:** As travas anti-fraude e ciclos de next-visit não devem ser contornados, para que tudo se mantenha funcionando como esperado.
3. Não crie atalhos prematuros (concorrência de fluxo) que possam gerar um efeito cascata quebrando outros casos de sucesso e notificações validadas.

Consulte a base de conhecimento de pontuação antes de prosseguir!
