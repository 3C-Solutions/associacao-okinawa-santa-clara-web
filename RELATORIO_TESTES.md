# Relatório final de testes — Associação Okinawa de Santa Clara

**Data:** 26/11/2026  
**Ambiente E2E:** Vite local em `http://127.0.0.1:4173`  
**Navegador:** Chromium (Playwright)

## Resultado final

| Área | Resultado |
| --- | --- |
| Testes unitários de Financeiro | Aprovado — 10/10 |
| Testes unitários de Usuários | Aprovado — 5/5 |
| Testes E2E de login e sessão | Aprovado — 7/7 |
| Build de produção | Aprovado |
| Total automatizado | **22/22 aprovados** |

## Escopo validado

### Financeiro

O conjunto de testes validou consulta de famílias, exportação XLSX, regras de valores e datas, entradas, despesas e solicitações de reembolso.

### Usuários

O conjunto de testes validou montagem e validação do cadastro, criação, exclusão e exportação de usuários.

### Login e sessão

A suíte E2E isolada simulou os endpoints de autenticação no navegador, sem usar credenciais, tokens ou dados reais. Os cenários aprovados foram:

1. Campos obrigatórios e formato de e-mail.
2. Mostrar e ocultar senha.
3. Mensagem para credenciais inválidas (`401`).
4. Login bem-sucedido, normalização do e-mail e abertura do painel.
5. Primeiro acesso direcionado para a troca obrigatória de senha.
6. Bloqueio seguro quando o contexto da conta viola o contrato.
7. Usabilidade do formulário em viewport de celular (`390 × 844 px`).

## Comandos executados

```sh
npm run test:finance
npm run test:usuarios
npm run test:e2e
npm run build
```

O build concluiu com sucesso. O bundle principal gerado possui 506,28 kB minificados (150,09 kB gzip); o Vite emitiu apenas um aviso de tamanho de chunk acima de 500 kB.

## Evidências

- Relatório interativo do Playwright: [QA/playwright-report/index.html](./QA/playwright-report/index.html)
- Resultados e capturas E2E: [QA/test-results](./QA/test-results)
- Detalhamento da suíte de autenticação: [QA/relatorio-login.md](./QA/relatorio-login.md)

## Pendências do ambiente integrado

Os itens abaixo foram observados contra a API local e não impedem os testes isolados com mocks:

1. `GET /api/auth/me` precisa retornar `primeiroAcesso` como booleano. Sem a propriedade, o frontend bloqueia o painel depois de um login válido.
2. `GET /api/publico/departamentos` retornou `401` no ambiente local, embora seja consumido pela página pública.

## Conclusão

A validação automatizada prevista foi concluída com sucesso: **22 de 22 testes aprovados** e build de produção gerado. Antes de homologar contra o backend local, recomenda-se corrigir as duas pendências de contrato/autorização acima e repetir a jornada autenticada com uma conta real em modo somente leitura.
