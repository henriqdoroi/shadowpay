/**
 * Patentes da ShadowPay — o nível do seller pelo faturamento da vida toda.
 *
 * Mesmos marcos da pílula "Faturamento" do topo (10K, 100K, 500K, 1M...) e
 * dos prêmios da campanha. Só exibição: nada disso vai pro backend.
 */
export type Rank = { name: string; min: number; tagline: string };

export const RANKS: Rank[] = [
  { name: "Recruta", min: 0, tagline: "Todo mestre já foi recruta. Faça a primeira venda." },
  { name: "Sombra", min: 10_000, tagline: "Você já se move sem ser visto. Continue." },
  { name: "Lâmina", min: 100_000, tagline: "Cada venda corta mais fundo. Afie a operação." },
  { name: "Ninja de Elite", min: 500_000, tagline: "Poucos chegam aqui. A escala é sua arma." },
  { name: "Mestre das Sombras", min: 1_000_000, tagline: "O primeiro milhão. Agora você ensina." },
  { name: "Lenda", min: 2_000_000, tagline: "Seu nome já é conhecido no submundo." },
  { name: "Shogun", min: 5_000_000, tagline: "Você comanda o próprio exército." },
  { name: "Imortal", min: 10_000_000, tagline: "Não existe topo acima deste." },
];

/** Prêmios da campanha (os mesmos do banner do Dashboard). */
export const PRIZES = [
  { target: 100_000, prize: "AirPods 4ª geração" },
  { target: 500_000, prize: "iPad" },
  { target: 1_000_000, prize: "iPhone 18 Pro Max" },
  { target: 2_000_000, prize: "Fix de R$ 10.000" },
];

export function rankFor(revenue: number) {
  const v = Math.max(0, revenue || 0);
  let idx = 0;
  for (let i = 0; i < RANKS.length; i++) if (v >= RANKS[i]!.min) idx = i;
  const current = RANKS[idx]!;
  const next = RANKS[idx + 1] ?? null;
  const pct = next ? Math.min(100, ((v - current.min) / (next.min - current.min)) * 100) : 100;
  return { idx, current, next, pct, missing: next ? next.min - v : 0 };
}

export function fmtShort(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}K`;
  return `R$ ${Math.round(v)}`;
}
