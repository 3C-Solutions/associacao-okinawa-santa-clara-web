import { useState } from "react";
import { todasPessoas, capacidadeDe, abrirSolicitacao, vagasRestantes } from "@/lib/people.js";
import { usarArmazenamento } from "@/store";
import { Selo, Botao, Modal, EntradaBusca, SeloStatus } from "@/components/ui";

// Lista completa de associados e familiares, com filtro por nome
export default function ModalAdicionarMembro({ department: departamento, onClose: aoFechar, onAdd: aoAdicionar }) {
  const { state: dadosAplicacao } = usarArmazenamento();
  const [consulta, definirConsulta] = useState("");
  const termo = consulta.trim().toLowerCase();
  const restante = vagasRestantes(dadosAplicacao, departamento);
  const lista = todasPessoas(dadosAplicacao)
    .filter((parametro) => !termo || `${parametro.name} ${parametro.associateName}`.toLowerCase().includes(termo))
    .sort((elementoA, elementoB) => elementoA.name.localeCompare(elementoB.name));
  return (
    <Modal size="lg" title={`Adicionar a ${departamento.name}`} onClose={aoFechar} footer={<Botao onClick={aoFechar}>Concluir</Botao>}>
      <EntradaBusca value={consulta} onChange={definirConsulta} placeholder="Filtrar por nome" />
      <p className="mb-3 mt-3 text-xs text-muted">{capacidadeDe(departamento) ? (restante === 0 ? "Departamento lotado: não é possível adicionar mais inscritos." : `${restante} ${restante === 1 ? "vaga disponível" : "vagas disponíveis"}.`) : "Sem limite de vagas definido."}</p>
      {lista.length === 0 ? <p className="py-6 text-center text-sm text-muted">Nenhum associado encontrado.</p> : (
        <ul className="divide-y divide-divider rounded-lg border border-divider text-sm">
          {lista.map((parametro) => {
            const ja = parametro.departmentIds.includes(departamento.id);
            const abrir = abrirSolicitacao(dadosAplicacao, departamento.id, parametro.id);
            return (
              <li key={parametro.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span><span className="font-semibold">{parametro.name}</span><span className="block text-xs text-muted">{parametro.main ? "Responsável" : `${parametro.relation} de ${parametro.associateName}`}</span></span>
                {ja ? <Selo tone="success">Inscrito</Selo> : (
                  <span className="flex items-center gap-2">
                    {abrir && <SeloStatus status={abrir.status} />}
                    <Botao variant="secondary" className="min-h-9 px-4 text-sm" disabled={restante === 0} onClick={() => aoAdicionar(parametro)}>Adicionar</Botao>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
