import { useState } from "react";
import { ehEmail, mascararCep, mascararTelefone } from "@/lib/data.js";
import { usarArmazenamento, usarUsuario } from "@/store";
import { Botao, Cartao, Campo, Icone, Alternador } from "@/components/ui";
import ModalSenha from "./PasswordModal.jsx";

const CHAVES_ENDERECOS = ["address", "number", "complement", "uf", "city", "cep", "district"];

export default function Configuracoes({ role: papel, account: conta }) {
  const { state: dadosAplicacao, save: salvar, setProfile: definirPerfil, setPassword: definirSenhaConta, reset: redefinir, toast: aviso, confirm: confirmar } = usarArmazenamento();
  const usuario = usarUsuario(conta);
  const [editando, definirEditando] = useState(false);
  // o endereço do associado é o da sua família (cadastrado em Cadastros › Famílias)
  const enderecoDe = () => (papel === "member" && usuario.family ? CHAVES_ENDERECOS.reduce((acumulador, chave) => ({ ...acumulador, [chave]: usuario.family[chave] || "" }), {}) : {});
  const formularioInicial = () => ({ ...usuario.profile, ...enderecoDe() });
  const [formulario, definirFormulario] = useState(formularioInicial);
  const [erros, definirErros] = useState({});
  const [senha, definirSenhaAcesso] = useState(false);

  const definir = (chave) => (valor) => {
    const mascarado = chave === "phone" ? mascararTelefone(valor) : chave === "cep" ? mascararCep(valor) : chave === "uf" ? valor.toUpperCase().slice(0, 2) : valor;
    definirFormulario((elementoF) => ({ ...elementoF, [chave]: mascarado }));
    definirErros((evento) => ({ ...evento, [chave]: undefined }));
  };
  const cancelar = () => { definirFormulario(formularioInicial()); definirErros({}); definirEditando(false); };
  const enviar = () => {
    const proximo = {};
    if (formulario.name.trim().length < 3) proximo.name = "Informe o nome.";
    if (!ehEmail(formulario.email)) proximo.email = "Informe um e-mail válido.";
    if (formulario.phone.replace(/\D/g, "").length < 10) proximo.phone = "Informe um telefone com DDD.";
    if (papel === "member") {
      if (formulario.cep && formulario.cep.replace(/\D/g, "").length !== 8) proximo.cep = "CEP deve ter 8 dígitos.";
      if (formulario.uf && formulario.uf.length !== 2) proximo.uf = "Use a sigla com 2 letras.";
    }
    definirErros(proximo);
    if (Object.keys(proximo).length) return;
    const limpar = { ...formulario, name: formulario.name.trim(), email: formulario.email.trim() };
    const dadosPerfil = Object.fromEntries(Object.entries(limpar).filter(([chave]) => !CHAVES_ENDERECOS.includes(chave)));
    definirPerfil(conta, dadosPerfil);
    if (papel === "member" && usuario.family) salvar("families", { ...usuario.family, ...Object.fromEntries(CHAVES_ENDERECOS.map((chave) => [chave, limpar[chave] || ""])) });
    if (papel === "member" && usuario.associate) salvar("associates", { ...usuario.associate, name: limpar.name, email: limpar.email, phone: limpar.phone });
    if (papel === "dependent" && usuario.associate) salvar("associates", { ...usuario.associate, dependents: usuario.associate.dependents.map((parametro) => (parametro.id === usuario.profile.personId ? { ...parametro, name: limpar.name, email: limpar.email, phone: limpar.phone } : parametro)) });
    definirFormulario(limpar);
    definirEditando(false);
    aviso("Dados atualizados");
  };

  const camposConta = [["name", "Nome"], ["email", "E-mail", "email"], ["phone", "Telefone", "tel"]];
  const camposMembro = [["address", "Endereço"], ["number", "Número"], ["complement", "Complemento"], ["uf", "UF"], ["city", "Cidade"], ["cep", "CEP"], ["district", "Bairro"]];

  return (
    <div className="max-w-4xl space-y-6">
      <Cartao className="p-5 md:p-7">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><h2 className="text-xl font-bold">Dados pessoais</h2><p className="mt-1 text-sm text-muted">Mantenha seus dados atualizados para receber comunicados.</p></div>
          {editando ? <div className="flex gap-2"><Botao variant="outline" onClick={cancelar}>Cancelar</Botao><Botao onClick={enviar}><Icone name="check" size={18} /> Salvar</Botao></div> : <Botao variant="secondary" onClick={() => definirEditando(true)}><Icone name="edit" size={18} /> Editar dados</Botao>}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {camposConta.map(([chave, rotulo, tipo]) => <Campo key={chave} className={chave === "name" ? "md:col-span-2" : ""} label={rotulo} type={tipo} value={formulario[chave]} onChange={definir(chave)} error={erros[chave]} readOnly={!editando} />)}
          {papel === "member" && camposMembro.map(([chave, rotulo]) => <Campo key={chave} className={chave === "address" ? "md:col-span-2" : ""} label={rotulo} value={formulario[chave] || ""} onChange={definir(chave)} error={erros[chave]} readOnly={!editando} />)}
        </div>
      </Cartao>

      <Cartao className="p-5 md:p-7">
        <h2 className="text-xl font-bold">Segurança</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">Senha: ••••••••</p>
          <Botao variant="secondary" onClick={() => definirSenhaAcesso(true)}>Alterar senha</Botao>
        </div>
      </Cartao>

      <Cartao className="p-5 md:p-7">
        <h2 className="text-xl font-bold">Preferências</h2>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div><p className="font-semibold">Notificações por e-mail</p><p className="text-sm text-muted">Receba avisos de reservas, pagamentos e notícias no seu e-mail.</p></div>
          <Alternador checked={!!usuario.profile.emailNotifications} onChange={(valorAuxiliar) => { definirPerfil(conta, { emailNotifications: valorAuxiliar }); definirFormulario((elementoF) => ({ ...elementoF, emailNotifications: valorAuxiliar })); aviso(valorAuxiliar ? "Notificações por e-mail ativadas" : "Notificações por e-mail desativadas"); }} label="Notificações por e-mail" />
        </div>
      </Cartao>

      {papel === "admin" && (
        <Cartao className="p-5 md:p-7">
          <h2 className="text-xl font-bold">Dados do protótipo</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">Tudo o que você cadastra fica salvo neste navegador. Restaure para voltar aos dados de exemplo.</p>
            <Botao variant="outline" onClick={() => confirmar({ title: "Restaurar dados de exemplo", message: "Todos os cadastros, lançamentos e notificações criados por você serão apagados.", confirmLabel: "Restaurar", onConfirm: () => { redefinir(); definirFormulario(dadosAplicacao.profiles[conta]); aviso("Dados de exemplo restaurados"); } })}>Restaurar dados</Botao>
          </div>
        </Cartao>
      )}

      {senha && <ModalSenha current={dadosAplicacao.passwords[conta]} onClose={() => definirSenhaAcesso(false)} onSave={(valor) => { definirSenhaConta(conta, valor); definirSenhaAcesso(false); aviso("Senha alterada"); }} />}
    </div>
  );
}
