# Relatório QA — Login e sessão

**Data:** 25/11/2026  
**Ambiente automatizado:** Vite local em `http://127.0.0.1:4173`  
**Navegador:** Chromium (Playwright)

## Resumo

Foi criada e executada uma suíte E2E isolada para o fluxo de login. Os endpoints de autenticação foram simulados no navegador; portanto, os testes são repetíveis e não usam credenciais, tokens ou dados reais.

| Grupo | Resultado |
| --- | --- |
| E2E de login, agenda e smoke global | 10 aprovados |
| Testes de Financeiro existentes | 10 aprovados |
| Testes de Usuários existentes | 5 aprovados |
| Total executado | 25 aprovados |
| Build de produção | Aprovado |

## Cenários E2E cobertos

1. Campos obrigatórios e formato de e-mail.
2. Mostrar e ocultar senha.
3. Mensagem apresentada para credenciais inválidas (HTTP 401).
4. Login bem-sucedido, normalização do e-mail e acesso ao painel.
5. Primeiro acesso redirecionado para definição obrigatória de senha.
6. Resposta inválida de contexto de conta bloqueada com mensagem de indisponibilidade.
7. Usabilidade do formulário em viewport de celular de 390 × 844 px.
8. Criação, edição e exclusão de evento da Agenda em armazenamento isolado.
9. Navegação desktop pelas áreas autorizadas do painel, sem ações destrutivas.
10. Navegação pública e autenticada em viewport de celular.

## Resultado da execução

Comando:

```sh
npm run test:e2e
```

Resultado: **10 aprovados em 35,3 segundos**.

## Evidências

- Relatório interativo com as capturas dos cenários: [playwright-report/index.html](./playwright-report/index.html)

As capturas foram geradas automaticamente após cada teste. Em caso de falha futura, a configuração também preserva vídeo e trace na pasta de resultados.

## Achados ainda relevantes no ambiente integrado

Estes achados foram observados fora dos mocks da suíte:

1. A API de contexto autenticado precisa retornar `primeiroAcesso` como booleano. Sem o campo, o frontend bloqueia o painel após um login válido.
2. A rota pública de departamentos retornou HTTP 401 no ambiente local, embora seja consumida pela página pública.

## Como executar novamente

```sh
npm install
npx playwright install chromium
npm run test:e2e
```

Para abrir o relatório HTML:

```sh
npm run test:e2e:report
```
