import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { usarRecursoApi } from "@/hooks/useApiResource.js";
import { criarServicoFamilias } from "@/services/familias.js";
import { criarServicoFuncoesSistema } from "@/services/funcoesSistema.js";
import { validarCadastroUsuario } from "@/services/usuarios.js";
import { adicionarDias, hojeISO, mascararTelefone } from "@/lib/data.js";
import { Botao, Campo, CampoSelecao, Modal } from "@/components/ui";

// Cadastro de um usuário pela API. A senha provisória é gerada pelo back-end e enviada por e-mail.
export default function FormularioCadastroUsuario({ onClose: aoFechar, onSave: aoSalvar }) {
  const { podeAcessar, requisitar } = usarAutenticacao();
  const servicoFamilias = useMemo(() => criarServicoFamilias(requisitar), [requisitar]);
  const servicoFuncoes = useMemo(() => criarServicoFuncoesSistema(requisitar), [requisitar]);
  const podeConsultarFamilias = podeAcessar("TELA_FAMILIAS");
  const familias = usarRecursoApi(servicoFamilias.listar, podeConsultarFamilias);
  const funcoes = usarRecursoApi(servicoFuncoes.listar);
  const [formulario, definirFormulario] = useState({ name: "", email: "", phone: "", birthDate: "", familyId: "", funcaoId: "" });
  const [erros, definirErros] = useState({});
  const [erroEnvio, definirErroEnvio] = useState(null);
  const [salvando, definirSalvando] = useState(false);
  const envio = useRef(null);
  useEffect(() => () => envio.current?.abort(), []);
  const fechar = useCallback(() => { if (!salvando) aoFechar(); }, [salvando, aoFechar]);
  const definir = (chave) => (valor) => {
    definirFormulario((anterior) => ({ ...anterior, [chave]: chave === "phone" ? mascararTelefone(valor) : valor }));
    definirErros((anterior) => ({ ...anterior, [chave]: undefined }));
    definirErroEnvio(null);
  };

  const opcoesFamilias = (familias.dados || []).slice().sort((a, b) => a.surname.localeCompare(b.surname, "pt-BR"))
    .map((familia) => ({ value: String(familia.id), label: `${familia.surname} — #${familia.id}` }));
  const opcoesFuncoes = (funcoes.dados || []).map((funcao) => ({ value: String(funcao.id), label: funcao.nome }));
  const dicaFamilia = !podeConsultarFamilias ? "Seu perfil não permite consultar famílias."
    : familias.carregando ? "Carregando famílias..." : familias.erro ? undefined
    : !opcoesFamilias.length ? "Nenhuma família cadastrada. Cadastre a família na tela Famílias antes de continuar." : undefined;
  const dicaFuncao = funcoes.carregando ? "Carregando funções..." : !funcoes.erro && !opcoesFuncoes.length ? "Nenhuma função cadastrada." : undefined;
  const bloqueado = salvando || !podeConsultarFamilias || !opcoesFamilias.length || !opcoesFuncoes.length;

  const enviar = async (evento) => {
    evento?.preventDefault();
    if (envio.current || bloqueado) return;
    const proximo = validarCadastroUsuario(formulario);
    definirErros(proximo);
    if (Object.keys(proximo).length) return;
    const controle = new AbortController();
    envio.current = controle;
    definirSalvando(true);
    definirErroEnvio(null);
    try {
      await aoSalvar(formulario, controle.signal);
    } catch (erro) {
      if (controle.signal.aborted || erro.name === "AbortError") return;
      if (erro.status === 409) definirErros((anterior) => ({ ...anterior, email: "Já existe um usuário com este e-mail." }));
      else definirErroEnvio(erro.message);
    } finally {
      if (!controle.signal.aborted) definirSalvando(false);
      if (envio.current === controle) envio.current = null;
    }
  };

  return (
    <Modal title="Novo usuário" onClose={fechar} footer={<><Botao variant="outline" onClick={fechar} disabled={salvando}>Cancelar</Botao><Botao onClick={enviar} disabled={bloqueado}>{salvando ? "Salvando..." : "Cadastrar"}</Botao></>}>
      <form onSubmit={enviar} noValidate aria-busy={salvando}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo className="sm:col-span-2" label="Nome completo" value={formulario.name} onChange={definir("name")} error={erros.name} disabled={salvando} required />
          <Campo label="E-mail" type="email" value={formulario.email} onChange={definir("email")} error={erros.email} disabled={salvando} autoComplete="off" required />
          <Campo label="Telefone" type="tel" value={formulario.phone} onChange={definir("phone")} error={erros.phone} placeholder="(11) 99999-9999" maxLength={20} disabled={salvando} required />
          <Campo label="Data de nascimento" type="date" value={formulario.birthDate} onChange={definir("birthDate")} error={erros.birthDate} max={adicionarDias(hojeISO(), -1)} disabled={salvando} required />
          <CampoSelecao label="Função do sistema" value={formulario.funcaoId} onChange={definir("funcaoId")} options={opcoesFuncoes} placeholder="Selecione a função" error={erros.funcaoId} hint={dicaFuncao} disabled={salvando || funcoes.carregando} required />
          <CampoSelecao className="sm:col-span-2" label="Família" value={formulario.familyId} onChange={definir("familyId")} options={opcoesFamilias} placeholder="Selecione a família" error={erros.familyId} hint={dicaFamilia} disabled={salvando || familias.carregando || !podeConsultarFamilias} required />
        </div>
        {familias.erro && <div className="mt-4 space-y-2"><p role="alert" className="text-sm text-danger">Não foi possível carregar as famílias.</p><Botao variant="outline" onClick={familias.recarregar} disabled={salvando}>Tentar novamente</Botao></div>}
        {funcoes.erro && <div className="mt-4 space-y-2"><p role="alert" className="text-sm text-danger">Não foi possível carregar as funções.</p><Botao variant="outline" onClick={funcoes.recarregar} disabled={salvando}>Tentar novamente</Botao></div>}
        <p className="mt-5 rounded-lg bg-brand-soft px-4 py-3 text-xs text-brand">Uma senha provisória será gerada e enviada para o e-mail informado.</p>
        {erroEnvio && <p role="alert" className="mt-4 text-sm font-semibold text-danger">{erroEnvio}</p>}
        <button type="submit" className="sr-only" tabIndex={-1} disabled={bloqueado}>Cadastrar usuário</button>
      </form>
    </Modal>
  );
}
