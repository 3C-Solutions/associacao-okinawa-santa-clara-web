import { ErroApi } from "../lib/api.js";

const contratoInvalido = () => new ErroApi(502, "Não foi possível carregar as funções disponíveis. Tente novamente.");

export function normalizarFuncaoSistema(funcao) {
  if (!Number.isInteger(funcao?.id) || funcao.id <= 0 || typeof funcao.nome !== "string" || !funcao.nome.trim()
    || (funcao.descricao != null && typeof funcao.descricao !== "string")) throw contratoInvalido();
  return { id: funcao.id, nome: funcao.nome, descricao: funcao.descricao ?? "" };
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
  return {
    listar: async (signal) => {
      const dados = await requisitar("/funcoes-sistema", { signal });
      if (!Array.isArray(dados)) throw contratoInvalido();
      return dados.map(normalizarFuncaoSistema);
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
