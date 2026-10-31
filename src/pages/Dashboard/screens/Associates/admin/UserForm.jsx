import { useState } from "react";
import { TIPOS_CRIAVEIS_ADMIN, SENHA_INICIAL, RELACOES, TIPOS_USUARIOS, ehEmail, mascararTelefone, hojeISO } from "@/lib/data.js";
import { associadoDaFamilia, emailEmUso, rotuloFamilia } from "@/lib/people.js";
import { usarArmazenamento } from "@/store";
import { Botao, Campo, Modal, CampoSelecao } from "@/components/ui";

const rotuloTipo = (tipo) => TIPOS_USUARIOS.find((tempo) => tempo.value === tipo)?.label || "";

// Cadastro de UM usuário por vez: a diretoria só cadastra Diretoria e Associado responsável (Departamento e Dependente são cadastrados por quem é dono deles).
// user = null (novo) ou a linha da lista (edição; o tipo não pode ser trocado).
export default function FormularioUsuario({ user: usuario, onClose: aoFechar, onSave: aoSalvar, onGoToFamilies: aoIrParaFamilias }) {
  const { state: dadosAplicacao } = usarArmazenamento();
  const editando = !!usuario;
  const [formulario, definirFormulario] = useState(() => ({
    type: usuario?.type || "",
    name: usuario?.name || "",
    email: usuario?.email || "",
    phone: usuario?.phone || "",
    departmentId: usuario?.departmentIds?.[0] || "",
    familyId: usuario?.associate?.familyId || "",
    since: usuario?.associate?.since || hojeISO(),
    relation: usuario?.person?.relation || "Filho(a)",
  }));
  const [erros, definirErros] = useState({});
  const definir = (chave) => (valor) => { definirFormulario((elementoF) => ({ ...elementoF, [chave]: chave === "phone" ? mascararTelefone(valor) : valor })); definirErros((evento) => ({ ...evento, [chave]: undefined })); };

  // Associado responsável: só famílias já cadastradas e que ainda não têm responsável (a própria, se estiver editando).
  // Dependente: só famílias que já têm um associado responsável.
  const identificadorPropriaFamilia = editando && usuario.type === "member" ? usuario.associate.familyId : null;
  const familiasDe = (tipo) => dadosAplicacao.families.filter((elementoF) => {
    const responsavel = associadoDaFamilia(dadosAplicacao, elementoF.id);
    return tipo === "member" ? !responsavel || elementoF.id === identificadorPropriaFamilia : !!responsavel;
  });
  const opcoesFamilia = (tipo) => familiasDe(tipo).map((elementoF) => ({ value: elementoF.id, label: `${rotuloFamilia(elementoF)} · ${elementoF.address}${elementoF.number ? `, ${elementoF.number}` : ""}` }));
  const familiasDisponiveis = formulario.type === "member" || formulario.type === "dependent" ? opcoesFamilia(formulario.type) : [];
  const precisaDeFamilia = formulario.type === "member" || formulario.type === "dependent";
  const semFamilia = precisaDeFamilia && familiasDisponiveis.length === 0;

  const ignorarIdentificadores = editando ? [usuario.id, usuario.person?.id, usuario.associate?.id].filter(Boolean) : [];

  const enviar = () => {
    const proximo = {};
    if (!formulario.type) proximo.type = "Selecione o tipo de perfil.";
    if (formulario.name.trim().length < 3) proximo.name = "Informe o nome completo.";
    if (!ehEmail(formulario.email)) proximo.email = "Informe um e-mail válido.";
    else if (emailEmUso(dadosAplicacao, formulario.email, ignorarIdentificadores)) proximo.email = "Já existe um usuário com este e-mail.";
    if (formulario.phone.replace(/\D/g, "").length < 10) proximo.phone = "Informe um telefone com DDD.";
    if (formulario.type === "department" && !formulario.departmentId) proximo.departmentId = "Selecione o departamento.";
    if (precisaDeFamilia && !formulario.familyId) proximo.familyId = semFamilia ? "Cadastre uma família antes de continuar." : "Selecione a família.";
    if (formulario.type === "member" && !formulario.since) proximo.since = "Informe a data de início.";
    definirErros(proximo);
    if (!Object.keys(proximo).length) aoSalvar({ ...formulario, name: formulario.name.trim(), email: formulario.email.trim() });
  };

  return (
    <Modal title={editando ? `Editar ${rotuloTipo(formulario.type).toLowerCase()}` : "Novo usuário"} onClose={aoFechar} footer={<><Botao variant="outline" onClick={aoFechar}>Cancelar</Botao><Botao onClick={enviar} disabled={semFamilia}>Salvar</Botao></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        {editando
          ? <Campo className="sm:col-span-2" label="Tipo de perfil" value={rotuloTipo(formulario.type)} readOnly />
          : <CampoSelecao className="sm:col-span-2" label="Tipo de perfil" value={formulario.type} onChange={(valorAuxiliar) => definirFormulario((elementoF) => ({ ...elementoF, type: valorAuxiliar, familyId: "" }))} error={erros.type} placeholder="Selecione o tipo de perfil" options={TIPOS_CRIAVEIS_ADMIN} required />}

        {formulario.type && (
          <>
            <Campo className="sm:col-span-2" label="Nome completo" value={formulario.name} onChange={definir("name")} error={erros.name} required />
            <Campo label="E-mail" type="email" value={formulario.email} onChange={definir("email")} error={erros.email} required />
            <Campo label="Telefone" type="tel" value={formulario.phone} onChange={definir("phone")} error={erros.phone} placeholder="(11) 99999-9999" required />
          </>
        )}

        {formulario.type === "department" && (
          <CampoSelecao className="sm:col-span-2" label="Departamento responsável" value={formulario.departmentId} onChange={definir("departmentId")} error={erros.departmentId} placeholder="Selecione o departamento" options={dadosAplicacao.departments.map((dataValor) => ({ value: dataValor.id, label: dataValor.name }))} required />
        )}

        {precisaDeFamilia && (
          editando && usuario.type === "dependent"
            ? <Campo className="sm:col-span-2" label="Família" value={rotuloFamilia(dadosAplicacao.families.find((elementoF) => elementoF.id === formulario.familyId))} readOnly />
            : <CampoSelecao className="sm:col-span-2" label="Família" value={formulario.familyId} onChange={definir("familyId")} error={erros.familyId} placeholder={semFamilia ? "Nenhuma família disponível" : "Selecione a família"} options={familiasDisponiveis} required />
        )}

        {formulario.type === "member" && <Campo label="Associado desde" type="date" value={formulario.since} onChange={definir("since")} error={erros.since} required />}
        {formulario.type === "dependent" && <CampoSelecao label="Vínculo com o responsável" value={formulario.relation} onChange={definir("relation")} options={RELACOES} required />}
      </div>

      {semFamilia && (
        <div className="mt-5 rounded-lg border border-warning bg-warning-soft px-4 py-3 text-sm" role="alert">
          <p className="font-semibold">{formulario.type === "member" ? "Cadastre a família antes do associado responsável." : "Nenhuma família com associado responsável."}</p>
          <p className="mt-1 text-muted">{formulario.type === "member" ? "Todo associado responsável pertence a uma família. Não há famílias sem responsável disponíveis no momento." : "Cadastre primeiro o associado responsável da família para depois incluir dependentes."}</p>
          {formulario.type === "member" && <Botao variant="outline" className="mt-3" onClick={aoIrParaFamilias}>Cadastrar família</Botao>}
        </div>
      )}
      <p className="mt-5 rounded-lg bg-brand-soft px-4 py-3 text-xs text-brand">Cada cadastro cria um único usuário. {editando ? "" : `A senha inicial é ${SENHA_INICIAL}; o próprio usuário pode alterá-la em Configurações.`}</p>
    </Modal>
  );
}
