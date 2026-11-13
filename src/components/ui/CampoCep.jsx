import { useEffect, useRef, useState } from "react";
import { mascararCep } from "@/lib/data.js";
import { consultarCep } from "@/lib/viacep.js";
import { Campo } from "./Form.jsx";

export default function CampoCep({ value, onChange, onAddressFound, error, required, className = "", readOnly = false }) {
  const [erroConsulta, definirErroConsulta] = useState("");
  const [mensagem, definirMensagem] = useState("");
  const requisicao = useRef(null);

  useEffect(() => () => requisicao.current?.abort(), []);

  const alterarCep = (valor) => {
    const cep = mascararCep(valor);
    onChange(cep);
    requisicao.current?.abort();
    definirErroConsulta("");
    definirMensagem("");

    if (readOnly || cep.replace(/\D/g, "").length !== 8) return;

    const controlador = new AbortController();
    requisicao.current = controlador;
    definirMensagem("Consultando cep...");

    consultarCep(cep, { signal: controlador.signal })
      .then((endereco) => {
        if (controlador.signal.aborted) return;
        onAddressFound(endereco);
        definirMensagem("");
      })
      .catch((falha) => {
        if (controlador.signal.aborted) return;
        definirMensagem("");
        definirErroConsulta(falha.message === "CEP não encontrado."
          ? falha.message
          : "Não foi possível consultar o ViaCEP. Tente novamente.");
      });
  };

  return (
    <Campo
      className={className}
      label="CEP"
      value={value}
      onChange={alterarCep}
      error={erroConsulta || error}
      hint={readOnly ? undefined : mensagem || ""}
      readOnly={readOnly}
      required={required}
      placeholder="00000-000"
    />
  );
}
