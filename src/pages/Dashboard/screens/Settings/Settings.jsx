import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { usarRecursoApi } from "@/hooks/useApiResource.js";
import { criarServicoMinhaConta, mudouEmail, validarMinhaConta } from "@/services/minhaConta.js";
import { ErroApi } from "@/lib/api.js";
import { mascararTelefone } from "@/lib/data.js";
import { Botao, Cartao, Campo, Icone } from "@/components/ui";
import ModalSenha from "./PasswordModal.jsx";

export default function Configuracoes() {
  const { usuario, requisitar, atualizarContexto, sair } = usarAutenticacao();
  const servico = useMemo(() => criarServicoMinhaConta(requisitar), [requisitar]);
  const carregar = useCallback(async (signal) => {
    const conta = await servico.consultar(signal);
    if (conta.id !== usuario.id) throw new ErroApi(502, "A resposta não corresponde à sua conta. Tente novamente.");
    return conta;
  }, [servico, usuario.id]);
  const recurso = usarRecursoApi(carregar);
  const [senha, definirSenha] = useState(false);
  const [mensagem, definirMensagem] = useState(null);
  const [editandoPerfil, definirEditandoPerfil] = useState(false);
  const atualizada = async (conta) => {
    recurso.atualizarDados(() => conta);
    definirMensagem("Dados atualizados com sucesso.");
    definirEditandoPerfil(false);
    await atualizarContexto({ forcar: true });
  };

  return (
    <div className="max-w-4xl space-y-6" aria-busy={recurso.carregando}>
      {mensagem && <p role="status" className="rounded-lg bg-success-soft px-4 py-3 text-sm text-success">{mensagem}</p>}
      {recurso.carregando ? <Cartao className="p-7"><p role="status" className="text-muted">Carregando sua conta...</p></Cartao> : recurso.erro ? (
        <Cartao className="space-y-4 p-7"><p role="alert" className="text-danger">{recurso.erro}</p><Botao variant="outline" onClick={recurso.recarregar}>Tentar novamente</Botao></Cartao>
      ) : recurso.dados && recurso.dados.id === usuario.id && (
        <>
          <DadosPessoais key={usuario.id} conta={recurso.dados} servico={servico} aoAtualizar={atualizada} aoEditar={() => { definirMensagem(null); definirEditandoPerfil(true); }} aoCancelar={() => definirEditandoPerfil(false)} />
          <EnderecoFamilia conta={recurso.dados} />
          <Cartao className="p-5 md:p-7">
            <h2 className="text-xl font-bold">Segurança</h2>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">Senha: ••••••••</p>
              <Botao variant="secondary" disabled={editandoPerfil} onClick={() => { definirMensagem(null); definirSenha(true); }}>Alterar senha</Botao>
            </div>
          </Cartao>
          <Cartao className="p-5 md:p-7">
            <h2 className="text-xl font-bold">Preferências</h2>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-semibold">Notificações por e-mail</p><p className="text-sm text-muted">As preferências de notificações estarão disponíveis em uma próxima etapa.</p></div>
              <Botao variant="outline" disabled>Em breve</Botao>
            </div>
          </Cartao>
        </>
      )}
      {senha && <ModalSenha service={servico} onClose={() => definirSenha(false)} onSaved={() => sair("Senha alterada com sucesso. Entre novamente com a nova senha.")} />}
    </div>
  );
}

