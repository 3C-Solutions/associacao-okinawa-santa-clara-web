import { useState } from "react";
import { capacidadeDe, quantidadeNoDepartamento } from "@/lib/people.js";
import { usarArmazenamento } from "@/store";
import { Selo, Botao, Cartao, EstadoVazio, Icone, BotaoIcone, CabecalhoPagina, EntradaBusca, Alternador } from "@/components/ui";
import DetalhesDepartamento from "./DepartmentDetails.jsx";
import FormularioDepartamento from "./DepartmentForm.jsx";

// ---------- Diretoria ----------
export default function DepartamentosAdmin() {
  const { state: dadosAplicacao, save: salvar, remove: remover, toast: aviso, confirm: confirmar } = usarArmazenamento();
  const [consulta, definirConsulta] = useState("");
  const [editando, definirEditando] = useState(null);
  const [visualizando, definirVisualizando] = useState(null);
  const lista = dadosAplicacao.departments.filter((dataValor) => dataValor.name.toLowerCase().includes(consulta.trim().toLowerCase()));

  const excluir = (dataValor) => confirmar({ title: "Excluir departamento", message: `Excluir “${dataValor.name}”? As inscrições dos associados nesse departamento também serão removidas.`, onConfirm: () => { remover("departments", dataValor.id); aviso("Departamento excluído"); } });
  const alternarAtivo = (dataValor) => { salvar("departments", { ...dataValor, active: !dataValor.active }); aviso(dataValor.active ? "Departamento desativado" : "Departamento ativado"); };

  return (
    <div>
      <CabecalhoPagina left={<EntradaBusca value={consulta} onChange={definirConsulta} placeholder="Buscar departamento" className="max-w-md" />}>
        <Botao onClick={() => definirEditando({ name: "", description: "", day: "Quarta-feira", time: "19:00", teacher: "", fee: "0", capacity: "20", active: true, image: "" })}><Icone name="plus" size={18} /> Novo departamento</Botao>
      </CabecalhoPagina>
      {lista.length === 0 ? <Cartao><EstadoVazio icon="groups" title="Nenhum departamento encontrado" /></Cartao> : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {lista.map((dataValor) => (
            <Cartao key={dataValor.id} className="flex flex-col overflow-hidden">
              {dataValor.image ? <img src={dataValor.image} alt="" className="aspect-[2/1] w-full object-cover" /> : <div className="grid aspect-[2/1] place-items-center bg-brand-soft text-brand"><Icone name="groups" size={32} /></div>}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><h2 className="text-xl font-bold">{dataValor.name}</h2><p className="mt-1 text-sm text-muted">{quantidadeNoDepartamento(dadosAplicacao, dataValor.id)}/{capacidadeDe(dataValor) || "∞"} inscritos · {dataValor.day}, {dataValor.time}</p></div>
                  <Selo tone={dataValor.active ? "success" : "danger"}>{dataValor.active ? "Ativo" : "Inativo"}</Selo>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 pt-5">
                  <Botao variant="secondary" className="min-h-9 px-4 text-sm" onClick={() => definirVisualizando(dataValor)}>Ver detalhes</Botao>
                  <div className="flex items-center gap-1">
                    <Alternador checked={dataValor.active} onChange={() => alternarAtivo(dataValor)} label={dataValor.active ? "Desativar" : "Ativar"} />
                    <BotaoIcone icon="edit" label="Editar" size="sm" onClick={() => definirEditando({ ...dataValor, fee: String(dataValor.fee), capacity: String(capacidadeDe(dataValor) || "") })} />
                    <BotaoIcone icon="trash" label="Excluir" tone="danger" size="sm" onClick={() => excluir(dataValor)} />
                  </div>
                </div>
              </div>
            </Cartao>
          ))}
        </div>
      )}
      {editando && <FormularioDepartamento department={editando} enrolled={editando.id ? quantidadeNoDepartamento(dadosAplicacao, editando.id) : 0} onClose={() => definirEditando(null)} onSave={(dataValor) => { salvar("departments", { ...dataValor, fee: Number(dataValor.fee), capacity: Number(dataValor.capacity) }); aviso(dataValor.id ? "Departamento atualizado" : "Departamento criado"); definirEditando(null); }} />}
      {visualizando && <DetalhesDepartamento department={dadosAplicacao.departments.find((dataValor) => dataValor.id === visualizando.id)} onClose={() => definirVisualizando(null)} />}
    </div>
  );
}
