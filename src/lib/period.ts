/**
 * Períodos do dashboard (Hoje, 7 dias, Mês passado, Máximo, personalizado...).
 * Tudo em horário LOCAL do navegador; o backend agrupa no mesmo fuso
 * (parâmetro `tz`), então as chaves dos baldes batem.
 */
export type PeriodPreset = "today" | "yesterday" | "7d" | "30d" | "thisMonth" | "lastMonth" | "max" | "custom";
/** `from`/`to` em YYYY-MM-DD — só no personalizado. */
export type Period = { preset: PeriodPreset; from?: string; to?: string };
export type Bucket = "hour" | "day" | "month";

export type ResolvedPeriod = {
  start: Date | null; // null = desde o começo (Máximo)
  end: Date | null;
  /** Agrupamento pedido ao backend. */
  bucket: Bucket;
  /** Máximo: o gráfico escolhe dia ou mês conforme o histórico (chartBucketFor). */
  auto?: boolean;
  /** Texto curto pro botão: "Hoje", "Últimos 7 dias", "13 – 19 out". */
  label: string;
  /** Texto descritivo: "Hoje, 12 de outubro", "6 – 12 de out", "Todo o período". */
  description: string;
};

export const PERIOD_PRESETS: { preset: Exclude<PeriodPreset, "custom">; label: string }[] = [
  { preset: "today", label: "Hoje" },
  { preset: "yesterday", label: "Ontem" },
  { preset: "7d", label: "Últimos 7 dias" },
  { preset: "30d", label: "Últimos 30 dias" },
  { preset: "thisMonth", label: "Este mês" },
  { preset: "lastMonth", label: "Mês passado" },
  { preset: "max", label: "Máximo" },
];

export const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export const MONTHS_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const sameDay = (a: Date, b: Date) => ymd(a) === ymd(b);

/** "12 out" (+ ano se não for o ano corrente). */
function shortDate(d: Date, now: Date, forceYear = false) {
  const base = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  return forceYear || d.getFullYear() !== now.getFullYear() ? `${base} ${d.getFullYear()}` : base;
}

/** Intervalo "13 – 19 out" / "28 set – 4 out" / "28 dez 2025 – 4 jan 2026". */
export function rangeText(a: Date, b: Date, now = new Date()): string {
  const crossYear = a.getFullYear() !== b.getFullYear();
  if (!crossYear && a.getMonth() === b.getMonth()) {
    const tail = shortDate(b, now);
    return `${a.getDate()} – ${tail}`;
  }
  return `${shortDate(a, now, crossYear)} – ${shortDate(b, now, crossYear)}`;
}

export function resolvePeriod(p: Period, now = new Date()): ResolvedPeriod {
  const today = startOfDay(now);
  const y = today.getFullYear();
  const m = today.getMonth();
  switch (p.preset) {
    case "today":
      return { start: today, end: endOfDay(today), bucket: "hour", label: "Hoje", description: `Hoje, ${today.getDate()} de ${MONTHS[m]}` };
    case "yesterday": {
      const d = addDays(today, -1);
      return { start: d, end: endOfDay(d), bucket: "hour", label: "Ontem", description: `Ontem, ${d.getDate()} de ${MONTHS[d.getMonth()]}` };
    }
    case "7d": {
      const s = addDays(today, -6);
      return { start: s, end: endOfDay(today), bucket: "day", label: "Últimos 7 dias", description: rangeText(s, today, now) };
    }
    case "30d": {
      const s = addDays(today, -29);
      return { start: s, end: endOfDay(today), bucket: "day", label: "Últimos 30 dias", description: rangeText(s, today, now) };
    }
    case "thisMonth":
      return { start: new Date(y, m, 1), end: endOfDay(today), bucket: "day", label: "Este mês", description: `${MONTHS[m]} de ${y}` };
    case "lastMonth": {
      const s = new Date(y, m - 1, 1);
      const e = new Date(y, m, 0);
      return { start: s, end: endOfDay(e), bucket: "day", label: "Mês passado", description: `${MONTHS[s.getMonth()]} de ${s.getFullYear()}` };
    }
    case "max":
      // busca por DIA; o gráfico junta em meses se o histórico for longo
      return { start: null, end: null, bucket: "day", auto: true, label: "Máximo", description: "Todo o período" };
    case "custom":
    default: {
      let a = p.from ? parseYmd(p.from) : today;
      let b = p.to ? parseYmd(p.to) : a;
      if (b < a) [a, b] = [b, a];
      const days = Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000) + 1;
      const bucket: Bucket = days <= 1 ? "hour" : days <= 92 ? "day" : "month";
      const text = days <= 1 ? `${a.getDate()} de ${MONTHS[a.getMonth()]}${a.getFullYear() !== now.getFullYear() ? ` de ${a.getFullYear()}` : ""}` : rangeText(a, b, now);
      return { start: a, end: endOfDay(b), bucket, label: days <= 1 ? shortDate(a, now) : rangeText(a, b, now), description: text };
    }
  }
}

