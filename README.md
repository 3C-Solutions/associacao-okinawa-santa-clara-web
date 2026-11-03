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
O menu permanece fixo no front, com as entradas adicionais abaixo. Cada entrada aparece
somente quando `/auth/me` retorna o código correspondente na lista de permissões.

| Tela | Código | Localização |
| --- | --- | --- |
| Financeiro | `TELA_FINANCEIRO` | Menu principal |
| Agenda | `TELA_AGENDA` | Menu principal |
| Notícias | `TELA_NOTICIAS` | Menu principal |
| Departamentos | `TELA_DEPARTAMENTOS` | Cadastros |

Essas quatro entradas estão disponíveis na sidebar, na navegação mobile e nos atalhos
do Início, e abrem os protótipos originais na visualização administrativa de demonstração.
Os atalhos exibem a indicação Protótipo; as telas possuem um aviso de dados de demonstração.
As ações de criar, editar, excluir, aprovar e filtrar nesses módulos utilizam somente dados locais.
O acesso continua sendo liberado pelas permissões reais, independentemente do nome da função.
Usuários continua em Cadastros e Funções do sistema
em Administração do Sistema, com as telas já integradas.

Os quatro protótipos compartilham um armazenamento próprio do painel, separado por usuário
autenticado (`okinawa-sc-painel-prototipo:<id>`). As alterações persistem neste navegador
ao trocar de tela, sair e entrar novamente ou recarregar a página. A troca de usuário
reinicia o contexto em memória e carrega somente os dados locais daquela conta.
O site público mantém sua chave anterior `okinawa-sc-v2`, sem migrar ou apagar os dados salvos.
Se o armazenamento local estiver indisponível, os protótipos funcionam em memória.
O nome e a função exibidos no cabeçalho continuam sendo os da conta autenticada.
O papel `admin` usado internamente nos protótipos não altera a função nem as permissões reais.
Os formulários de Família e Configurações preservam o preenchimento de endereço via ViaCEP.

Usuários abre a tela original adaptada para consultar `GET /usuarios` e `GET /usuarios/{id}`.
O back retorna `[]` quando a listagem de usuários está vazia; o front utiliza esse contrato.
Busca, filtros de função e exportação CSV utilizam os dados reais retornados pela API.
O filtro e a coluna de departamentos indicam indisponibilidade até a integração dos vínculos.
Funções do sistema consulta `GET /funcoes-sistema` e exibe nome e descrição dos perfis reais.
A tela possui busca local por nome ou descrição, contagem de resultados e estados de
carregamento, lista vazia e erro com nova tentativa. A consulta utiliza o mesmo serviço
do seletor na edição de usuários. O acesso à tela continua exigindo `TELA_FUNCOES_SISTEMA`;
quem possui apenas `TELA_USUARIOS` pode consultar as opções no formulário de usuários.
O botão Nova função consulta `GET /funcionalidades-sistema` e permite cadastrar nome,
descrição opcional e funcionalidades pelo `POST /funcoes-sistema`. Nome tem limite de
100 caracteres, descrição de 255 e pelo menos uma funcionalidade deve ser selecionada.
O formulário preserva o preenchimento quando o envio falha e permite recarregar o catálogo.
Após sucesso, atualiza a listagem; a nova função fica disponível ao abrir a edição de usuários.
A criação não altera as permissões de contas existentes automaticamente.
Cada função possui a ação Editar acessos. O formulário consulta `GET /funcoes-sistema/{id}`
e o catálogo atual, marcando as funcionalidades já vinculadas. Nome e descrição ficam
somente para leitura, com fundo cinza. A atualização usa `PUT /funcoes-sistema/{id}/funcionalidades`,
enviando a seleção completa; `[]` retira todos os acessos do perfil.
O cadastro de novas funções continua exigindo pelo menos uma funcionalidade.
O formulário preserva a seleção quando o envio falha e permite recarregar os dados.
As alterações atingem todos os usuários da função. Ao editar a própria função, o front
força a atualização de `/auth/me`; se a permissão administrativa for retirada, volta ao Início.
Durante essa consulta, o menu exibe um indicador animado com "Atualizando seus acessos...",
tanto no desktop quanto no mobile. O aviso desaparece quando a consulta termina e o menu
reflete as permissões recebidas. A confirmação da edição da própria função aguarda essa atualização.
Outras sessões atualizam a navegação ao voltar à aba ou após uma resposta `403`.
Exclusão de funções fica para uma próxima etapa.
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
Usuários e Funções do sistema utilizam dados reais da API; os quatro módulos identificados
como protótipos utilizam os perfis, indicadores e notificações locais de demonstração.
O armazenamento do site público permanece independente da sessão real.
Permissões são comparadas pelo código exato, independentemente do nome da função
ou do prefixo do código. Recuperação de senha depende de atendimento da administração.

## Financeiro integrado

A tela exige `TELA_FINANCEIRO` e usa os endpoints `/api/financeiro` do backend.
O resumo mensal compara o mês atual ao anterior; os indicadores e gráficos anuais
consideram apenas pagamentos confirmados e despesas pagas. Os filtros afetam a
listagem e seus totais, enquanto os gráficos mantêm o ano corrente.

Novas despesas usam o responsável identificado pelo token no servidor. O formulário
não envia `fkUsuario`; edições preservam o responsável original. O vínculo com família
é opcional. A API mantém o campo `dtDepesa` por compatibilidade com o contrato existente.
Valores aceitam até duas casas decimais; o modal exibe erros e impede envios repetidos.

Verificação local:

```sh
npm run test:finance
npm run build
```

A revisão visual foi feita em 1440 px e 390 px, com dados de teste isolados.
A interface de pagamentos utiliza os códigos dos cadastros existentes: o backend
atual ainda não fornece catálogos de departamentos e cobranças para seletores por nome.
