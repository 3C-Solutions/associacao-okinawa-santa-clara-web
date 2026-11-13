export default function LayoutAcesso({ children }) {
  return (
    <div className="grid min-h-dvh bg-canvas lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-brand lg:block">
        <img src="/associacao.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand via-brand/50 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <img src="/logo.jpg" alt="Logo da Associação Okinawa de Santa Clara" className="size-14 rounded-full object-contain" />
          <p className="mt-7 max-w-lg text-4xl font-bold leading-tight">Uma comunidade mais conectada começa aqui.</p>
          <p className="mt-4 max-w-md text-white/75">Acesse informações, acompanhe eventos e cuide da sua participação na associação.</p>
        </div>
      </aside>
      <main className="flex items-center justify-center px-4 py-10">{children}</main>
    </div>
  );
}
