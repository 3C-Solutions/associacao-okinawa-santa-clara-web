import { ErroApi } from "../lib/api.js";

export const GERENCIAR_NOTICIAS = "GERENCIAR_NOTICIAS";
export const STATUS_NOTICIAS = { PUBLICADO: "Publicado", RASCUNHO: "Rascunho" };
export const rotuloPublico = (publico) => publico === "TODOS" ? "Todos os usuários" : publico;

const erroContrato = () => new ErroApi(502, "A API retornou dados de notícias inválidos.");

function validarNoticia(dados) {
  if (!Number.isInteger(dados?.id) || dados.id <= 0
      || !["titulo", "classificacao", "conteudo", "publico"].every((campo) => typeof dados[campo] === "string")
      || !Object.hasOwn(STATUS_NOTICIAS, dados.status)
      || typeof dados.dataCriacao !== "string"
      || !/^\d{4}-\d{2}-\d{2}$/.test(dados.dataCriacao)
      || (dados.imagemUrl != null && dados.imagemUrl !== `/noticias/${dados.id}/imagem`)) {
    throw erroContrato();
  }
  return dados;
}

export function montarCorpoNoticia(formulario, imagem, removerImagem = false) {
  const { titulo, classificacao, conteudo, status, publico } = formulario;
  const dados = { titulo: titulo.trim(), classificacao: classificacao.trim(), conteudo: conteudo.trim(), status, publico };
  if (removerImagem && !imagem) dados.removerImagem = true;
  const corpo = new FormData();
  corpo.append("dados", new Blob([JSON.stringify(dados)], { type: "application/json" }));
  if (imagem) corpo.append("imagem", imagem);
  return corpo;
}

export function criarServicoNoticias(requisitar) {
  return {
    async listar({ busca = "", status = "", pagina = 0, tamanho = 20 } = {}, signal) {
      const parametros = new URLSearchParams({ pagina, tamanho });
      if (busca.trim()) parametros.set("busca", busca.trim());
      if (status) parametros.set("status", status);
      const dados = await requisitar(`/noticias?${parametros}`, { signal });
      if (!Array.isArray(dados?.itens) || dados.pagina !== pagina
          || !Number.isInteger(dados.totalPaginas) || dados.totalPaginas < 0) throw erroContrato();
      return { ...dados, itens: dados.itens.map(validarNoticia) };
    },
    async consultar(id, signal) {
      const noticia = validarNoticia(await requisitar(`/noticias/${id}`, { signal }));
      if (noticia.id !== id) throw erroContrato();
      return noticia;
    },
    async publicos(signal) {
      const dados = await requisitar("/noticias/publicos", { signal });
      if (!Array.isArray(dados) || !dados.every((nome) => typeof nome === "string")) throw erroContrato();
      return dados;
    },
    async capa(id, signal) {
      const blob = await requisitar(`/noticias/${id}/imagem`, {
        signal, respostaBlob: true, headers: { Accept: "image/*" },
      });
      if (!(blob instanceof Blob) || !["image/jpeg", "image/png", "image/webp"].includes(blob.type)) throw erroContrato();
      return blob;
    },
    salvar(id, formulario, imagem, removerImagem, signal) {
      return requisitar(id ? `/noticias/${id}` : "/noticias", {
        method: id ? "PUT" : "POST", statusEsperado: id ? 204 : 201,
        body: montarCorpoNoticia(formulario, imagem, Boolean(id) && removerImagem), signal,
      });
    },
    alterarStatus(id, status, signal) {
      return requisitar(`/noticias/${id}/status`, { method: "PATCH", body: { status }, statusEsperado: 204, signal });
    },
    excluir(id, signal) {
      return requisitar(`/noticias/${id}`, { method: "DELETE", statusEsperado: 204, signal });
    },
  };
}
