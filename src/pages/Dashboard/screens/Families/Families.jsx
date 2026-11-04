import { useMemo, useState } from "react";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { usarRecursoApi } from "@/hooks/useApiResource.js";
import { criarServicoFamilias } from "@/services/familias.js";
import { rotuloFamilia, formatarEndereco } from "@/lib/people.js";
import { Botao, TabelaDados, EstadoVazio, Icone, BotaoIcone, EntradaBusca, Cartao } from "@/components/ui";
import DetalhesFamilia from "./FamilyDetails.jsx";
import FormularioFamilia from "./FamilyForm.jsx";

export default function Familias() {
  const { requisitar, podeAcessar } = usarAutenticacao();
  const permitido = podeAcessar("TELA_FAMILIAS");
  const servico = useMemo(() => criarServicoFamilias(requisitar), [requisitar]);
  const recurso = usarRecursoApi(servico.listar, permitido);
  const familias = recurso.dados || [];
  const [consulta, definirConsulta] = useState("");
  const [cadastrando, definirCadastrando] = useState(false);
  const [visualizando, definirVisualizando] = useState(null);
  const [mensagem, definirMensagem] = useState(null);

  const linhas = useMemo(() => {
    const termo = consulta.trim().toLocaleLowerCase("pt-BR");
    return familias.map((familia) => ({ ...familia, label: rotuloFamilia(familia), addressText: formatarEndereco(familia) }))
      .filter((familia) => !termo || `${familia.surname} ${familia.addressText}`.toLocaleLowerCase("pt-BR").includes(termo))
      .sort((a, b) => a.surname.localeCompare(b.surname, "pt-BR") || a.id - b.id);
  }, [familias, consulta]);

  const cadastrar = async (formulario, signal) => {
    const familia = await servico.cadastrar(formulario, signal);
    if (signal.aborted) return;
    recurso.atualizarDados((lista) => [...(lista || []).filter((item) => item.id !== familia.id), familia]);
    definirConsulta("");
    definirCadastrando(false);
    definirMensagem("Família cadastrada com sucesso.");
  };

  const colunas = [
    { key: "label", label: "Família", render: (familia) => <span className="font-semibold">{familia.label}</span> },
    { key: "addressText", label: "Endereço", render: (familia) => <span className="text-muted">{familia.addressText || "—"}</span> },
    { key: "associate", label: "Associado responsável", render: () => <span className="text-muted">Não disponível</span> },
    { key: "members", label: "Membros", render: () => <span className="text-muted">Não disponível</span> },
  ];

  if (!permitido) return null;
  return (
    <div className="space-y-6" aria-busy={recurso.carregando}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <EntradaBusca value={consulta} onChange={definirConsulta} placeholder="Buscar por sobrenome ou endereço" className="flex-1 sm:max-w-md" />
        <Botao disabled={recurso.carregando || !!recurso.erro} onClick={() => { definirMensagem(null); definirCadastrando(true); }}><Icone name="plus" size={18} /> Nova família</Botao>
      </div>
      <p className="text-sm text-muted">Edição, exclusão e composição familiar estarão disponíveis em uma próxima etapa.</p>
      {mensagem && <p role="status" className="rounded-lg bg-success-soft px-4 py-3 text-sm text-success">{mensagem}</p>}
      {recurso.carregando ? <Cartao className="p-8"><p role="status" className="text-center text-muted">Carregando famílias...</p></Cartao> : recurso.erro ? (
        <Cartao className="space-y-4 p-6"><p role="alert" className="text-sm text-danger">{recurso.erro}</p><Botao variant="outline" onClick={recurso.recarregar}>Tentar novamente</Botao></Cartao>
      ) : <>
        <p className="text-sm text-muted">{linhas.length} {linhas.length === 1 ? "família encontrada" : "famílias encontradas"}.</p>
        <TabelaDados columns={colunas} rows={linhas}
          empty={<EstadoVazio icon="groups" title="Nenhuma família encontrada">{familias.length ? "Ajuste a busca para encontrar uma família." : "Cadastre a primeira família para começar."}</EstadoVazio>}
          actions={(familia) => <>
            <BotaoIcone icon="eye" label={`Ver ${familia.label}`} size="sm" onClick={() => definirVisualizando(familia)} />
            <BotaoIcone icon="edit" label={`Editar ${familia.label} (em breve)`} size="sm" disabled />
            <BotaoIcone icon="trash" label={`Excluir ${familia.label} (em breve)`} tone="danger" size="sm" disabled />
          </>}
        />
      </>}
      {cadastrando && <FormularioFamilia onClose={() => definirCadastrando(false)} onSave={cadastrar} hint="A família e seu endereço serão cadastrados juntos. O cadastro de usuários será disponibilizado em uma próxima etapa." />}
      {visualizando && <DetalhesFamilia key={visualizando.id} family={visualizando} service={servico} onClose={() => definirVisualizando(null)} />}
    </div>
  );
}
