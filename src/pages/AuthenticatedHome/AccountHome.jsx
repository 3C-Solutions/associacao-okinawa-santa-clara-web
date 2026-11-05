import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { Cartao } from "@/components/ui";
import AcessosConta from "./AccessCards.jsx";

export default function InicioConta(propriedades) {
  const { usuario } = usarAutenticacao();
  return (
    <div className="space-y-6">
      <p className="text-muted">Seu acesso à plataforma está confirmado.</p>
      <Cartao className="p-6">
        <h2 className="text-lg font-bold">Sua conta</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><dt className="text-sm text-muted">Nome</dt><dd className="mt-1 break-words font-semibold">{usuario.nome}</dd></div>
          <div><dt className="text-sm text-muted">E-mail</dt><dd className="mt-1 break-all font-semibold">{usuario.email}</dd></div>
        </dl>
      </Cartao>
      <AcessosConta {...propriedades} />
    </div>
  );
}
