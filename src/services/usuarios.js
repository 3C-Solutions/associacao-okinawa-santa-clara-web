import { ErroApi } from "../lib/api.js";
import { ehDataPassada, ehEmail } from "../lib/data.js";
import { normalizarFuncaoSistema } from "./funcoesSistema.js";

const idValido = (id) => Number.isInteger(id) && id > 0;
const contratoInvalido = () => new ErroApi(502, "Não foi possível carregar os dados do usuário. Tente novamente.");

export function dataParaEntrada(valor) {
  if (!valor) return "";
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
  return partes ? `${partes[3]}-${partes[2]}-${partes[1]}` : /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : "";
}

function formatarEndereco(endereco) {
  if (!endereco) return "";
  return [
    [endereco.rua, endereco.numero, endereco.complemento].filter(Boolean).join(", "),
    endereco.bairro,
    [endereco.cidade, endereco.uf].filter(Boolean).join(" / "),
    endereco.cep ? `CEP ${endereco.cep}` : "",
  ].filter(Boolean).join(" · ");
}

export function normalizarUsuario(dados) {
  if (!idValido(dados?.id) || typeof dados.nome !== "string" || typeof dados.email !== "string" || typeof dados.ativo !== "boolean"
    || (dados.telefone != null && typeof dados.telefone !== "string")) throw contratoInvalido();
  const funcao = dados.funcaoSistema ? normalizarFuncaoSistema(dados.funcaoSistema) : null;
  return {
    id: dados.id, name: dados.nome, email: dados.email, phone: dados.telefone ?? "",
    birthDate: dataParaEntrada(dados.dataNascimento), birthDateLabel: dados.dataNascimento || "—",
    dataCriacao: dados.dataCriacao || "—", ativo: dados.ativo,
    funcaoId: funcao?.id ?? null, role: funcao?.nome || "Sem função",
    familyId: dados.familia?.id ?? null, family: dados.familia?.nome || "",
    familyAddress: formatarEndereco(dados.familia?.endereco),
    note: dados.familia?.nome ? `Família ${dados.familia.nome}` : "Família não informada",
  };
}

export function montarAtualizacao(usuario, formulario, podeAlterarFuncao) {
  const idFuncaoSistema = podeAlterarFuncao ? Number(formulario.funcaoId) : usuario.funcaoId;
  const nome = formulario.name.trim();
  if (!nome) throw new ErroApi(400, "Informe o nome completo.");
  if (!idValido(idFuncaoSistema)) throw new ErroApi(400, "É necessário selecionar uma função válida para este usuário.");
  if (typeof formulario.ativo !== "boolean") throw new ErroApi(400, "Informe a situação do usuário.");
  return { nome, telefone: formulario.phone.trim() || null, ativo: formulario.ativo, idFuncaoSistema };
}

export function validarCadastroUsuario(formulario) {
  const erros = {};
  const nome = (formulario.name || "").trim();
  const telefone = (formulario.phone || "").trim();
  if (nome.length < 3) erros.name = "Informe o nome completo.";
  if (!ehEmail((formulario.email || "").trim())) erros.email = "Informe um e-mail válido.";
  if (telefone.replace(/\D/g, "").length < 10) erros.phone = "Informe um telefone com DDD.";
  else if (telefone.length > 20) erros.phone = "O telefone deve ter no máximo 20 caracteres.";
  if (!formulario.birthDate) erros.birthDate = "Informe a data de nascimento.";
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(formulario.birthDate) || !ehDataPassada(formulario.birthDate)) erros.birthDate = "Informe uma data de nascimento válida e anterior a hoje.";
  if (!idValido(Number(formulario.familyId))) erros.familyId = "Selecione a família.";
  if (!idValido(Number(formulario.funcaoId))) erros.funcaoId = "Selecione a função do sistema.";
  return erros;
}

export function montarCadastro(formulario) {
  const erros = validarCadastroUsuario(formulario);
  if (Object.keys(erros).length) throw new ErroApi(400, Object.values(erros)[0]);
  const [ano, mes, dia] = formulario.birthDate.split("-");
  return {
    idFamilia: Number(formulario.familyId),
    nome: formulario.name.trim(),
    email: formulario.email.trim().toLowerCase(),
    telefone: formulario.phone.trim(),
    dataNascimento: `${dia}/${mes}/${ano}`,
    idFuncaoSistema: Number(formulario.funcaoId),
  };
}

export function criarServicoUsuarios(requisitar) {
  return {
    listar: async (signal) => {
      const dados = await requisitar("/usuarios", { signal });
      if (!Array.isArray(dados)) throw contratoInvalido();
      return dados.map(normalizarUsuario);
    },
    buscar: async (id, signal) => {
      if (!idValido(id)) throw contratoInvalido();
      const usuario = normalizarUsuario(await requisitar(`/usuarios/${id}`, { signal }));
      if (usuario.id !== id) throw contratoInvalido();
      return usuario;
    },
    atualizar: async (usuario, formulario, podeAlterarFuncao, signal) => {
      if (!idValido(usuario.id)) throw contratoInvalido();
      const body = montarAtualizacao(usuario, formulario, podeAlterarFuncao);
      const atualizado = normalizarUsuario(await requisitar(`/usuarios/${usuario.id}`, { method: "PUT", body, signal }));
      if (atualizado.id !== usuario.id) throw contratoInvalido();
      return atualizado;
    },
    cadastrar: async (formulario, signal) => normalizarUsuario(await requisitar("/usuarios", {
      method: "POST", body: montarCadastro(formulario), signal,
    })),
    // Exclusão lógica: o back-end inativa o usuário e mantém o registro.
    excluir: async (id, signal) => {
      if (!idValido(id)) throw contratoInvalido();
      await requisitar(`/usuarios/${id}`, { method: "DELETE", signal });
    },
  };
}
