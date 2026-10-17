import PinguLanding from "@/components/landing-pingu/PinguLanding";

// Página pública (/). Usuário logado é mandado pro painel pelo _app.tsx.
// Versão alternativa (estilo Átomo) em /lp/atomo.
export default function Home() {
  return <PinguLanding />;
}
