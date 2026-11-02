import { useCallback } from "react";
import { usarRecursoApi } from "@/hooks/useApiResource.js";
import { Botao, Icone, Modal, Selo } from "@/components/ui";

export function DadosUsuario({ user: usuario }) {
  return (
    <>
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div><dt className="text-muted">E-mail</dt><dd className="break-all font-semibold">{usuario.email}</dd></div>
        <div><dt className="text-muted">Telefone</dt><dd className="font-semibold">{usuario.phone || "—"}</dd></div>
        <div><dt className="text-muted">Função</dt><dd className="font-semibold">{usuario.role}</dd></div>
        <div><dt className="mb-1 text-muted">Situação</dt><dd><Selo tone={usuario.ativo ? "success" : "danger"}>{usuario.ativo ? "Ativo" : "Inativo"}</Selo></dd></div>
        <div className="sm:col-span-2"><dt className="text-muted">Família</dt><dd className="font-semibold">{usuario.family || "—"}{usuario.familyAddress ? ` — ${usuario.familyAddress}` : ""}</dd></div>
        <div><dt className="text-muted">Data de nascimento</dt><dd className="font-semibold">{usuario.birthDateLabel}</dd></div>
        <div><dt className="text-muted">Data de cadastro</dt><dd className="font-semibold">{usuario.dataCriacao}</dd></div>
      </dl>
      <h3 className="mb-2 mt-6 font-bold">Família e inscrições</h3>
      <ul className="divide-y divide-divider rounded-lg border border-divider text-sm">
        <li className="px-4 py-3 text-muted">A composição familiar e as inscrições em departamentos ainda não estão disponíveis.</li>
      </ul>
    </>
  );
}

export default function DetalhesUsuario({ user: linha, service: servico, onClose: aoFechar, onEdit: aoEditar }) {
  const carregar = useCallback((signal) => servico.buscar(linha.id, signal), [servico, linha.id]);
  const { dados, carregando, erro, recarregar } = usarRecursoApi(carregar);
  return (
    <Modal title={dados?.name || linha.name} onClose={aoFechar} footer={<><Botao variant="outline" onClick={aoFechar}>Fechar</Botao><Botao onClick={() => aoEditar(dados)} disabled={!dados || carregando}><Icone name="edit" size={18} /> Editar</Botao></>}>
      {carregando && <p role="status" className="py-6 text-center text-muted">Carregando usuário...</p>}
      {erro && <div className="space-y-4"><p role="alert" className="text-sm text-danger">{erro}</p><Botao variant="outline" onClick={recarregar}>Tentar novamente</Botao></div>}
      {dados && !carregando && !erro && <DadosUsuario user={dados} />}
    </Modal>
  );
}
