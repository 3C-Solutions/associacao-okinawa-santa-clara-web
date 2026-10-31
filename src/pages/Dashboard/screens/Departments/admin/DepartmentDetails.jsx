import { formatarMoeda } from "@/lib/data.js";
import { capacidadeDe, membrosDe } from "@/lib/people.js";
import { usarArmazenamento } from "@/store";
import { Botao, Modal } from "@/components/ui";

export default function DetalhesDepartamento({ department: departamento, onClose: aoFechar }) {
  const { state: dadosAplicacao } = usarArmazenamento();
  if (!departamento) return null;
  const membros = membrosDe(dadosAplicacao, departamento.id);
  return (
    <Modal title={departamento.name} onClose={aoFechar} footer={<Botao onClick={aoFechar}>Fechar</Botao>}>
      {departamento.image && <img src={departamento.image} alt="" className="aspect-video w-full rounded-xl object-cover" />}
      <p className="mt-4 leading-relaxed text-muted">{departamento.description}</p>
      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-divider pt-5 text-sm">
        <div><dt className="text-muted">Encontros</dt><dd className="font-semibold">{departamento.day}, {departamento.time}</dd></div>
        <div><dt className="text-muted">Responsável</dt><dd className="font-semibold">{departamento.teacher}</dd></div>
        <div><dt className="text-muted">Mensalidade</dt><dd className="font-semibold">{departamento.fee ? formatarMoeda(departamento.fee) : "Gratuito"}</dd></div>
        <div><dt className="text-muted">Situação</dt><dd className="font-semibold">{departamento.active ? "Ativo" : "Inativo"}</dd></div>
        <div><dt className="text-muted">Vagas</dt><dd className="font-semibold">{membros.length} de {capacidadeDe(departamento) || "—"} preenchidas</dd></div>
      </dl>
      <h3 className="mb-2 mt-6 font-bold">Inscritos ({membros.length})</h3>
      {membros.length === 0 ? <p className="text-sm text-muted">Ninguém inscrito ainda.</p> : (
        <ul className="divide-y divide-divider rounded-lg border border-divider text-sm">
          {membros.map((mes) => <li key={mes.id} className="flex justify-between gap-3 px-4 py-2.5"><span className="font-semibold">{mes.name}</span><span className="text-muted">{mes.main ? "Responsável" : `${mes.relation} de ${mes.associateName}`}</span></li>)}
        </ul>
      )}
    </Modal>
  );
}
