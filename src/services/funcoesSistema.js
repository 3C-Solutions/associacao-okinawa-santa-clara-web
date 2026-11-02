import { ErroApi } from "../lib/api.js";
import { normalizarFuncionalidadeSistema } from "./funcionalidadesSistema.js";

const contratoInvalido = () => new ErroApi(502, "Não foi possível carregar as funções disponíveis. Tente novamente.");

export function normalizarFuncaoSistema(funcao) {
  if (!Number.isInteger(funcao?.id) || funcao.id <= 0 || typeof funcao.nome !== "string" || !funcao.nome.trim()
    || (funcao.descricao != null && typeof funcao.descricao !== "string")) throw contratoInvalido();
  return { id: funcao.id, nome: funcao.nome, descricao: funcao.descricao ?? "" };
}

export function normalizarDetalheFuncao(dados) {
  const funcao = normalizarFuncaoSistema(dados);
  if (!Number.isSafeInteger(dados.versao) || dados.versao < 0 || !Array.isArray(dados.funcionalidades)) throw contratoInvalido();
  return { ...funcao, versao: dados.versao, funcionalidades: dados.funcionalidades.map(normalizarFuncionalidadeSistema) };
}

export function validarCadastroFuncao(formulario) {
  const erros = {};
  if (!formulario.nome?.trim()) erros.nome = "Informe o nome da função.";
  else if (formulario.nome.trim().length > 100) erros.nome = "O nome deve ter no máximo 100 caracteres.";
  if ((formulario.descricao || "").trim().length > 255) erros.descricao = "A descrição deve ter no máximo 255 caracteres.";
  if (!Array.isArray(formulario.idsFuncionalidades) || !formulario.idsFuncionalidades.length
    || !formulario.idsFuncionalidades.every((id) => Number.isInteger(id) && id > 0)) {
    erros.idsFuncionalidades = "Selecione pelo menos uma funcionalidade válida.";
  }
  return erros;
}

export function criarServicoFuncoesSistema(requisitar) {
  const validarId = (id) => { if (!Number.isInteger(id) || id <= 0) throw contratoInvalido(); };
  return {
    listar: async (signal) => {
      const dados = await requisitar("/funcoes-sistema", { signal });
      if (!Array.isArray(dados)) throw contratoInvalido();
      return dados.map(normalizarFuncaoSistema);
    },
    buscar: async (id, signal) => {
      validarId(id);
      const funcao = normalizarDetalheFuncao(await requisitar(`/funcoes-sistema/${id}`, { signal }));
      if (funcao.id !== id) throw contratoInvalido();
      return funcao;
    },
    atualizarAcessos: async (funcao, idsFuncionalidades, signal) => {
      validarId(funcao.id);
      if (!Number.isSafeInteger(funcao.versao) || funcao.versao < 0 || !Array.isArray(idsFuncionalidades)
        || !idsFuncionalidades.every((id) => Number.isInteger(id) && id > 0)) throw new ErroApi(400, "Confira as funcionalidades selecionadas.");
      try {
        const dados = await requisitar(`/funcoes-sistema/${funcao.id}/funcionalidades`, {
          method: "PUT", body: { idsFuncionalidades: [...new Set(idsFuncionalidades)], versao: funcao.versao }, signal,
        });
        const atualizada = normalizarDetalheFuncao(dados);
        if (atualizada.id !== funcao.id) throw contratoInvalido();
        return atualizada;
      } catch (erro) {
        if (erro.status === 409) throw new ErroApi(409, "Esta função foi alterada por outra pessoa. Recarregue os acessos e revise a seleção antes de salvar.");
        if (erro.status === 404) throw new ErroApi(404, "A função ou uma das funcionalidades não está mais disponível. Recarregue os dados para continuar.");
        throw erro;
      }
    },
    cadastrar: async (formulario, signal) => {
      const erros = validarCadastroFuncao(formulario);
      if (Object.keys(erros).length) throw new ErroApi(400, Object.values(erros)[0]);
      const body = {
        nome: formulario.nome.trim(),
        descricao: formulario.descricao?.trim() || null,
        idsFuncionalidades: [...new Set(formulario.idsFuncionalidades)],
      };
      try {
        return normalizarFuncaoSistema(await requisitar("/funcoes-sistema", { method: "POST", body, signal }));
      } catch (erro) {
        if (erro.status === 409) throw new ErroApi(409, "Já existe uma função com esse nome. Informe outro nome.");
        if (erro.status === 404) throw new ErroApi(404, "Uma das funcionalidades não está mais disponível. Recarregue as opções e revise a seleção.");
        throw erro;
      }
    },
  };
}
