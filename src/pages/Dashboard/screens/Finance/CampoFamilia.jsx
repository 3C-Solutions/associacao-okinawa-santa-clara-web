import { useEffect, useState } from "react";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { Botao, CampoSelecao } from "@/components/ui";

export default function CampoFamilia({ carregar, value, onChange, required = false, disabled = false, error, className = "" }) {
  const { podeAcessar } = usarAutenticacao();
  const permitido = podeAcessar("TELA_FAMILIAS");
  const [familias, setFamilias] = useState([]);
  const [carregando, setCarregando] = useState(permitido);
  const [erro, setErro] = useState("");
  const [versao, setVersao] = useState(0);
  useEffect(() => {
    if (!permitido) { setCarregando(false); setFamilias([]); return undefined; }
    const controle = new AbortController();
    setCarregando(true);
    setErro("");
    carregar({ signal: controle.signal })
      .then((lista) => {
        if (!controle.signal.aborted) {
          if (!Array.isArray(lista)) throw new Error("Não foi possível carregar as famílias.");
          setFamilias(lista);
        }
      })
      .catch((falha) => { if (!controle.signal.aborted) setErro(falha.message); })
      .finally(() => { if (!controle.signal.aborted) setCarregando(false); });
    return () => controle.abort();
  }, [carregar, permitido, versao]);
  const opcoes = [{ value: "", label: required ? "Selecione uma família" : "Sem família" },
    ...familias.map((familia) => ({ value: String(familia.id), label: `${familia.nome} — #${familia.id}` }))];
  if (value !== "" && value != null && !familias.some((f) => String(f.id) === String(value))) {
    opcoes.push({ value: String(value), label: `Família #${value} (vínculo atual)` });
  }
  const dica = !permitido ? "Seu perfil não permite consultar famílias." : carregando ? "Carregando famílias..."
    : erro ? "A lista não pôde ser atualizada. O vínculo atual foi preservado."
    : !familias.length ? "Nenhuma família cadastrada." : required ? "Selecione a família do pagamento." : "Deixe sem família se não houver vínculo.";
  return <div className={className}>
    <CampoSelecao label={required ? "Família" : "Família (opcional)"} value={String(value ?? "")} onChange={onChange}
      options={opcoes} required={required} disabled={disabled || carregando} error={error} hint={dica} />
    {erro && permitido && <div role="alert" className="mt-2 space-y-2 text-xs text-danger">
      <p>{erro}</p><Botao type="button" variant="outline" disabled={disabled || carregando} onClick={() => setVersao((v) => v + 1)}>Recarregar famílias</Botao>
    </div>}
  </div>;
}
