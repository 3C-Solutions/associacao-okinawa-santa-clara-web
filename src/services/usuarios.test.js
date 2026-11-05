import test from "node:test";
import assert from "node:assert/strict";
import { criarServicoUsuarios, montarCadastro, validarCadastroUsuario } from "./usuarios.js";

const formulario = { name: " Maria Souza ", email: " Maria@Email.com ", phone: "(11) 99999-8888", birthDate: "1990-05-07", familyId: "3", funcaoId: "2" };
const resposta = { id: 9, nome: "Maria Souza", email: "maria@email.com", telefone: "(11) 99999-8888", ativo: true, dataNascimento: "07/05/1990", funcaoSistema: { id: 2, nome: "Associado" }, familia: { id: 3, nome: "Souza" } };

test("monta o corpo do cadastro no contrato do back-end", () => {
  assert.deepEqual(montarCadastro(formulario), {
    idFamilia: 3, nome: "Maria Souza", email: "maria@email.com", telefone: "(11) 99999-8888", dataNascimento: "07/05/1990", idFuncaoSistema: 2,
  });
});

test("valida campos obrigatórios do cadastro", () => {
  const erros = validarCadastroUsuario({ name: "M", email: "x", phone: "11", birthDate: "2999-01-01", familyId: "", funcaoId: "" });
  assert.deepEqual(Object.keys(erros).sort(), ["birthDate", "email", "familyId", "funcaoId", "name", "phone"]);
  assert.throws(() => montarCadastro({ ...formulario, familyId: "" }), { status: 400 });
});

test("cadastra via POST /usuarios e normaliza a resposta", async () => {
  const chamadas = [];
  const servico = criarServicoUsuarios(async (caminho, opcoes) => { chamadas.push([caminho, opcoes]); return resposta; });
  const usuario = await servico.cadastrar(formulario);
  assert.equal(chamadas[0][0], "/usuarios");
  assert.equal(chamadas[0][1].method, "POST");
  assert.equal(chamadas[0][1].body.dataNascimento, "07/05/1990");
  assert.equal(usuario.id, 9);
  assert.equal(usuario.family, "Souza");
});

test("exclui via DELETE /usuarios/{id} e rejeita id inválido sem chamar a API", async () => {
  const chamadas = [];
  const servico = criarServicoUsuarios(async (caminho, opcoes) => { chamadas.push([caminho, opcoes.method]); return null; });
  await servico.excluir(9);
  assert.deepEqual(chamadas, [["/usuarios/9", "DELETE"]]);
  await assert.rejects(() => servico.excluir(0));
  assert.equal(chamadas.length, 1);
});
