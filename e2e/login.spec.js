import { expect, test } from "@playwright/test";

const contaTeste = {
  usuario: {
    id: 9001,
    nome: "Conta E2E",
    email: "conta.e2e@example.test",
    funcaoSistema: { id: 9001, nome: "Associado de teste" },
  },
  permissoes: [],
  primeiroAcesso: false,
};

async function configurarApi(page, { contexto = contaTeste, login = null } = {}) {
  await page.route("**/api/publico/departamentos", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/auth/login", (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    return route.fulfill({
      status: login?.status ?? 200,
      json: login?.body ?? {
        accesToken: "token-e2e-ficticio",
        tokenType: "Bearer",
        expiresIn: 900,
      },
    });
  });
  await page.route("**/api/auth/me", (route) => route.fulfill({ json: contexto }));
}

async function abrirLogin(page) {
  await page.goto("/");
  const avisoCookies = page.getByRole("button", { name: "Entendi" });
  if (await avisoCookies.isVisible()) await avisoCookies.click();
  const abrirMenu = page.getByRole("button", { name: "Abrir menu" });
  if (await abrirMenu.isVisible()) await abrirMenu.click();
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("heading", { name: "Boas-vindas" })).toBeVisible();
}

async function preencherCredenciais(page) {
  await page.getByLabel("E-mail").fill("CONTA.E2E@EXAMPLE.TEST");
  await page.locator('input[autocomplete="current-password"]').fill("senha-e2e-segura");
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.clear());
});

test("valida os campos obrigatórios e o formato do e-mail", async ({ page }) => {
  await configurarApi(page);
  await abrirLogin(page);

  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("alert")).toHaveCount(2);
  await expect(page.getByText("Informe um e-mail válido.")).toBeVisible();
  await expect(page.getByText("Informe a senha.")).toBeVisible();

  await page.getByLabel("E-mail").fill("conta-invalida");
  await page.locator('input[autocomplete="current-password"]').fill("senha-e2e-segura");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Informe um e-mail válido.")).toBeVisible();
});

test("permite mostrar e ocultar a senha", async ({ page }) => {
  await configurarApi(page);
  await abrirLogin(page);

  const senha = page.locator('input[autocomplete="current-password"]');
  await expect(senha).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Mostrar senha" }).click();
  await expect(senha).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Ocultar senha" }).click();
  await expect(senha).toHaveAttribute("type", "password");
});

test("exibe a mensagem da API para credenciais inválidas", async ({ page }) => {
  await configurarApi(page, {
    login: {
      status: 401,
      body: { mensagem: "E-mail ou senha inválidos ou conta sem acesso." },
    },
  });
  await abrirLogin(page);
  await preencherCredenciais(page);

  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("alert")).toHaveText("E-mail ou senha inválidos ou conta sem acesso.");
  await expect(page.getByRole("button", { name: "Entrar" })).toBeEnabled();
});

test("autentica, normaliza o e-mail e abre o painel", async ({ page }) => {
  await configurarApi(page);
  await abrirLogin(page);
  await preencherCredenciais(page);

  const requisicaoLogin = page.waitForRequest("**/api/auth/login");
  await page.getByRole("button", { name: "Entrar" }).click();

  const corpo = JSON.parse((await requisicaoLogin).postData() || "{}");
  expect(corpo).toEqual({
    email: "conta.e2e@example.test",
    senha: "senha-e2e-segura",
  });
  await expect(page.getByText("Seu acesso à plataforma está confirmado.")).toBeVisible();
  await expect(page.getByText("Conta E2E", { exact: true })).toBeVisible();
});

test("direciona primeiro acesso para a troca obrigatória de senha", async ({ page }) => {
  await configurarApi(page, {
    contexto: { ...contaTeste, primeiroAcesso: true },
  });
  await abrirLogin(page);
  await preencherCredenciais(page);

  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Defina uma nova senha" })).toBeVisible();
  await expect(page.getByLabel("Senha provisória")).toBeVisible();
  await expect(page.locator('input[autocomplete="new-password"]')).toHaveCount(2);
});

test("informa indisponibilidade quando o contexto da conta viola o contrato", async ({ page }) => {
  const { primeiroAcesso, ...contextoInvalido } = contaTeste;
  await configurarApi(page, { contexto: contextoInvalido });
  await abrirLogin(page);
  await preencherCredenciais(page);

  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Não foi possível carregar sua conta" })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveText("Não foi possível carregar sua conta. Tente novamente.");
});

test("mantém o formulário de login utilizável em viewport de celular", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await configurarApi(page);
  await abrirLogin(page);

  await expect(page.getByLabel("E-mail")).toBeInViewport();
  await expect(page.locator('input[autocomplete="current-password"]')).toBeInViewport();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeInViewport();
});

test("cria, edita e exclui um evento da agenda no armazenamento isolado", async ({ page }) => {
  await configurarApi(page, {
    contexto: { ...contaTeste, permissoes: ["TELA_AGENDA"] },
  });
  await abrirLogin(page);
  await preencherCredenciais(page);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Seu acesso à plataforma está confirmado.")).toBeVisible();

  await page.getByRole("button", { name: "Agenda", exact: true }).click();
  await page.getByRole("button", { name: "Novo evento" }).click();
  await page.getByLabel("Nome do evento *").fill("E2E Agenda");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText("Evento criado")).toBeVisible();

  const evento = page.getByRole("row", { name: /E2E Agenda/ });
  await expect(evento).toBeVisible();
  await evento.getByRole("button", { name: "Editar" }).click();
  await page.getByLabel("Nome do evento *").fill("E2E Agenda editado");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("row", { name: /E2E Agenda editado/ })).toBeVisible();

  await page.getByRole("row", { name: /E2E Agenda editado/ }).getByRole("button", { name: "Excluir" }).click();
  await page.getByRole("dialog", { name: "Excluir evento" }).getByRole("button", { name: "Excluir", exact: true }).click();
  await expect(page.getByText("Evento excluído")).toBeVisible();
  await expect(page.getByRole("row", { name: /E2E Agenda editado/ })).toHaveCount(0);
});