const WEEKDAYS_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Título do ponto no balão do gráfico: "08:00 – 10:00", "Qua, 08/10", "Outubro de 2026". */
export function bucketTitle(bucket: Bucket, key: string, now = new Date()): string {
  if (bucket === "hour") {
    const h = (Number(key) || 0) * 2;
    return `${pad(h)}:00 – ${pad((h + 2) % 24)}:00`;
  }
  if (bucket === "day") {
    const d = parseYmd(key);
    const year = d.getFullYear() !== now.getFullYear() ? `/${d.getFullYear()}` : "";
    return cap(`${WEEKDAYS_SHORT[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}${year}`);
  }
  const [y, m] = key.split("-").map(Number);
  return cap(`${MONTHS[(m || 1) - 1]} de ${y}`);
}

/** Ponto devolvido pelo backend (/api/user/sales-series). */
export type SeriesPoint = { k: string; total: number; paid: number; gross: number };
export type ChartBucket = { key: string; label: string; gross: number; paid: number; total: number };

/** Até quantos dias de histórico o Máximo mostra por dia (acima: por mês). */
const AUTO_DAY_LIMIT = 92;
/** Mínimo de dias no gráfico do Máximo (com 1 dia só não há linha). */
const AUTO_MIN_DAYS = 7;

/** Primeiro dia com movimento (chaves "YYYY-MM-DD..."), ou null. */
function firstDayOf(points: SeriesPoint[]): Date | null {
  let first: string | null = null;
  for (const p of points) if (first === null || p.k < first) first = p.k;
  return first ? parseYmd(first.slice(0, 10).length === 10 ? first.slice(0, 10) : `${first.slice(0, 7)}-01`) : null;
}

/** Agrupamento que o gráfico usa de fato (no Máximo depende do histórico). */
export function chartBucketFor(r: ResolvedPeriod, points: SeriesPoint[], now = new Date()): Bucket {
  if (!r.auto) return r.bucket;
  const first = firstDayOf(points);
  if (!first) return "day";
  const days = Math.round((startOfDay(now).getTime() - startOfDay(first).getTime()) / 86_400_000) + 1;
  return days <= AUTO_DAY_LIMIT ? "day" : "month";
}

/**
 * Monta os baldes do gráfico do período (preenchendo os vazios com zero):
 *  - hour: 12 baldes de 2h (00:00…22:00)
 *  - day:  um por dia do intervalo ("12/10"); no Máximo, do 1º dia com venda
 *          (pelo menos 7 dias) até hoje
 *  - month: um por mês ("out/26"); no Máximo, do 1º mês com venda até hoje.
 */
export function buildChartBuckets(r: ResolvedPeriod, points: SeriesPoint[], now = new Date()): ChartBucket[] {
  const out: ChartBucket[] = [];
  if (r.auto) {
    const bucket = chartBucketFor(r, points, now);
    if (bucket === "day") {
      const today = startOfDay(now);
      const minStart = addDays(today, -(AUTO_MIN_DAYS - 1));
      const first = firstDayOf(points);
      const start = first && first < minStart ? first : minStart;
      return buildChartBuckets({ ...r, auto: false, bucket: "day", start, end: endOfDay(today) }, points, now);
    }
    // histórico longo: soma os dias em meses
    const byMonth = new Map<string, SeriesPoint>();
    for (const p of points) {
      const k = p.k.slice(0, 7);
      const acc = byMonth.get(k) ?? { k, total: 0, paid: 0, gross: 0 };
      acc.total += Number(p.total) || 0;
      acc.paid += Number(p.paid) || 0;
      acc.gross += Number(p.gross) || 0;
      byMonth.set(k, acc);
    }
    return buildChartBuckets({ ...r, auto: false, bucket: "month" }, Array.from(byMonth.values()), now);
  }
  if (r.bucket === "hour") {
    for (let i = 0; i < 12; i++) out.push({ key: String(i), label: `${pad(i * 2)}:00`, gross: 0, paid: 0, total: 0 });
    for (const p of points) {
      const h = Number(p.k.slice(11, 13));
      const b = out[Math.min(11, Math.floor((Number.isFinite(h) ? h : 0) / 2))];
      if (!b) continue;
      b.gross += Number(p.gross) || 0;
      b.paid += Number(p.paid) || 0;
      b.total += Number(p.total) || 0;
    }
    return out;
  }
  const byKey = new Map(points.map((p) => [p.k, p]));
  const push = (key: string, label: string) => {
    const p = byKey.get(key);
    out.push({ key, label, gross: Number(p?.gross) || 0, paid: Number(p?.paid) || 0, total: Number(p?.total) || 0 });
  };
  if (r.bucket === "day") {
    const start = startOfDay(r.start ?? now);
    const end = startOfDay(r.end ?? now);
    for (let d = start, i = 0; d <= end && i < 400; d = addDays(d, 1), i++) {
      push(ymd(d), `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`);
    }
    return out;
  }
  // month
  const firstKey = points.length ? points.reduce((a, p) => (p.k < a ? p.k : a), points[0]!.k) : null;
  const startM = r.start ? new Date(r.start.getFullYear(), r.start.getMonth(), 1) : firstKey ? new Date(Number(firstKey.slice(0, 4)), Number(firstKey.slice(5, 7)) - 1, 1) : new Date(now.getFullYear(), now.getMonth(), 1);
  const endRef = r.end ?? now;
  const endM = new Date(endRef.getFullYear(), endRef.getMonth(), 1);
  for (let d = startM, i = 0; d <= endM && i < 240; d = new Date(d.getFullYear(), d.getMonth() + 1, 1), i++) {
    push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`, `${MONTHS_SHORT[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`);
  }
  return out;
}