export function DadosPessoais({ conta, servico, aoAtualizar, aoEditar, aoCancelar }) {
  const [editando, definirEditando] = useState(false);
  const [formulario, definirFormulario] = useState(() => ({ ...conta, current: "" }));
  const [erros, definirErros] = useState({});
  const [erroEnvio, definirErroEnvio] = useState(null);
  const [salvando, definirSalvando] = useState(false);
  const envio = useRef(null);
  useEffect(() => () => envio.current?.abort(), []);
  const definir = (chave) => (valor) => {
    if (envio.current) return;
    definirFormulario((atual) => ({ ...atual, [chave]: chave === "phone" ? mascararTelefone(valor) : valor }));
    definirErros((atual) => ({ ...atual, [chave]: undefined }));
    definirErroEnvio(null);
  };
  const cancelar = useCallback(() => {
    if (envio.current) return;
    definirFormulario({ ...conta, current: "" });
    definirErros({});
    definirErroEnvio(null);
    definirEditando(false);
    aoCancelar();
  }, [conta, aoCancelar]);
  const editar = () => {
    definirFormulario({ ...conta, current: "" });
    definirErros({});
    definirErroEnvio(null);
    definirEditando(true);
    aoEditar();
  };
  const enviar = async (evento) => {
    evento?.preventDefault();
    if (envio.current || !editando) return;
    const proximo = validarMinhaConta(formulario, conta);
    definirErros(proximo);
    if (Object.keys(proximo).length) return;
    const controle = new AbortController();
    envio.current = controle;
    definirSalvando(true);
    definirErroEnvio(null);
    try {
      const contaAtualizada = await servico.atualizar(conta, formulario, controle.signal);
      if (controle.signal.aborted) return;
      definirFormulario({ ...contaAtualizada, current: "" });
      definirEditando(false);
      await aoAtualizar(contaAtualizada);
    } catch (erro) {
      if (!controle.signal.aborted && erro.name !== "AbortError") {
        if (erro.codigo === "SENHA_ATUAL_INCORRETA") definirErros((atual) => ({ ...atual, current: erro.message }));
        else if (erro.status === 409) definirErros((atual) => ({ ...atual, email: erro.message }));
        else definirErroEnvio(erro.message);
      }
    } finally {
      if (!controle.signal.aborted) definirSalvando(false);
      if (envio.current === controle) envio.current = null;
    }
  };
  const valores = editando ? formulario : conta;
  return (
    <Cartao className="p-5 md:p-7">
      <form onSubmit={enviar} noValidate aria-busy={salvando}>
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><h2 className="text-xl font-bold">Dados pessoais</h2><p className="mt-1 text-sm text-muted">Mantenha seus dados atualizados para receber comunicados.</p></div>
          {editando ? <div className="flex gap-2"><Botao variant="outline" onClick={cancelar} disabled={salvando}>Cancelar</Botao><Botao onClick={enviar} disabled={salvando}><Icone name="check" size={18} />{salvando ? "Salvando..." : "Salvar"}</Botao></div> : <Botao variant="secondary" onClick={editar} disabled={salvando}><Icone name="edit" size={18} /> Editar dados</Botao>}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Campo className="md:col-span-2" label="Nome" value={valores.name} onChange={definir("name")} error={erros.name} readOnly={!editando} disabled={salvando} maxLength={255} required />
          <Campo label="E-mail" type="email" value={valores.email} onChange={definir("email")} error={erros.email} readOnly={!editando} disabled={salvando} maxLength={255} required />
          <Campo label="Telefone" type="tel" value={valores.phone} onChange={definir("phone")} error={erros.phone} readOnly={!editando} disabled={salvando} maxLength={20} />
          <Campo label="Função" value={conta.funcao.nome} readOnly />
          <Campo label="Data de nascimento" value={conta.birthDateLabel} readOnly />
          {editando && mudouEmail(formulario, conta) && <Campo className="md:col-span-2" label="Senha atual" type="password" autoComplete="current-password" value={formulario.current} onChange={definir("current")} error={erros.current} hint="Confirme sua senha atual para alterar o e-mail usado no login." disabled={salvando} maxLength={255} required />}
        </div>
        {erroEnvio && <p role="alert" className="mt-4 text-sm font-semibold text-danger">{erroEnvio}</p>}
        {editando && <button type="submit" className="sr-only" tabIndex={-1} disabled={salvando}>Salvar dados pessoais</button>}
      </form>
    </Cartao>
  );
}

export function EnderecoFamilia({ conta }) {
  const familia = conta.family;
  return <Cartao className="p-5 md:p-7">
    <h2 className="text-xl font-bold">Família e endereço</h2>
    <p className="mt-1 text-sm text-muted">Os dados da família estão disponíveis somente para consulta.</p>
    {familia ? <div className="mt-5 grid gap-5 md:grid-cols-2">
      <Campo className="md:col-span-2" label="Família" value={familia.surname} readOnly />
      <Campo label="CEP" value={familia.cep} readOnly />
      <Campo className="md:col-span-2" label="Endereço" value={familia.address} readOnly />
      <Campo label="Número" value={familia.number} readOnly />
      <Campo label="Complemento" value={familia.complement} readOnly />
      <Campo label="Bairro" value={familia.district} readOnly />
      <Campo label="Cidade" value={familia.city} readOnly />
      <Campo label="UF" value={familia.uf} readOnly />
    </div> : <p className="mt-4 text-sm text-muted">Família não informada.</p>}
  </Cartao>;
}
