import { useCallback, useEffect, useRef, useState } from "react";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { usarRecursoApi } from "@/hooks/useApiResource.js";
import { Botao, Campo, CampoSelecao, Modal } from "@/components/ui";

export function CamposEdicaoUsuario({ user: usuario, service: servico, onClose: aoFechar, onSave: aoSalvar }) {
  const { usuario: autenticado, podeAcessar } = usarAutenticacao();
  const podeConsultarFuncoes = podeAcessar("TELA_USUARIOS");
  const funcoes = usarRecursoApi(servico.listarFuncoes, podeConsultarFuncoes);
  const podeTrocarFuncao = podeConsultarFuncoes && funcoes.dados !== null && !funcoes.carregando && !funcoes.erro;
  const [formulario, definirFormulario] = useState({ name: usuario.name, phone: usuario.phone, ativo: usuario.ativo, funcaoId: usuario.funcaoId ?? "" });
  const [erros, definirErros] = useState({});
  const [erroEnvio, definirErroEnvio] = useState(null);
  const [salvando, definirSalvando] = useState(false);
  const envio = useRef(null);
  useEffect(() => () => envio.current?.abort(), []);
  const fechar = useCallback(() => { if (!salvando) aoFechar(); }, [salvando, aoFechar]);
  const definir = (chave) => (valor) => {
    definirFormulario((anterior) => ({ ...anterior, [chave]: valor }));
    definirErros((anterior) => ({ ...anterior, [chave]: undefined }));
    definirErroEnvio(null);
  };
  const opcoes = [
    ...(usuario.funcaoId ? [{ value: String(usuario.funcaoId), label: usuario.role }] : []),
    ...(funcoes.dados || []).filter((funcao) => funcao.id !== usuario.funcaoId).map((funcao) => ({ value: String(funcao.id), label: funcao.nome })),
  ];

  const enviar = async (evento) => {
    evento?.preventDefault();
    if (envio.current) return;
    const proximo = {};
    if (!formulario.name.trim()) proximo.name = "Informe o nome completo.";
    if (formulario.phone.length > 20) proximo.phone = "O telefone deve ter no máximo 20 caracteres.";
    const funcao = podeTrocarFuncao ? String(formulario.funcaoId) : String(usuario.funcaoId ?? "");
    if (!opcoes.some((opcao) => opcao.value === funcao)) proximo.funcaoId = "É necessário selecionar uma função válida.";
    definirErros(proximo);
    if (Object.keys(proximo).length) return;
    const controle = new AbortController();
    envio.current = controle;
    definirSalvando(true);
    definirErroEnvio(null);
    try {
      await aoSalvar(usuario, formulario, podeTrocarFuncao, controle.signal);
    } catch (erro) {
      if (!controle.signal.aborted && erro.name !== "AbortError") definirErroEnvio(erro.message);
    } finally {
      if (!controle.signal.aborted) definirSalvando(false);
      if (envio.current === controle) envio.current = null;
    }
  };

  return (
    <Modal title={`Editar ${usuario.name}`} onClose={fechar} footer={<><Botao variant="outline" onClick={fechar} disabled={salvando}>Cancelar</Botao><Botao onClick={enviar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Botao></>}>
      <form onSubmit={enviar} noValidate aria-busy={salvando}>
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoSelecao className="sm:col-span-2" label="Função do sistema" value={String(formulario.funcaoId)} onChange={definir("funcaoId")} options={opcoes} placeholder={usuario.funcaoId ? undefined : "Selecione a função"} disabled={salvando || !podeTrocarFuncao} error={erros.funcaoId} hint={funcoes.carregando ? "Carregando funções..." : !podeTrocarFuncao ? "A função atual será mantida até que as opções estejam disponíveis." : opcoes.length === 1 ? "Não há outras funções disponíveis." : undefined} required />
          <Campo className="sm:col-span-2" label="Nome completo" value={formulario.name} onChange={definir("name")} error={erros.name} disabled={salvando} required />
          <Campo label="E-mail" type="email" value={usuario.email} readOnly />
          <Campo label="Telefone" type="tel" value={formulario.phone} onChange={definir("phone")} error={erros.phone} maxLength={20} disabled={salvando} placeholder="(11) 99999-9999" />
          <Campo label="Data de nascimento" type="date" value={usuario.birthDate} readOnly />
          <CampoSelecao label="Situação" value={String(formulario.ativo)} onChange={(valor) => definir("ativo")(valor === "true")} options={[{ value: "true", label: "Ativo" }, { value: "false", label: "Inativo" }]} disabled={salvando} />
          <Campo className="sm:col-span-2" label="Família" value={usuario.family || "Não informada"} hint={usuario.familyAddress || undefined} readOnly />
          <Campo label="Data de cadastro" value={usuario.dataCriacao} readOnly />
        </div>
        {podeConsultarFuncoes && funcoes.erro && <div className="mt-4 space-y-2"><p role="alert" className="text-sm text-danger">Não foi possível carregar as funções. Os demais dados podem ser salvos mantendo a função atual.</p><Botao variant="outline" onClick={funcoes.recarregar} disabled={salvando}>Tentar carregar funções novamente</Botao></div>}
        {autenticado.id === usuario.id && !formulario.ativo && <p className="mt-4 rounded-lg bg-warning-soft p-3 text-sm text-warning">Ao desativar sua própria conta, você perderá o acesso à plataforma.</p>}
        <p className="mt-5 rounded-lg bg-brand-soft px-4 py-3 text-xs text-brand">E-mail, nascimento e família estão disponíveis apenas para consulta nesta etapa.</p>
        {erroEnvio && <p role="alert" className="mt-4 text-sm font-semibold text-danger">{erroEnvio}</p>}
        <button type="submit" className="sr-only" tabIndex={-1} disabled={salvando}>Salvar usuário</button>
      </form>
    </Modal>
  );
}

export default function FormularioEdicaoUsuario({ userId: id, service: servico, onClose: aoFechar, onSave: aoSalvar }) {
  const carregar = useCallback((signal) => servico.buscar(id, signal), [id, servico]);
  const { dados, carregando, erro, recarregar } = usarRecursoApi(carregar);
  if (dados && !carregando && !erro) return <CamposEdicaoUsuario key={dados.id} user={dados} service={servico} onClose={aoFechar} onSave={aoSalvar} />;
  return (
    <Modal title="Editar usuário" onClose={aoFechar} footer={<Botao variant="outline" onClick={aoFechar}>Fechar</Botao>}>
      {carregando && <p role="status" className="py-6 text-center text-muted">Carregando os dados atuais do usuário...</p>}
      {erro && <div className="space-y-4"><p role="alert" className="text-sm text-danger">{erro}</p><Botao variant="outline" onClick={recarregar}>Tentar novamente</Botao></div>}
    </Modal>
  );
}
