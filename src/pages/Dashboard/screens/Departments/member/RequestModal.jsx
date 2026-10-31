import { useState } from "react";
import { Botao, CaixaSelecao, Modal } from "@/components/ui";

export default function ModalSolicitacao({ department: departamento, people: pessoas, full: completo, onClose: aoFechar, onSave: aoSalvar }) {
  const [identificadores, definirIdentificadores] = useState([]);
  const alternar = (identificador, ligado) => definirIdentificadores((lista) => (ligado ? [...lista, identificador] : lista.filter((valorX) => valorX !== identificador)));
  return (
    <Modal size="sm" title={`Solicitar inscrição — ${departamento.name}`} onClose={aoFechar} footer={<><Botao variant="outline" onClick={aoFechar}>Cancelar</Botao><Botao disabled={!identificadores.length} onClick={() => aoSalvar(identificadores)}>{completo ? "Entrar na lista de espera" : "Enviar solicitação"}</Botao></>}>
      <p className="mb-4 text-sm text-muted">Selecione quem da família deseja participar. O departamento analisará a solicitação.{completo ? " As vagas estão preenchidas, então a solicitação entrará na lista de espera." : ""}</p>
      <div className="space-y-2">{pessoas.map((parametro) => <CaixaSelecao key={parametro.id} checked={identificadores.includes(parametro.id)} onChange={(ligado) => alternar(parametro.id, ligado)}>{parametro.name} <span className="text-muted">· {parametro.relation}</span></CaixaSelecao>)}</div>
    </Modal>
  );
}
