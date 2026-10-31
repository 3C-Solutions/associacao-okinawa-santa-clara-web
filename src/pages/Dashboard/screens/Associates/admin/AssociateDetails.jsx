import { formatarData } from "@/lib/data.js";
import { rotuloFamilia, familiaDe, formatarEndereco, pessoasDe } from "@/lib/people.js";
import { usarArmazenamento } from "@/store";
import { Selo, Botao, Icone, Modal } from "@/components/ui";
import { nomesDepartamentos } from "../helpers.js";

export default function DetalhesAssociado({ associate: associado, onClose: aoFechar, onEdit: aoEditar }) {
  const { state: dadosAplicacao } = usarArmazenamento();
  const pessoas = pessoasDe(associado);
  const familia = familiaDe(dadosAplicacao, associado);
  return (
    <Modal title={associado.name} onClose={aoFechar} footer={<><Botao variant="outline" onClick={aoFechar}>Fechar</Botao><Botao onClick={aoEditar}><Icone name="edit" size={18} /> Editar</Botao></>}>
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div><dt className="text-muted">E-mail</dt><dd className="font-semibold">{associado.email}</dd></div>
        <div><dt className="text-muted">Telefone</dt><dd className="font-semibold">{associado.phone}</dd></div>
        <div className="sm:col-span-2"><dt className="text-muted">Família</dt><dd className="font-semibold">{rotuloFamilia(familia)}{familia ? ` — ${formatarEndereco(familia)}` : ""}</dd></div>
        <div><dt className="text-muted">Associado desde</dt><dd className="font-semibold">{formatarData(associado.since)}</dd></div>
      </dl>
      <h3 className="mb-2 mt-6 font-bold">Família e inscrições</h3>
      <ul className="divide-y divide-divider rounded-lg border border-divider text-sm">
        {pessoas.map((parametro) => (
          <li key={parametro.id} className="px-4 py-3"><div className="flex justify-between gap-3"><span className="font-semibold">{parametro.name}</span><Selo tone="info">{parametro.relation}</Selo></div><p className="mt-1 text-xs text-muted">{nomesDepartamentos(dadosAplicacao, parametro.departmentIds).join(", ") || "Sem inscrições"}</p></li>
        ))}
      </ul>
    </Modal>
  );
}
