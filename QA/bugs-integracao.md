# Bugs de integração observados

## QA-001 — Notícias indisponíveis para perfil autenticado

- **Severidade:** alta
- **Como reproduzir:** entrar com uma conta com acesso ao painel e abrir **Notícias**.
- **Resultado esperado:** lista de notícias ou estado vazio.
- **Resultado obtido:** alerta `O registro solicitado não foi encontrado. Atualize os dados e tente novamente.`
- **Impacto:** a conta não consegue consultar ou administrar notícias.
- **Hipótese:** rota de listagem/detalhe recebe ou encaminha um identificador inexistente.

## QA-002 — Configurações indisponíveis para perfil autenticado

- **Severidade:** alta
- **Como reproduzir:** entrar no painel e abrir **Configurações**.
- **Resultado esperado:** dados da própria conta para consulta/edição.
- **Resultado obtido:** alerta `O registro solicitado não foi encontrado. Atualize os dados e tente novamente.`
- **Impacto:** o usuário não pode consultar ou alterar seus dados.
- **Hipótese:** a consulta de `/minha-conta` não encontra o perfil do usuário autenticado.

## QA-003 — Departamentos indisponíveis

- **Severidade:** alta
- **Como reproduzir:** entrar no painel, abrir **Cadastros** e selecionar **Departamentos**.
- **Resultado esperado:** listagem de departamentos.
- **Resultado obtido:** alerta `O registro solicitado não foi encontrado. Atualize os dados e tente novamente.`
- **Impacto:** impede consulta e gestão de departamentos.
- **Hipótese:** erro no endpoint de consulta ou no vínculo entre a conta e os dados de departamento.

## QA-004 — Sessão real expira de forma intermitente

- **Severidade:** média
- **Como reproduzir:** autenticar no ambiente local e manter a sessão aberta durante a exploração.
- **Resultado esperado:** sessão válida pelo período informado pelo backend.
- **Resultado obtido:** a aplicação retornou ao login exibindo `Sua sessão expirou ou sua conta não possui mais acesso` antes da conclusão da exploração.
- **Impacto:** pode interromper o uso de telas autenticadas.
- **Observação:** a nova autenticação abriu o painel normalmente; é necessário correlacionar com os horários e respostas de `/auth/me`.

## QA-005 — Reembolsos não carregam solicitações

- **Severidade:** alta
- **Como reproduzir:** entrar no painel, abrir **Financeiro** e selecionar a aba **Reembolsos**.
- **Resultado esperado:** lista de solicitações, ou estado vazio sem erro.
- **Resultado obtido:** alerta `O registro solicitado não foi encontrado. Atualize os dados e tente novamente.`
- **Impacto:** o Financeiro não consegue consultar ou analisar reembolsos.
- **Hipótese:** endpoint de listagem de solicitações usa uma referência inexistente no ambiente local.
