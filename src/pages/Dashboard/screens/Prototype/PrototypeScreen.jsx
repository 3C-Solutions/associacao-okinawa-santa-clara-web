import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { Icone } from "@/components/ui";

// O papel administrativo é somente o contexto de demonstração esperado pelos protótipos.
// A autorização e a identidade do painel continuam pertencendo à sessão real.
export default function TelaPrototipo({ screen: tela, ...propriedades }) {
  const { podeAcessar } = usarAutenticacao();
  if (!tela.prototipo || !tela.permissao || !podeAcessar(tela.permissao)) return null;
  const Tela = tela.componente;

  return (
    <div className="space-y-6">
      <div role="note" aria-label="Modo protótipo" className="flex items-start gap-3 rounded-xl border border-divider bg-brand-soft p-4 text-brand">
        <span className="mt-0.5 shrink-0"><Icone name="info" /></span>
        <div>
          <p className="text-sm font-semibold">Modo protótipo</p>
          <p className="mt-1 text-sm">Dados de demonstração. Alterações salvas apenas neste navegador.</p>
        </div>
      </div>
      <Tela {...propriedades} role="admin" account="admin" />
    </div>
  );
}
