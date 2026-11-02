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

A primeira entrega contém a página inicial autenticada, os estados de erro e a saída.
Os módulos antigos de gestão continuam aguardando integração de dados e escopos;
os acessos exibidos nessa página são informativos e não abrem os módulos de demonstração.
Permissões são comparadas pelo código exato, independentemente do nome da função
ou do prefixo do código. Recuperação de senha depende de atendimento da administração.
