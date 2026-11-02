# Associação Okinawa Santa Clara

Aplicação web da associação, com site público, acesso à área administrativa e painéis para gestão de associados, famílias, departamentos, agenda, notícias e finanças.

## Desenvolvimento

Instale as dependências e inicie o servidor local:

```sh
npm install
npm run dev
```

Para gerar a versão de produção:

```sh
npm run build
```

## Login real

O cliente HTTP central utiliza Axios para `POST /auth/login` e depois `GET /auth/me`. A área autenticada
só abre após receber a identificação, a função e as permissões atuais do usuário.
O campo de token da API é `accesToken`. As contas de demonstração não autenticam
mais no front; utilize uma conta ativa do banco (veja a carga inicial de desenvolvimento
no README do back).

Por padrão, o navegador acessa `/api`. Tanto `npm run dev` quanto `npm run preview`
encaminham esse prefixo para `http://localhost:8080`, removendo `/api` antes de chamar
o back. Para outro endereço, crie `.env.local` com `API_PROXY_TARGET=http://localhost:8081`.
Essa variável pertence ao servidor Vite e não é exposta no bundle.

Na publicação, configure o servidor de hospedagem para encaminhar `/api` ao back.
Alternativamente, defina `VITE_API_URL` antes do build com a URL pública da API e configure
CORS no back para a origem do front. O proxy do Vite não faz parte dos arquivos gerados
em `dist`. Nunca coloque segredos em variáveis `VITE_`.

Token e expiração ficam no `sessionStorage`; a senha não é persistida. Ao atualizar
a página, a sessão é validada novamente por `/auth/me`. Se o armazenamento estiver
bloqueado, o acesso funciona somente em memória. A validade atual é de 15 minutos,
sem refresh token. Sair limpa a sessão do navegador; o JWT continua válido no back
até expirar. Voltar à aba atualiza identificação, função e permissões.

Após o login, o painel reaproveita o layout anterior com sidebar, cabeçalho e navegação
mobile, utilizando nome, e-mail e função retornados por `/auth/me`. O Início está disponível
a toda conta autenticada. O catálogo do painel libera Usuários com `TELA_USUARIOS` e
Funções do sistema com `TELA_FUNCOES_SISTEMA`, inclusive pelos atalhos do Início.
Usuários abre a tela original adaptada para consultar `GET /usuarios` e `GET /usuarios/{id}`.
O front trata `null` na listagem como uma lista vazia, preservando o contrato atual do back.
Busca, filtros de função e exportação CSV utilizam os dados reais retornados pela API.
O filtro e a coluna de departamentos indicam indisponibilidade até a integração dos vínculos.
Funções do sistema continua exibindo "Em breve" nesta etapa.
Grupos sem destinos autorizados são ocultados. Se a permissão da tela aberta for revogada,
o conteúdo volta ao Início. Permissões desconhecidas não abrem telas automaticamente.

O formulário de edição consulta os dados atuais e envia somente nome, telefone, situação
e função pelo `PUT /usuarios/{id}`. E-mail, nascimento e família ficam disponíveis para consulta.
O seletor de função consulta `GET /funcoes-sistema` com a permissão `TELA_USUARIOS`.
O back permite a listagem para quem gerencia usuários ou funções; o cadastro de funções
continua exigindo `TELA_FUNCOES_SISTEMA`. Se a consulta falhar, é possível salvar os demais
campos mantendo a função atual. Alterar a própria conta atualiza `/auth/me`,
inclusive para refletir revogação de acesso ou desativação.
Essa atualização força uma nova consulta após o salvamento e descarta respostas de
consultas anteriores, evitando restaurar permissões desatualizadas na sessão.
Campos somente leitura ou desabilitados possuem fundo cinza; os editáveis permanecem brancos.

Cadastro e exclusão permanecem indisponíveis. Os formulários anteriores de cadastro e
os outros módulos do protótipo continuam preservados para as próximas integrações.
O painel autenticado não consome perfis, indicadores ou notificações de demonstração.
O armazenamento do site público permanece independente da sessão real.
Permissões são comparadas pelo código exato, independentemente do nome da função
ou do prefixo do código. Recuperação de senha depende de atendimento da administração.
