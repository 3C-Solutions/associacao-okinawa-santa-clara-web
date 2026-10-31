import { useState } from "react";
import { formatarMoeda } from "@/lib/data.js";
import { capacidadeDe, estaCompleto, abrirSolicitacao, pessoasDe, vagasRestantes } from "@/lib/people.js";
import { usarArmazenamento, usarUsuario } from "@/store";
import { Selo, Botao, Cartao, EstadoVazio, Icone, EntradaBusca } from "@/components/ui";
import ModalSolicitacao from "./RequestModal.jsx";

// ---------- Associado ----------
// O associado responsável apenas SOLICITA a inscrição; quem aprova, coloca em lista de espera,
// adiciona ou remove inscritos é o departamento.
export default function DepartamentosMembro({ role: papel = "member", account: conta }) {
  const { state: dadosAplicacao, save: salvar, notify: notificar, toast: aviso, confirm: confirmar } = usarArmazenamento();
  const usuario = usarUsuario(conta);
  const [matriculando, definirMatriculando] = useState(null);
  const [consulta, definirConsulta] = useState("");
  const associado = usuario.associate;
  if (!associado) return <Cartao><EstadoVazio icon="person" title="Cadastro não encontrado" /></Cartao>;
  const pessoas = pessoasDe(associado);
  // o dependente solicita inscrição apenas para si mesmo
  const solicitavel = papel === "dependent" ? pessoas.filter((parametro) => parametro.id === usuario.profile.personId) : pessoas;
  const ativo = dadosAplicacao.departments.filter((dataValor) => dataValor.active);
  const minhasSolicitacoes = (dadosAplicacao.enrollmentRequests || []).filter((resultado) => resultado.associateId === associado.id && (resultado.status === "Pendente" || resultado.status === "Lista de espera"));
  const matriculado = ativo.filter((dataValor) => pessoas.some((parametro) => parametro.departmentIds.includes(dataValor.id)));
  const comSolicitacao = ativo.filter((dataValor) => !matriculado.includes(dataValor) && minhasSolicitacoes.some((resultado) => resultado.departmentId === dataValor.id));
  const outros = ativo.filter((dataValor) => !matriculado.includes(dataValor) && !comSolicitacao.includes(dataValor) && dataValor.name.toLowerCase().includes(consulta.trim().toLowerCase()));

  const enviarSolicitacoes = (departamento, identificadoresSelecionados) => {
    const completo = estaCompleto(dadosAplicacao, departamento);
    const criado = identificadoresSelecionados.map((identificador) => solicitavel.find((parametro) => parametro.id === identificador)).filter((parametro) => parametro && !parametro.departmentIds.includes(departamento.id) && !abrirSolicitacao(dadosAplicacao, departamento.id, parametro.id));
    criado.forEach((parametro) => salvar("enrollmentRequests", { departmentId: departamento.id, associateId: associado.id, associateName: associado.name, personId: parametro.id, personName: parametro.name, relation: parametro.relation, status: completo ? "Lista de espera" : "Pendente", createdAt: new Date().toISOString() }));
    if (criado.length) {
      notificar("department", "Nova solicitação de inscrição", `${criado.map((parametro) => parametro.name).join(", ")} ${criado.length > 1 ? "solicitaram" : "solicitou"} inscrição em ${departamento.name}.`, "associates", { departmentId: departamento.id });
      aviso(completo ? "Departamento lotado: você entrou na lista de espera" : "Solicitação enviada ao departamento");
    }
    definirMatriculando(null);
  };

  const cancelarSolicitacoes = (departamento) => confirmar({ title: "Cancelar solicitação", message: `Cancelar as solicitações de inscrição em “${departamento.name}”?`, confirmLabel: "Cancelar solicitação", onConfirm: () => {
    minhasSolicitacoes.filter((resultado) => resultado.departmentId === departamento.id).forEach((resultado) => salvar("enrollmentRequests", { ...resultado, status: "Cancelada" }));
    aviso("Solicitação cancelada");
  } });

  const CartaoDepartamento = ({ d: dataValor, isEnrolled: estaMatriculado, requested: solicitado }) => {
    const nomes = pessoas.filter((parametro) => parametro.departmentIds.includes(dataValor.id)).map((parametro) => parametro.name.split(" ")[0]);
    const solicitacoes = minhasSolicitacoes.filter((resultado) => resultado.departmentId === dataValor.id);
    const completo = estaCompleto(dadosAplicacao, dataValor);
    const restante = vagasRestantes(dadosAplicacao, dataValor);
    const naoSolicitado = solicitavel.filter((parametro) => !parametro.departmentIds.includes(dataValor.id) && !abrirSolicitacao(dadosAplicacao, dataValor.id, parametro.id));
    return (
      <Cartao className="flex flex-col overflow-hidden">
        {dataValor.image ? <img src={dataValor.image} alt="" className="aspect-[2/1] w-full object-cover" /> : <div className="grid aspect-[2/1] place-items-center bg-brand-soft text-brand"><Icone name="groups" size={32} /></div>}
        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-start justify-between gap-4"><h2 className="text-xl font-bold">{dataValor.name}</h2>{estaMatriculado ? <Selo tone="success">Inscrição ativa</Selo> : solicitado ? <Selo tone={solicitacoes.every((resultado) => resultado.status === "Lista de espera") ? "info" : "warning"}>{solicitacoes.every((resultado) => resultado.status === "Lista de espera") ? "Lista de espera" : "Solicitação enviada"}</Selo> : null}</div>
          <p className="mt-3 text-sm leading-relaxed text-muted">{dataValor.description}</p>
          <div className="mt-5 space-y-2 border-t border-divider pt-5 text-sm">
            {estaMatriculado && <p><strong>Familiares inscritos:</strong> {nomes.join(", ")}</p>}
            {solicitacoes.length > 0 && <p><strong>Solicitações:</strong> {solicitacoes.map((resultado) => `${resultado.personName.split(" ")[0]} (${resultado.status === "Pendente" ? "aguardando aprovação" : "lista de espera"})`).join(", ")}</p>}
            <p><strong>Encontros:</strong> {dataValor.day}, {dataValor.time}</p>
            <p><strong>Mensalidade:</strong> {dataValor.fee ? formatarMoeda(dataValor.fee) : "Gratuito"}</p>
            <p><strong>Vagas:</strong> {capacidadeDe(dataValor) ? (completo ? <span className="font-semibold text-danger">Lotado — novas solicitações entram na lista de espera</span> : `${restante} de ${capacidadeDe(dataValor)} disponíveis`) : "Sem limite"}</p>
          </div>
          <div className="mt-5 flex flex-col gap-2">
            {naoSolicitado.length > 0 && <Botao variant={estaMatriculado || solicitado ? "secondary" : "primary"} className="w-full" onClick={() => definirMatriculando(dataValor)}>{completo ? "Entrar na lista de espera" : "Solicitar inscrição"}</Botao>}
            {solicitado && <Botao variant="ghost" className="w-full" onClick={() => cancelarSolicitacoes(dataValor)}>Cancelar solicitação</Botao>}
          </div>
          {estaMatriculado && <p className="mt-3 text-xs text-muted">Para sair do departamento, fale com o responsável pelo departamento.</p>}
        </div>
      </Cartao>
    );
  };

  return (
    <div className="space-y-10">
      <section>
        <p className="mb-6 text-sm text-muted">Departamentos em que você ou seus familiares estão inscritos. A inscrição só é efetivada após a aprovação do departamento.</p>
        {matriculado.length === 0 ? <Cartao><EstadoVazio icon="groups" title="Nenhuma inscrição ainda">Solicite a inscrição em um departamento abaixo para você ou sua família.</EstadoVazio></Cartao> : <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{matriculado.map((dataValor) => <CartaoDepartamento key={dataValor.id} d={dataValor} isEnrolled requested={minhasSolicitacoes.some((resultado) => resultado.departmentId === dataValor.id)} />)}</div>}
      </section>
      {comSolicitacao.length > 0 && (
        <section>
          <h2 className="mb-5 text-xl font-bold">Solicitações em andamento</h2>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{comSolicitacao.map((dataValor) => <CartaoDepartamento key={dataValor.id} d={dataValor} requested />)}</div>
        </section>
      )}
      <section>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-xl font-bold">Outros departamentos</h2><EntradaBusca value={consulta} onChange={definirConsulta} placeholder="Buscar departamento" className="sm:w-72" /></div>
        {outros.length === 0 ? <p className="text-sm text-muted">Nenhum outro departamento disponível.</p> : <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{outros.map((dataValor) => <CartaoDepartamento key={dataValor.id} d={dataValor} />)}</div>}
      </section>
      {matriculando && <ModalSolicitacao department={matriculando} people={solicitavel.filter((parametro) => !parametro.departmentIds.includes(matriculando.id) && !abrirSolicitacao(dadosAplicacao, matriculando.id, parametro.id))} full={estaCompleto(dadosAplicacao, matriculando)} onClose={() => definirMatriculando(null)} onSave={(identificadores) => enviarSolicitacoes(matriculando, identificadores)} />}
    </div>
  );
}
