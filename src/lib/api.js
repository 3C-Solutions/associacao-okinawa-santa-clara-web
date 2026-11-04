import axios from "axios";

export class ErroApi extends Error {
  constructor(status, mensagem, codigo = null) {
    super(mensagem);
    this.name = "ErroApi";
    this.status = status;
    this.codigo = codigo;
  }
}

const mensagens = {
  400: "Confira os dados informados e tente novamente.",
  401: "E-mail ou senha inválidos ou conta sem acesso.",
  403: "Você não tem permissão para realizar esta ação.",
  404: "O registro solicitado não foi encontrado. Atualize os dados e tente novamente.",
  409: "Os dados entram em conflito com um cadastro existente. Confira as informações e tente novamente.",
};

export function criarClienteApi({ baseUrl = import.meta.env?.VITE_API_URL || "/api", adapter, timeoutMs = 15000 } = {}) {
  const cliente = axios.create({
    baseURL: baseUrl.replace(/\/+$/, ""),
    timeout: timeoutMs,
    withCredentials: false,
    headers: { Accept: "application/json", "Cache-Control": "no-store" },
    // Mantém o status HTTP mesmo quando um proxy devolve HTML em vez de JSON.
    responseType: "text",
    transformResponse: [(dados) => dados],
    validateStatus: () => true,
    ...(adapter ? { adapter } : {}),
  });

  return async function requisitar(caminho, { token, body, signal, headers, ...opcoes } = {}) {
    if (!caminho.startsWith("/") || caminho.startsWith("//")) throw new Error("Caminho de API inválido");
    try {
      const cabecalhos = new axios.AxiosHeaders(headers);
      if (token) cabecalhos.set("Authorization", `Bearer ${token}`);
      if (body !== undefined) cabecalhos.set("Content-Type", "application/json");
      const resposta = await cliente.request({
        ...opcoes, url: caminho, headers: cabecalhos, signal,
        ...(body !== undefined ? { data: body } : {}),
      });
      if (resposta.status < 200 || resposta.status >= 300) {
        let codigo = null;
        try {
          const dadosErro = JSON.parse(resposta.data);
          if (typeof dadosErro?.codigo === "string") codigo = dadosErro.codigo;
        } catch { /* Proxies podem devolver um corpo sem JSON. */ }
        throw new ErroApi(resposta.status, mensagens[resposta.status] || "O serviço está indisponível. Tente novamente em instantes.", codigo);
      }
      const texto = resposta.data;
      if (!texto) return null;
      try { return JSON.parse(texto); }
      catch { throw new ErroApi(502, "Não foi possível carregar os dados. Tente novamente."); }
    } catch (erro) {
      if (signal?.aborted || axios.isCancel(erro)) throw new DOMException("Requisição cancelada", "AbortError");
      if (erro instanceof ErroApi) throw erro;
      throw new ErroApi(0, ["ECONNABORTED", "ETIMEDOUT"].includes(erro.code)
        ? "O servidor demorou para responder. Tente novamente."
        : "Não foi possível conectar ao serviço. Confira sua conexão e tente novamente.");
    }
  };
}

