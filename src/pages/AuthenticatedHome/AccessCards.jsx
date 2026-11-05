import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { Cartao, Icone } from "@/components/ui";

export default function AcessosConta({ screens: telas = [], navigate: navegar }) {
  const { permissoes, podeAcessar, atualizando } = usarAutenticacao();
  const funcionalidades = telas.filter((item) => item.permissao && podeAcessar(item.permissao));
  const outros = permissoes.filter((codigo) => !telas.some((item) => item.permissao === codigo)).length;

  return (
    <section aria-busy={atualizando}>
      <Cartao className="p-6">
        <h2 className="text-lg font-bold">Seus acessos</h2>
        {permissoes.length === 0 ? <p className="mt-3 text-muted">Nenhuma tela liberada. Entre em contato com a administração para solicitar acesso.</p> : (
          <>
            <p className="mt-2 text-sm text-muted">Confira as funcionalidades autorizadas para sua conta.</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {funcionalidades.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => navegar(item.id)} className="flex min-h-16 w-full items-center gap-3 rounded-xl bg-brand-soft p-4 text-left text-brand transition hover:bg-brand-soft-strong focus:outline-none focus:ring-2 focus:ring-brand">
                    <Icone name={item.icon} /><span className="font-semibold">{item.label}</span>{item.prototipo ? <span className="ml-auto text-xs">Protótipo</span> : item.emBreve && <span className="ml-auto text-xs">Em breve</span>}
                  </button>
                </li>
              ))}
              {outros > 0 && <li className="rounded-xl bg-canvas p-4 text-sm text-muted">{outros === 1 ? "Mais uma funcionalidade autorizada" : `Mais ${outros} funcionalidades autorizadas`} · Em breve</li>}
            </ul>
          </>
        )}
        <p role="status" className="mt-3 text-sm text-muted">{atualizando ? "Atualizando seus acessos..." : ""}</p>
      </Cartao>
    </section>
  );
}
