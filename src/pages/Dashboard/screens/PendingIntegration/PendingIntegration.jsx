import { Botao, Cartao, EstadoVazio } from "@/components/ui";

export default function TelaEmBreve({ screen: tela, navigate: navegar }) {
  return (
    <Cartao>
      <EstadoVazio
        icon={tela.icon}
        title="Em breve"
        action={<Botao variant="outline" onClick={() => navegar("home")}>Voltar ao início</Botao>}
      >
        A funcionalidade {tela.label} está autorizada para sua conta e estará disponível em breve.
      </EstadoVazio>
    </Cartao>
  );
}
