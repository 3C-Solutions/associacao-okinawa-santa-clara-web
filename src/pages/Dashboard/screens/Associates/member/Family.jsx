import { useState } from "react";
import { SENHA_INICIAL, identificadorUnico } from "@/lib/data.js";
import { estaCompleto, pessoasDe } from "@/lib/people.js";
import { usarArmazenamento, usarUsuario } from "@/store";
import { Selo, Botao, Cartao, EstadoVazio, Icone, CabecalhoPagina } from "@/components/ui";
import { nomesDepartamentos } from "../helpers.js";
import FormularioPessoa from "./PersonForm.jsx";

// ---------- Associado (família) ----------
export default function Familia({ role: papel = "member", account: conta }) {
  const { state: dadosAplicacao, save: salvar, removeWhere: removerOnde, removeAccounts: removerContas, addAccount: adicionarConta, setProfile: definirPerfil, notify: notificar, toast: aviso, confirm: confirmar } = usarArmazenamento();
  const usuario = usarUsuario(conta);
  const somenteLeitura = papel === "dependent"; // dependente apenas consulta: quem cadastra a família é o responsável
  const [editando, definirEditando] = useState(null);
  const associado = usuario.associate;
  if (!associado) return <Cartao><EstadoVazio icon="person" title="Cadastro não encontrado" /></Cartao>;
  const pessoas = pessoasDe(associado);
  const ativo = dadosAplicacao.departments.filter((dataValor) => dataValor.active);

  // A família não se inscreve diretamente: os departamentos marcados viram SOLICITAÇÕES para o departamento aprovar.
  const chaveDaConta = (identificadorPessoa) => Object.keys(dadosAplicacao.profiles).find((chave) => dadosAplicacao.profiles[chave].personId === identificadorPessoa);
  const salvarPessoa = (pessoa, identificadoresSolicitados) => {
    if (somenteLeitura) return;
    let acessoCriado = false;
    if (!pessoa.main) {
      const existe = associado.dependents.some((parametro) => parametro.id === pessoa.id);
      const departamento = { id: pessoa.id, name: pessoa.name, relation: pessoa.relation, departmentIds: existe ? associado.dependents.find((parametro) => parametro.id === pessoa.id).departmentIds : [] };
      if (pessoa.email) departamento.email = pessoa.email;
      if (pessoa.phone) departamento.phone = pessoa.phone;
      salvar("associates", { ...associado, dependents: existe ? associado.dependents.map((parametro) => (parametro.id === departamento.id ? departamento : parametro)) : [...associado.dependents, departamento] });
      // o associado responsável é quem cadastra o dependente (e, com e-mail, o acesso dele ao sistema)
      const chave = chaveDaConta(pessoa.id);
      const atualizarParcial = { name: pessoa.name, email: pessoa.email, phone: pessoa.phone || associado.phone };
      if (chave) definirPerfil(chave, atualizarParcial);
      else if (pessoa.email) { adicionarConta(`u-${pessoa.id}`, { role: "dependent", ...atualizarParcial, associateId: associado.id, personId: pessoa.id, emailNotifications: true }, SENHA_INICIAL); acessoCriado = true; }
    }
    identificadoresSolicitados.forEach((departmentId) => {
      const departamento = dadosAplicacao.departments.find((dataValor) => dataValor.id === departmentId);
      salvar("enrollmentRequests", { departmentId: departmentId, associateId: associado.id, associateName: associado.name, personId: pessoa.id, personName: pessoa.name, relation: pessoa.main ? "Responsável" : pessoa.relation, status: estaCompleto(dadosAplicacao, departamento) ? "Lista de espera" : "Pendente", createdAt: new Date().toISOString() });
      notificar("department", "Nova solicitação de inscrição", `${pessoa.name} solicitou inscrição em ${departamento.name}.`, "associates", { departmentId: departmentId });
    });
    aviso(acessoCriado ? `Dependente cadastrado. Senha inicial de acesso: ${SENHA_INICIAL}.` : identificadoresSolicitados.length ? "Dados salvos e solicitações enviadas" : "Família atualizada");
    definirEditando(null);
  };
  const removerPessoa = (parametro) => somenteLeitura ? undefined : confirmar({ title: "Remover membro", message: `Remover ${parametro.name} da sua família? As inscrições e solicitações dele(a) também serão removidas.`, confirmLabel: "Remover", onConfirm: () => { removerContas((elementoA) => elementoA.personId === parametro.id); salvar("associates", { ...associado, dependents: associado.dependents.filter((dataValor) => dataValor.id !== parametro.id) }); removerOnde("enrollmentRequests", (resultado) => resultado.personId === parametro.id); aviso("Membro removido"); definirEditando(null); } });

  return (
    <div>
      {somenteLeitura ? (
        <p className="mb-6 text-sm text-muted">Somente o associado responsável cadastra e edita os membros da família.</p>
      ) : (
        <CabecalhoPagina><Botao onClick={() => definirEditando({ id: identificadorUnico(), name: "", relation: "Filho(a)", departmentIds: [], main: false, isNew: true })}><Icone name="plus" size={18} /> Novo membro</Botao></CabecalhoPagina>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        {pessoas.map((parametro) => (
          <Cartao key={parametro.id} className="p-5">
            <div className="flex gap-4">
              <div className="grid size-20 shrink-0 place-items-center rounded-xl bg-brand-soft text-2xl font-bold text-brand">{parametro.name[0]}</div>
              <div className="min-w-0">
                <Selo tone="info">{parametro.relation}</Selo>
                <h2 className="mt-2 text-lg font-bold">{parametro.name}</h2>
                <p className="mt-1 text-sm text-muted">Departamentos inscritos</p>
                <p className="text-sm font-semibold">{nomesDepartamentos(dadosAplicacao, parametro.departmentIds).join(", ") || "Nenhum"}</p>
              </div>
            </div>
            {!somenteLeitura && <Botao variant="secondary" className="mt-5 w-full" onClick={() => definirEditando(parametro)}>Gerenciar</Botao>}
          </Cartao>
        ))}
      </div>
      {editando && !somenteLeitura && <FormularioPessoa person={editando} hasAccess={!!chaveDaConta(editando.id)} departments={ativo} requests={dadosAplicacao.enrollmentRequests || []} onClose={() => definirEditando(null)} onSave={salvarPessoa} onRemove={!editando.main && !editando.isNew ? () => removerPessoa(editando) : undefined} />}
    </div>
  );
}
