/**
 * Peças com cor do painel: selo de status e ícone de métrica.
 *
 * A cor sempre quer dizer algo (verde = pago/entrou, âmbar = pendente,
 * vermelho = reembolso/recusa, azul = em andamento, roxo = marca, teal = Pix).
 * As cores ficam em panel.css (claro) e dark.css (escuro) pelo `data-tone`,
 * sem estilo inline — assim o tema escuro troca sozinho.
 */
import type { ReactNode } from "react";
import type { TxStatus } from "@/lib/txStatus";

export type Tone = "violet" | "green" | "amber" | "red" | "blue" | "gray" | "teal";

/** Selo arredondado com bolinha. `plain` tira a bolinha (ex.: "Pix"). */
export function StatusBadge({ tone, plain, children }: { tone: Tone; plain?: boolean; children: ReactNode }) {
  return (
    <span className="sp-badge" data-tone={tone} data-plain={plain ? "true" : undefined}>
      {children}
    </span>
  );
}

/** Ícone de métrica num quadradinho tingido. */
export function IconChip({ tone = "violet", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className="sp-chip" data-tone={tone} aria-hidden="true">
      {children}
    </span>
  );
}

/** Status de transação (ver txStatus) -> tom do selo. */
export const TX_TONE: Record<TxStatus, Tone> = {
  PAID: "green",
  PENDING: "amber",
  PROCESSING: "blue",
  FAILED: "gray",
  EXPIRED: "gray",
  REFUNDED: "red",
  CHARGEBACK: "red",
};
