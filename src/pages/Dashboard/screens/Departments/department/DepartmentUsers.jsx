import { useState } from "react";
import { SENHA_INICIAL, ehEmail, mascararTelefone, identificadorUnico } from "@/lib/data.js";
import { emailEmUso } from "@/lib/people.js";
import { usarArmazenamento } from "@/store";
import { Selo, Botao, Cartao, Campo, Icone, BotaoIcone, Modal } from "@/components/ui";

// Usuários com perfil Departamento: quem cadastra novos usuários do departamento é um usuário do próprio departamento.
export default function UsuariosDepartamento({ department: departamento, account: conta }) {
  const { state: dadosAplicacao, addAccount: adicionarConta, removeAccounts: removerContas, toast: aviso, confirm: confirmar } = usarArmazenamento();
  const [abrir, definirAberto] = useState(false);
  const [formulario, definirFormulario] = useState({ name: "", email: "", phone: "" });
  const [erros, definirErros] = useState({});
  const usuarios = Object.entries(dadosAplicacao.profiles).filter(([, parametro]) => parametro.role === "department" && parametro.departmentId === departamento.id);
  const definir = (chave) => (valor) => { definirFormulario((elementoF) => ({ ...elementoF, [chave]: chave === "phone" ? mascararTelefone(valor) : valor })); definirErros((evento) => ({ ...evento, [chave]: undefined })); };
  const fechar = () => { definirAberto(false); definirFormulario({ name: "", email: "", phone: "" }); definirErros({}); };

  const enviar = () => {
    const proximo = {};
    if (formulario.name.trim().length < 3) proximo.name = "Informe o nome completo.";
    if (!ehEmail(formulario.email)) proximo.email = "Informe um e-mail válido.";
    else if (emailEmUso(dadosAplicacao, formulario.email)) proximo.email = "Já existe um usuário com este e-mail.";
    if (formulario.phone.replace(/\D/g, "").length < 10) proximo.phone = "Informe um telefone com DDD.";
    definirErros(proximo);
    if (Object.keys(proximo).length) return;
    adicionarConta(`u-${identificadorUnico()}`, { role: "department", name: formulario.name.trim(), email: formulario.email.trim(), phone: formulario.phone, departmentId: departamento.id, emailNotifications: true }, SENHA_INICIAL);
    aviso(`Usuário do departamento cadastrado. Senha inicial: ${SENHA_INICIAL}.`);
    fechar();
  };

  const excluir = ([chave, parametro]) => confirmar({ title: "Excluir usuário", message: `Excluir ${parametro.name}? Ele(a) perderá o acesso ao departamento.`, onConfirm: () => { removerContas((ignorado, chave) => chave === chave); aviso("Usuário excluído"); } });

  return (
    <Cartao className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold">Usuários do departamento ({usuarios.length})</h2>
          <p className="mt-1 text-xs text-muted">Quem tem perfil Departamento cadastra outros usuários do mesmo departamento.</p>
        </div>
        <Botao variant="secondary" className="min-h-9 px-4 text-sm" onClick={() => definirAberto(true)}><Icone name="plus" size={16} /> Novo usuário</Botao>
      </div>
      <ul className="mt-4 divide-y divide-divider rounded-lg border border-divider text-sm">
        {usuarios.map(([chave, parametro]) => (
          <li key={chave} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span><span className="font-semibold">{parametro.name}</span><span className="block text-xs text-muted">{parametro.email}</span></span>
            {chave === conta ? <Selo tone="info">Você</Selo> : <BotaoIcone icon="trash" label={`Excluir ${parametro.name}`} tone="danger" size="sm" onClick={() => excluir([chave, parametro])} />}
          </li>
        ))}
      </ul>
      {abrir && (
        <Modal title="Novo usuário do departamento" onClose={fechar} footer={<><Botao variant="outline" onClick={fechar}>Cancelar</Botao><Botao onClick={enviar}>Salvar</Botao></>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo className="sm:col-span-2" label="Nome completo" value={formulario.name} onChange={definir("name")} error={erros.name} required />
            <Campo label="E-mail" type="email" value={formulario.email} onChange={definir("email")} error={erros.email} required />
            <Campo label="Telefone" type="tel" value={formulario.phone} onChange={definir("phone")} error={erros.phone} placeholder="(11) 99999-9999" required />
          </div>
          <p className="mt-5 rounded-lg bg-brand-soft px-4 py-3 text-xs text-brand">O novo usuário terá acesso a {departamento.name}. A senha inicial é {SENHA_INICIAL}; ele(a) pode alterá-la em Configurações.</p>
        </Modal>
      )}
    </Cartao>
  );
}
