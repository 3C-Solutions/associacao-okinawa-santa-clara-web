import { expect, test } from "@playwright/test";

const contextoAdmin = {
  usuario: {
    id: 9100,
    nome: "Operador Smoke",
    email: "operador.smoke@example.test",
    funcaoSistema: { id: 9100, nome: "Operador de testes" },
  },
  permissoes: [
    "TELA_FINANCEIRO",
    "TELA_AGENDA",
    "TELA_USUARIOS",
    "TELA_FAMILIAS",
    "TELA_DEPARTAMENTOS",
    "TELA_FUNCOES_SISTEMA",
  ],
  primeiroAcesso: false,
};

async function prepararApi(page) {
  await page.addInitScript(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  // Resposta padrão explícita para requisições não cobertas: a tela deve
  // apresentar seu estado de erro sem derrubar a navegação do painel.
  await page.route("**/api/**", (route) => route.fulfill({
    status: 404,
    contentType: "application/json",
    body: JSON.stringify({ mensagem: "Recurso de teste não encontrado." }),
  }));
  await page.route("**/api/publico/departamentos", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/auth/login", (route) => route.fulfill({
    json: { accesToken: "token-smoke-ficticio", tokenType: "Bearer", expiresIn: 900 },
  }));
  await page.route("**/api/auth/me", (route) => route.fulfill({ json: contextoAdmin }));
  await page.route("**/api/financeiro/dashboard?*", (route) => route.fulfill({
    json: {
      resumo: { saldoMensal: 0, saldoAnual: 0, entradasAnuais: 0, saidasAnuais: 0, variacaoMensal: null },
      lancamentos: [],
    },
  }));
  await page.route("**/api/usuarios", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/familias", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/departamentos", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/funcoes-sistema", (route) => route.fulfill({ json: [] }));
}

async function autenticar(page) {
  await page.goto("/");
  const cookies = page.getByRole("button", { name: "Entendi" });
  if (await cookies.isVisible()) await cookies.click();
  const abrirMenu = page.getByRole("button", { name: "Abrir menu" });
  if (await abrirMenu.isVisible()) await abrirMenu.click();
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByLabel("E-mail").fill("OPERADOR.SMOKE@EXAMPLE.TEST");
  await page.locator('input[autocomplete="current-password"]').fill("senha-ficticia");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Seu acesso à plataforma está confirmado.")).toBeVisible();
}

test("percorre as áreas principais do painel sem ações destrutivas", async ({ page }) => {
  await prepararApi(page);
  await autenticar(page);

  await expect(page.getByRole("heading", { name: "Bem-vindo, Operador" })).toBeVisible();
  const navegacao = page.getByRole("navigation", { name: "Área logada" });

  await navegacao.getByRole("button", { name: "Financeiro", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Financeiro" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Lançamentos financeiros" })).toBeVisible();

  await navegacao.getByRole("button", { name: "Agenda", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Agenda", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ações da agenda" })).toBeVisible();

  await navegacao.getByRole("button", { name: "Notícias", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Notícias" })).toBeVisible();

  await navegacao.getByRole("button", { name: "Funções do sistema", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Funções do sistema" })).toBeVisible();

  await navegacao.getByRole("button", { name: "Configurações", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();

  await navegacao.getByRole("button", { name: "Cadastros", exact: true }).click();
  await page.getByRole("dialog", { name: "Cadastros" }).getByRole("button", { name: "Usuários" }).click();
  await expect(page.getByRole("heading", { name: "Usuários" })).toBeVisible();

  await navegacao.getByRole("button", { name: "Cadastros", exact: true }).click();
  await page.getByRole("dialog", { name: "Cadastros" }).getByRole("button", { name: "Famílias" }).click();
  await expect(page.getByRole("heading", { name: "Famílias" })).toBeVisible();

  await navegacao.getByRole("button", { name: "Cadastros", exact: true }).click();
  await page.getByRole("dialog", { name: "Cadastros" }).getByRole("button", { name: "Departamentos" }).click();
  await expect(page.getByRole("heading", { name: "Departamentos" })).toBeVisible();
});

test("mantém navegação pública e painel acessíveis em celular", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepararApi(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await expect(page.getByRole("navigation", { name: "Menu móvel" })).toBeVisible();
  await page.getByRole("button", { name: "Login" }).click();

  await page.getByLabel("E-mail").fill("operador.smoke@example.test");
  await page.locator('input[autocomplete="current-password"]').fill("senha-ficticia");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo, Operador" })).toBeVisible();

  await page.getByRole("button", { name: "Abrir menu" }).click();
  const navegacao = page.getByRole("navigation", { name: "Área logada" });
  await expect(navegacao).toBeVisible();
  await navegacao.getByRole("button", { name: "Financeiro", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Financeiro" })).toBeVisible();
});
