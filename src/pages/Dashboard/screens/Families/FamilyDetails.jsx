import { associadoDaFamilia, formatarEndereco, pessoasDe } from "@/lib/people.js";
import { usarArmazenamento } from "@/store";
import { Selo, Botao, Icone, Modal } from "@/components/ui";
import { nomesDepartamentos } from "../Associates/helpers.js";

export default function DetalhesFamilia({ family: familia, onClose: aoFechar, onEdit: aoEditar }) {
  const { state: dadosAplicacao } = usarArmazenamento();
  const associado = associadoDaFamilia(dadosAplicacao, familia.id);
  const pessoas = associado ? pessoasDe(associado) : [];
  return (
    <Modal title={`Família ${familia.surname}`} onClose={aoFechar} footer={<><Botao variant="outline" onClick={aoFechar}>Fechar</Botao><Botao onClick={aoEditar}><Icone name="edit" size={18} /> Editar</Botao></>}>
      <dl className="grid gap-4 text-sm">
        <div><dt className="text-muted">Endereço</dt><dd className="font-semibold">{formatarEndereco(familia) || "—"}</dd></div>
        <div><dt className="text-muted">Associado responsável</dt><dd className="font-semibold">{associado ? associado.name : "Ainda não cadastrado"}</dd></div>
      </dl>
      <h3 className="mb-2 mt-6 font-bold">Membros</h3>
      {pessoas.length === 0 ? (
        <p className="rounded-lg border border-dashed border-divider px-4 py-5 text-sm text-muted">Nenhum membro ainda. Cadastre o associado responsável em Usuários, selecionando esta família.</p>
      ) : (
        <ul className="divide-y divide-divider rounded-lg border border-divider text-sm">
          {pessoas.map((parametro) => (
            <li key={parametro.id} className="px-4 py-3"><div className="flex justify-between gap-3"><span className="font-semibold">{parametro.name}</span><Selo tone="info">{parametro.relation}</Selo></div><p className="mt-1 text-xs text-muted">{nomesDepartamentos(dadosAplicacao, parametro.departmentIds).join(", ") || "Sem inscrições"}</p></li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
