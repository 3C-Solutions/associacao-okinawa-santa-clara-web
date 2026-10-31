import { useState } from "react";
import { SENHA_INICIAL, RELACOES, ehEmail, mascararTelefone } from "@/lib/data.js";
import { emailEmUso } from "@/lib/people.js";
import { usarArmazenamento } from "@/store";
import { Selo, Botao, CaixaSelecao, Campo, Modal, CampoSelecao } from "@/components/ui";

export default function FormularioPessoa({ person: pessoa, departments: departamentos, requests: solicitacoes, hasAccess: temAcesso = false, onClose: aoFechar, onSave: aoSalvar, onRemove: aoRemover }) {
  const { state: dadosAplicacao } = usarArmazenamento();
  const [formulario, definirFormulario] = useState({ email: "", phone: "", ...pessoa });
  const [erro, definirErro] = useState("");
  const [erros, definirErros] = useState({});
  const [solicitado, definirSolicitado] = useState([]);
  const alternar = (identificador, ligado) => definirSolicitado((lista) => (ligado ? [...lista, identificador] : lista.filter((dataValor) => dataValor !== identificador)));
  const abrirPara = (departmentId) => solicitacoes.find((resultado) => resultado.departmentId === departmentId && resultado.personId === pessoa.id && (resultado.status === "Pendente" || resultado.status === "Lista de espera"));
  const enviar = () => {
    const proximo = {};
    if (formulario.name.trim().length < 2) { definirErro("Informe o nome."); return; }
    const email = formulario.email.trim();
    if (!formulario.main) {
      if (temAcesso && !email) proximo.email = "Este dependente tem acesso ao sistema: informe o e-mail.";
      else if (email && !ehEmail(email)) proximo.email = "Informe um e-mail válido.";
      else if (email && emailEmUso(dadosAplicacao, email, [pessoa.id])) proximo.email = "Já existe um usuário com este e-mail.";
      if (formulario.phone && formulario.phone.replace(/\D/g, "").length < 10) proximo.phone = "Informe um telefone com DDD.";
    }
    definirErros(proximo);
    if (Object.keys(proximo).length) return;
    aoSalvar({ ...formulario, name: formulario.name.trim(), email: email, phone: formulario.phone }, solicitado);
  };
  return (
    <Modal title={pessoa.isNew ? "Novo membro da família" : pessoa.name} onClose={aoFechar} footer={<>{aoRemover && <Botao variant="danger" onClick={aoRemover} className="sm:mr-auto">Remover</Botao>}<Botao variant="outline" onClick={aoFechar}>Cancelar</Botao><Botao onClick={enviar}>{solicitado.length ? "Salvar e solicitar" : "Salvar"}</Botao></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nome" value={formulario.name} onChange={(valorAuxiliar) => { definirFormulario({ ...formulario, name: valorAuxiliar }); definirErro(""); }} error={erro} readOnly={formulario.main} hint={formulario.main ? "Para alterar seus dados, use Configurações." : undefined} required />
        {formulario.main ? <Campo label="Vínculo" value="Responsável" readOnly /> : <CampoSelecao label="Vínculo" value={formulario.relation} onChange={(valorAuxiliar) => definirFormulario({ ...formulario, relation: valorAuxiliar })} options={RELACOES} />}
        {!formulario.main && <Campo label="E-mail (opcional)" type="email" value={formulario.email} onChange={(valorAuxiliar) => { definirFormulario({ ...formulario, email: valorAuxiliar }); definirErros((evento) => ({ ...evento, email: undefined })); }} error={erros.email} hint={temAcesso ? undefined : `Com e-mail, o dependente ganha acesso ao sistema (senha inicial: ${SENHA_INICIAL}).`} />}
        {!formulario.main && <Campo label="Telefone (opcional)" type="tel" value={formulario.phone} onChange={(valorAuxiliar) => { definirFormulario({ ...formulario, phone: mascararTelefone(valorAuxiliar) }); definirErros((evento) => ({ ...evento, phone: undefined })); }} error={erros.phone} placeholder="(11) 99999-9999" />}
      </div>
      <h3 className="mb-1 mt-6 font-bold">Departamentos</h3>
      <p className="mb-3 text-xs text-muted">Marque os departamentos que deseja solicitar. A inscrição só é efetivada quando o departamento aprovar.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {departamentos.map((dataValor) => {
          const matriculado = formulario.departmentIds.includes(dataValor.id);
          const abrir = abrirPara(dataValor.id);
          if (matriculado || abrir) return <div key={dataValor.id} className="flex min-h-10 items-center justify-between gap-2 rounded-lg border border-divider bg-canvas px-3 text-sm font-medium"><span>{dataValor.name}</span><Selo tone={matriculado ? "success" : abrir.status === "Pendente" ? "warning" : "info"}>{matriculado ? "Inscrito" : abrir.status === "Pendente" ? "Solicitado" : "Em espera"}</Selo></div>;
          return <CaixaSelecao key={dataValor.id} checked={solicitado.includes(dataValor.id)} onChange={(ligado) => alternar(dataValor.id, ligado)}>{dataValor.name}</CaixaSelecao>;
        })}
      </div>
    </Modal>
  );
}
