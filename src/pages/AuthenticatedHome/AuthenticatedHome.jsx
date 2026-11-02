import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { Botao, Cartao, Icone, Titulo } from "@/components/ui";

const FUNCIONALIDADES = [
  { codigo: "TELA_USUARIOS", titulo: "Usuários", icone: "person" },
  { codigo: "TELA_FUNCOES_SISTEMA", titulo: "Funções do sistema", icone: "settings" },
];

export default function InicioAutenticado({ onLogout }) {
  const { usuario, permissoes, podeAcessar, atualizando } = usarAutenticacao();
  const funcionalidades = FUNCIONALIDADES.filter((item) => podeAcessar(item.codigo));
  const outros = permissoes.filter((codigo) => !FUNCIONALIDADES.some((item) => item.codigo === codigo)).length;

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-divider bg-white">
        <div className="mx-auto flex max-w-dashboard flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="" className="size-11 rounded-full object-contain" />
            <p className="font-bold text-brand">Okinawa Santa Clara<br /><span className="text-sm font-medium text-muted">Portal da Associação</span></p>
          </div>
          <Botao variant="outline" onClick={onLogout}><Icone name="logout" /> Sair</Botao>
        </div>
      </header>
      <main className="mx-auto max-w-dashboard space-y-6 px-4 py-8 md:px-8 md:py-12">
        <div>
          <p className="mb-2 text-sm font-semibold text-brand">{usuario.funcaoSistema.nome}</p>
          <Titulo>Bem-vindo, {usuario.nome}</Titulo>
          <p className="mt-2 text-muted">Seu acesso à plataforma está confirmado.</p>
        </div>
        <Cartao className="p-6">
          <h2 className="text-lg font-bold">Sua conta</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><dt className="text-sm text-muted">Nome</dt><dd className="mt-1 break-words font-semibold">{usuario.nome}</dd></div>
            <div><dt className="text-sm text-muted">E-mail</dt><dd className="mt-1 break-all font-semibold">{usuario.email}</dd></div>
          </dl>
        </Cartao>
        <section aria-busy={atualizando}>
          <Cartao className="p-6">
            <h2 className="text-lg font-bold">Seus acessos</h2>
            {permissoes.length === 0 ? <p className="mt-3 text-muted">Nenhuma tela liberada. Entre em contato com a administração para solicitar acesso.</p> : (
              <>
                <p className="mt-2 text-sm text-muted">As funcionalidades abaixo estão autorizadas para sua conta e estarão disponíveis em breve.</p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {funcionalidades.map((item) => (
                    <li key={item.codigo} className="flex items-center gap-3 rounded-xl bg-brand-soft p-4 text-brand">
                      <Icone name={item.icone} /><span className="font-semibold">{item.titulo}</span><span className="ml-auto text-xs">Em breve</span>
                    </li>
                  ))}
                  {outros > 0 && <li className="rounded-xl bg-canvas p-4 text-sm text-muted">{outros === 1 ? "Mais uma funcionalidade autorizada" : `Mais ${outros} funcionalidades autorizadas`} · Em breve</li>}
                </ul>
              </>
            )}
            <p role="status" className="mt-3 text-sm text-muted">{atualizando ? "Atualizando seus acessos..." : ""}</p>
          </Cartao>
        </section>
      </main>
    </div>
  );
}
