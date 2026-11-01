import { Icone } from "./Icon.jsx";

const baseEntrada = "w-full bg-transparent outline-none placeholder:text-muted disabled:text-muted";

const baseCaixa = (erro) => `flex min-h-11 items-center rounded-lg border bg-white px-4 focus-within:ring-2 ${erro ? "border-danger focus-within:ring-danger/20" : "border-field focus-within:border-brand focus-within:ring-brand/20"}`;

function EstruturaCampo({ label: rotulo, error: erro, hint: dica, required: obrigatorio, className: nomeClasse, children: filhos }) {
  return (
    <label className={`block ${nomeClasse || ""}`}>
      <span className="mb-2 block text-sm font-semibold text-ink">{rotulo}{obrigatorio && <span className="text-danger"> *</span>}</span>
      {filhos}
      {erro ? <span role="alert" className="mt-1.5 block text-xs font-semibold text-danger">{erro}</span> : dica ? <span className="mt-1.5 block text-xs text-muted">{dica}</span> : null}
    </label>
  );
}

export function Campo({ label: rotulo, value: valor, onChange: aoAlterar, type: tipo = "text", placeholder: textoExemplo, error: erro, hint: dica, required: obrigatorio, readOnly: somenteLeitura = false, disabled: desabilitado = false, className: nomeClasse = "", min: minimo, max: maximo, maxLength: tamanhoMaximo, step: etapa, suffix: sufixo }) {
  return (
    <EstruturaCampo label={rotulo} error={erro} hint={dica} required={obrigatorio} className={nomeClasse}>
      <span className={`${baseCaixa(erro)} ${somenteLeitura ? "bg-canvas" : ""}`}>
        <input type={tipo} value={valor ?? ""} onChange={(evento) => aoAlterar?.(evento.target.value)} placeholder={textoExemplo} readOnly={somenteLeitura} disabled={desabilitado} min={minimo} max={maximo} maxLength={tamanhoMaximo} step={etapa} className={baseEntrada} />
        {sufixo}
      </span>
    </EstruturaCampo>
  );
}

export function CampoSelecao({ label: rotulo, value: valor, onChange: aoAlterar, options: opcoes, error: erro, hint: dica, required: obrigatorio, className: nomeClasse = "", placeholder: textoExemplo }) {
  return (
    <EstruturaCampo label={rotulo} error={erro} hint={dica} required={obrigatorio} className={nomeClasse}>
      <span className={baseCaixa(erro)}>
        <select value={valor ?? ""} onChange={(evento) => aoAlterar(evento.target.value)} className={`${baseEntrada} bg-white py-2`}>
          {textoExemplo && <option value="">{textoExemplo}</option>}
          {opcoes.map((objeto) => (typeof objeto === "string" ? <option key={objeto} value={objeto}>{objeto}</option> : <option key={objeto.value} value={objeto.value}>{objeto.label}</option>))}
        </select>
      </span>
    </EstruturaCampo>
  );
}

export function CampoAreaTexto({ label: rotulo, value: valor, onChange: aoAlterar, error: erro, required: obrigatorio, rows: linhas = 5, className: nomeClasse = "", placeholder: textoExemplo }) {
  return (
    <EstruturaCampo label={rotulo} error={erro} required={obrigatorio} className={nomeClasse}>
      <span className={`${baseCaixa(erro)} items-start py-2.5`}>
        <textarea rows={linhas} value={valor ?? ""} onChange={(evento) => aoAlterar(evento.target.value)} placeholder={textoExemplo} className={`${baseEntrada} resize-y`} />
      </span>
    </EstruturaCampo>
  );
}

export function EntradaBusca({ value: valor, onChange: aoAlterar, placeholder: textoExemplo = "Buscar", className: nomeClasse = "" }) {
  return (
    <div className={`flex min-h-11 items-center gap-3 rounded-lg border border-field bg-white px-4 text-muted focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 ${nomeClasse}`}>
      <Icone name="search" />
      <input value={valor} onChange={(evento) => aoAlterar(evento.target.value)} className="w-full bg-transparent text-ink outline-none" placeholder={textoExemplo} aria-label={textoExemplo} />
      {valor && <button type="button" aria-label="Limpar busca" onClick={() => aoAlterar("")} className="text-muted hover:text-ink"><Icone name="close" size={16} /></button>}
    </div>
  );
}

export function CaixaSelecao({ checked: marcado, onChange: aoAlterar, children: filhos }) {
  return (
    <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg border border-divider px-3 text-sm font-medium hover:bg-canvas">
      <input type="checkbox" checked={marcado} onChange={(evento) => aoAlterar(evento.target.checked)} className="size-4 accent-brand" />
      {filhos}
    </label>
  );
}

export function Alternador({ checked: marcado, onChange: aoAlterar, label: rotulo }) {
  return (
    <button type="button" role="switch" aria-checked={marcado} aria-label={rotulo} onClick={() => aoAlterar(!marcado)} className={`relative h-7 w-12 shrink-0 rounded-full transition focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${marcado ? "bg-brand" : "bg-field"}`}>
      <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-all ${marcado ? "left-[1.375rem]" : "left-0.5"}`} />
    </button>
  );
}
