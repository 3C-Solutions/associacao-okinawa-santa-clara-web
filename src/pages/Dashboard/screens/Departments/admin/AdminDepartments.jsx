import { useMemo, useState } from "react";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { usarRecursoApi } from "@/hooks/useApiResource.js";
import { criarServicoDepartamentos } from "@/services/departamentos.js";
import { usarArmazenamento } from "@/store";
import { Selo, Botao, Cartao, EstadoVazio, Icone, BotaoIcone, CabecalhoPagina, EntradaBusca, Alternador } from "@/components/ui";
import DetalhesDepartamento from "./DepartmentDetails.jsx";
import FormularioDepartamento from "./DepartmentForm.jsx";

const NOVO = {
  name: "",
  description: "",
  day: "Quarta-feira",
  time: "19:00",
  teacher: "",
  professorId: "",
  school: "",
  fee: "0",
  capacity: "20",
  active: true,
  image: "",
  imageFile: null,
  responsavelId: "",
  familiaId: ""
};
// ---------- Diretoria ----------
export default function DepartamentosAdmin() {
  const { requisitar } = usarAutenticacao();
  const { toast: aviso, confirm: confirmar } = usarArmazenamento();
  const servico = useMemo(() => criarServicoDepartamentos(requisitar), [requisitar]);
  const recurso = usarRecursoApi(servico.listar);
  const departamentos = recurso.dados || [];
  const [consulta, definirConsulta] = useState("");
  const [editando, definirEditando] = useState(null);
  const [visualizando, definirVisualizando] = useState(null);
  const [salvando, definirSalvando] = useState(false);
  const [erroEnvio, definirErroEnvio] = useState(null);
  const lista = departamentos.filter((d) => d.name.toLowerCase().includes(consulta.trim().toLowerCase()));

  const abrirEdicao = (d) => {
  definirErroEnvio(null);

  definirEditando({
    ...d,
    fee: String(d.fee),
    capacity: String(d.capacity ?? ""),
    responsavelId: String(d.responsavelId ?? ""),
    familiaId: String(d.familiaId ?? ""),
    school: d.school || "",
    professorId: "",
    imageFile: null
  });
};
  const abrirNovo = () => { definirErroEnvio(null); definirEditando({ ...NOVO }); };

  const salvar = async (formulario) => {
    definirSalvando(true);
    definirErroEnvio(null);
    try {
      if (formulario.id) await servico.editar(formulario.id, formulario);
      else await servico.cadastrar(formulario);
      aviso(formulario.id ? "Departamento atualizado" : "Departamento criado");
      definirEditando(null);
      recurso.recarregar();
    } catch (erro) {
      definirErroEnvio(erro.message);
    } finally {
      definirSalvando(false);
    }
  };

  const alternarAtivo = async (d) => {
    try {
      await servico.editar(d.id, { ...d, active: !d.active }); // sem imageFile: o back mantém a imagem
      aviso(d.active ? "Departamento desativado" : "Departamento ativado");
      recurso.recarregar();
    } catch (erro) { aviso(erro.message, "error"); }
  };

  const excluir = (d) => confirmar({
    title: "Excluir departamento",
    message: `Excluir “${d.name}”?`,
    onConfirm: () => servico.excluir(d.id).then(() => { aviso("Departamento excluído"); recurso.recarregar(); }).catch((erro) => aviso(erro.message, "error")),
  });

  return (
    <div aria-busy={recurso.carregando}>
      <CabecalhoPagina left={<EntradaBusca value={consulta} onChange={definirConsulta} placeholder="Buscar departamento" className="max-w-md" />}>
        <Botao disabled={recurso.carregando || !!recurso.erro} onClick={abrirNovo}><Icone name="plus" size={18} /> Novo departamento</Botao>
      </CabecalhoPagina>
      {recurso.carregando ? <Cartao className="p-8"><p role="status" className="text-center text-muted">Carregando departamentos...</p></Cartao> : recurso.erro ? (
        <Cartao className="space-y-4 p-6"><p role="alert" className="text-sm text-danger">{recurso.erro}</p><Botao variant="outline" onClick={recurso.recarregar}>Tentar novamente</Botao></Cartao>
      ) : lista.length === 0 ? <Cartao><EstadoVazio icon="groups" title="Nenhum departamento encontrado" /></Cartao> : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {lista.map((d) => (
            <Cartao key={d.id} className="flex flex-col overflow-hidden">
              {d.image ? <img src={d.image} alt="" className="aspect-[2/1] w-full object-cover" /> : <div className="grid aspect-[2/1] place-items-center bg-brand-soft text-brand"><Icone name="groups" size={32} /></div>}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
    
                  <div>
  <h2 className="text-xl font-bold">{d.name}</h2>

  <p className="mt-1 text-sm text-muted">
    {d.capacity} vagas · {d.day}, {d.time}
  </p>

  {d.school && (
    <p className="mt-1 text-xs text-muted">
      {d.school}
    </p>
  )}
</div>
                  <Selo tone={d.active ? "success" : "danger"}>{d.active ? "Ativo" : "Inativo"}</Selo>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 pt-5">
                  <Botao variant="secondary" className="min-h-9 px-4 text-sm" onClick={() => definirVisualizando(d)}>Ver detalhes</Botao>
                  <div className="flex items-center gap-1">
                    <Alternador checked={d.active} onChange={() => alternarAtivo(d)} label={d.active ? "Desativar" : "Ativar"} />
                    <BotaoIcone icon="edit" label="Editar" size="sm" onClick={() => abrirEdicao(d)} />
                    <BotaoIcone icon="trash" label="Excluir" tone="danger" size="sm" onClick={() => excluir(d)} />
                  </div>
                </div>
              </div>
            </Cartao>
          ))}
        </div>
      )}
      {editando && <FormularioDepartamento department={editando} saving={salvando} error={erroEnvio} onClose={() => !salvando && definirEditando(null)} onSave={salvar} />}
      {visualizando && <DetalhesDepartamento department={visualizando} onClose={() => definirVisualizando(null)} />}
    </div>
  );
}