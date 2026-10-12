/**
 * Status de transação — ÚNICO tradutor do frontend.
 *
 * A API manda `status` com apelido ("approved", "pending", "refunded"...) e o
 * valor do banco em `statusRaw` ("PAID", "PENDING"...). As telas comparavam
 * `status.toUpperCase() === "PAID"`, que NUNCA batia ("APPROVED") — por isso
 * venda paga não contava no dashboard/relatórios. Use sempre estas funções.
 */
export type TxStatus = "PAID" | "PENDING" | "PROCESSING" | "FAILED" | "REFUNDED" | "CHARGEBACK" | "EXPIRED";

const ALIAS: Record<string, TxStatus> = {
  PAID: "PAID",
  APPROVED: "PAID",
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  FAILED: "FAILED",
  REJECTED: "FAILED",
  CANCELED: "FAILED",
  CANCELLED: "FAILED",
  REFUNDED: "REFUNDED",
  CHARGEBACK: "CHARGEBACK",
  EXPIRED: "EXPIRED",
};

type TxLike = { status?: string | null; statusRaw?: string | null } | null | undefined;

export function txStatus(t: TxLike): TxStatus {
  const raw = String(t?.statusRaw || t?.status || "").toUpperCase();
  return ALIAS[raw] ?? "PENDING";
}

export const isPaidTx = (t: TxLike) => txStatus(t) === "PAID";
export const isPendingTx = (t: TxLike) => {
  const s = txStatus(t);
  return s === "PENDING" || s === "PROCESSING";
};
export const isRefundTx = (t: TxLike) => {
  const s = txStatus(t);
  return s === "REFUNDED" || s === "CHARGEBACK";
};
export const isFailedTx = (t: TxLike) => {
  const s = txStatus(t);
  return s === "FAILED" || s === "EXPIRED";
};

/** Rótulo + cores do selo de status (mesmo visual em todas as telas). */
export const TX_STATUS_STYLE: Record<TxStatus, { label: string; bg: string; color: string; dot: string }> = {
  PAID: { label: "Paga", bg: "#ECFDF5", color: "#047857", dot: "#10B981" },
  PENDING: { label: "Pendente", bg: "#FFFBEB", color: "#B45309", dot: "#F59E0B" },
  PROCESSING: { label: "Processando", bg: "#EFF6FF", color: "#1D4ED8", dot: "#3B82F6" },
  FAILED: { label: "Falhou", bg: "#F8FAFC", color: "#475569", dot: "#94A3B8" },
  EXPIRED: { label: "Expirada", bg: "#F8FAFC", color: "#475569", dot: "#94A3B8" },
  REFUNDED: { label: "Reembolsada", bg: "#FEF2F2", color: "#B91C1C", dot: "#EF4444" },
  CHARGEBACK: { label: "Chargeback", bg: "#FEF2F2", color: "#B91C1C", dot: "#EF4444" },
};

/** Totais por status que a API devolve em `data.stats` (calculados no banco). */
export type SalesStats = {
  total: number;
  paid: { count: number; gross: number; net: number };
  pending: { count: number; gross: number; net: number };
  refunded: { count: number; gross: number; net: number };
  failed: { count: number; gross: number; net: number };
  conversion: number;
  avgTicket: number;
};

export const EMPTY_STATS: SalesStats = {
  total: 0,
  paid: { count: 0, gross: 0, net: 0 },
  pending: { count: 0, gross: 0, net: 0 },
  refunded: { count: 0, gross: 0, net: 0 },
  failed: { count: 0, gross: 0, net: 0 },
  conversion: 0,
  avgTicket: 0,
};
