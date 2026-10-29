"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useValuesVisible } from "@/lib/useValuesVisible";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import Head from "next/head";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import { CheckCircle2, CircleDollarSign, Percent, Receipt, TrendingUp, Trophy, Wallet } from "lucide-react";
import { IconChip, StatusBadge, TX_TONE } from "@/components/PanelBits";

/** Meia-lua de 0–100% (taxa de conversão). */
function ConversionGauge({ pct }: { pct: number }) {
  return (
    <svg width="64" height="36" viewBox="0 0 64 36" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id="spGaugeFill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#B552F9" />
          <stop offset="100%" stopColor="#8A1EF7" />
        </linearGradient>
      </defs>
      <path className="sp-gauge-track" d="M6 32 A26 26 0 0 1 58 32" fill="none" strokeWidth="6" strokeLinecap="round" />
      <path
        d="M6 32 A26 26 0 0 1 58 32"
        fill="none"
        stroke="url(#spGaugeFill)"
        strokeWidth="6"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={`${pct} 100`}
      />
    </svg>
  );
}

import ProtectedRoute from "@/components/ProtectedRoute";
import ShadowPanel from "@/components/ShadowPanel";
import TwoFAModal from "./2faAuthentication";
import { LightShell } from "@/components/LightShell";
import { PushPromptBanner } from "@/components/PushPromptBanner";
import { PeriodPicker } from "@/components/PeriodPicker";
import { EMPTY_STATS, TX_STATUS_STYLE, txStatus, type SalesStats } from "@/lib/txStatus";

/** Venda da lista "Últimas vendas" (mesmo formato do /transactions-report). */
type RecentTx = {
  id: string;
  status: string;
  statusRaw?: string | null;
  grossAmount: number | string;
  createdAt: string;
  customer?: { name?: string } | null;
  customerName?: string | null;
  product?: { name?: string } | null;
  productName?: string;
};

/** "agora", "há 5 min", "há 3 h", "ontem", "12/10". */
function timeAgo(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return "ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
import {
  PERIOD_PRESETS,
  bucketTitle,
  buildChartBuckets,
  chartBucketFor,
  resolvePeriod,
  ymd,
  type ChartBucket,
  type Period,
  type SeriesPoint,
} from "@/lib/period";

const API = "https://shadowpay-backend.onrender.com";
/** Último período escolhido neste aparelho. */
const PERIOD_KEY = "sp_dash_period";

/* ============================================================
 * TOKENS LIGHT — locais a essa página, ignora o ThemeProvider dark
 * ============================================================ */
const T = {
  bg: "#F6F8FB",
  card: "#FFFFFF",
  border: "#E6E8EB",
  borderStrong: "rgba(15, 23, 42, 0.10)",
  text: "#1A1F36",
  text2: "#475569",
  textMuted: "#8A94A6",
  primary: "#8A1EF7",
  primaryBg: "rgba(138, 30, 247, 0.08)",
  cardShadow: "0 1px 1px rgba(15, 23, 42, 0.04)",
};

const BUCKET_TEXT = { hour: "por hora", day: "por dia", month: "por mês" } as const;

/** Período salvo neste aparelho (ou "Hoje"). */
function loadSavedPeriod(): Period {
  const fallback: Period = { preset: "today" };
  if (typeof window === "undefined") return fallback;
  try {
    const saved = JSON.parse(localStorage.getItem(PERIOD_KEY) || "null");
    const isDay = (s: unknown) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
    if (saved?.preset === "custom") return isDay(saved.from) ? { preset: "custom", from: saved.from, to: isDay(saved.to) ? saved.to : saved.from } : fallback;
    if (PERIOD_PRESETS.some((p) => p.preset === saved?.preset)) return { preset: saved.preset };
  } catch {
    /* ignora */
  }
  return fallback;
}

/* ============================================================
 * MAIN DASHBOARD
 * ============================================================ */
function DashboardContent() {
  const { user, token } = useAuth();
  const [localUser, setLocalUser] = useState<any>(user);
  // Olho da barra do topo (salvo no navegador, igual em todas as páginas)
  const [valuesVisible, toggleValues] = useValuesVisible();
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);

  /* ---------- período (Hoje, 7 dias, Máximo, personalizado...) ---------- */
  const [period, setPeriod] = useState<Period>(loadSavedPeriod);
  const changePeriod = (p: Period) => {
    setPeriod(p);
    try {
      localStorage.setItem(PERIOD_KEY, JSON.stringify(p));
    } catch {
      /* ignora */
    }
  };
  // muda à meia-noite pra "Hoje"/"7 dias" acompanharem o dia novo sem recarregar
  const [dayKey, setDayKey] = useState(() => ymd(new Date()));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resolved = useMemo(() => resolvePeriod(period), [period, dayKey]);

  /* ---------- perfil (flags do 2FA) ---------- */
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const r = await axios.get(`${API}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.data?.success && r.data.data) {
          setLocalUser({
            ...r.data.data,
            twofaEnabled: Boolean(r.data.data.twofaEnabled),
            twofaConfirmed: Boolean(r.data.data.twofaConfirmed),
          });
        }
      } catch (e) {
        console.error("profile error", e);
      }
    })();
  }, [token]);

  /* ---------- dados do período ----------
   * Métricas: `stats` de /transactions-report (calculado no banco pro
   * período inteiro). Gráfico: /sales-series (agrupado no banco no fuso do
   * aparelho). `summary.totalEntradas` = líquido da vida toda (premiação).
   */
  const [stats, setStats] = useState<SalesStats>(EMPTY_STATS);
  const [points, setPoints] = useState<SeriesPoint[]>([]);
  const [lifetimeNet, setLifetimeNet] = useState(0);
  const [recent, setRecent] = useState<RecentTx[]>([]);
  const [loading, setLoading] = useState(true);
  const reqId = useRef(0);

  const fetchData = async (silent: boolean) => {
    if (!token) return;
    const id = ++reqId.current;
    if (!silent) setLoading(true);
    const range = new URLSearchParams();
    if (resolved.start) range.append("startDate", resolved.start.toISOString());
    if (resolved.end) range.append("endDate", resolved.end.toISOString());
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";
    const headers = { Authorization: `Bearer ${token}` };
    const [rep, ser, last] = await Promise.allSettled([
      axios.get(`${API}/api/user/transactions-report?page=1&limit=1&${range}`, { headers }),
      axios.get(
        `${API}/api/user/sales-series?bucket=${resolved.bucket}&tz=${encodeURIComponent(tz)}&${range}`,
        { headers }
      ),
      // "Últimas vendas": as 6 mais recentes, sem filtro de período
      axios.get(`${API}/api/user/transactions-report?page=1&limit=6`, { headers }),
    ]);
    if (id !== reqId.current) return; // trocou de período no meio: ignora resposta velha
    if (rep.status === "fulfilled" && rep.value.data?.success) {
      setStats(rep.value.data.data.stats || EMPTY_STATS);
      setLifetimeNet(Number(rep.value.data.data.summary?.totalEntradas) || 0);
    }
    if (last.status === "fulfilled" && last.value.data?.success) {
      setRecent(last.value.data.data.transactions || []);
    }
    if (ser.status === "fulfilled" && ser.value.data?.success) {
      setPoints(ser.value.data.data.points || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!token) return;
    fetchData(false);
    // atualiza sozinho a cada 30s pra venda nova entrar sem recarregar
    const t = setInterval(() => {
      const k = ymd(new Date());
      if (k !== dayKey) setDayKey(k); // virou o dia → recalcula o período e busca de novo
      else fetchData(true);
    }, 30_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, period, dayKey]);

  const chartData = useMemo(() => buildChartBuckets(resolved, points), [resolved, points]);
  // no "Máximo" vira por dia ou por mês conforme o histórico
  const chartBucket = useMemo(() => chartBucketFor(resolved, points), [resolved, points]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v || 0);
  const num = (v: number) => new Intl.NumberFormat("pt-BR").format(v || 0);
  const hideable = (v: string) => (valuesVisible ? v : "••••••");
  // eixo do gráfico: "R$ 750", "R$ 2,5K", "R$ 1,2M"
  const axisMoney = (v: number) => {
    if (!valuesVisible) return "•••";
    const short = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
    if (v >= 1_000_000) return `R$ ${short(v / 1_000_000)}M`;
    if (v >= 1000) return `R$ ${short(v / 1000)}K`;
    return `R$ ${Math.round(v)}`;
  };

  if (!user) return null;

  /* Faixa de métricas — valores exatos do período selecionado. */
  /* O 1º card (faturamento) é o destaque pintado de roxo; a conversão ganha
     um medidor (como os gateways de referência). */
  const statStrip: { label: string; value: string; icon: JSX.Element; gauge?: number }[] = [
    { label: "Faturamento bruto", value: hideable(fmt(stats.paid.gross)), icon: <TrendingUp /> },
    { label: "Faturamento líquido", value: hideable(fmt(stats.paid.net)), icon: <Wallet /> },
    {
      label: "Taxa de conversão",
      value: `${stats.conversion.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}%`,
      icon: <Percent />,
      gauge: Math.max(0, Math.min(100, stats.conversion)),
    },
    { label: "Ticket médio", value: hideable(fmt(stats.avgTicket)), icon: <Receipt /> },
    { label: "Vendas pagas", value: num(stats.paid.count), icon: <CheckCircle2 /> },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Boa madrugada" : hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const todayLabel = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  /* Próxima premiação — progresso do faturamento rumo aos prêmios da campanha
     (os mesmos do banner). Usa o faturamento TOTAL (agregado do backend). */
  const prizes = [
    { target: 100_000, prize: "AirPods 4ª geração" },
    { target: 500_000, prize: "iPad" },
    { target: 1_000_000, prize: "iPhone 18 Pro Max" },
    { target: 2_000_000, prize: "Fix de R$ 10.000" },
  ];
  const totalRevenue = lifetimeNet;
  const lastPrize = prizes[prizes.length - 1]!;
  const nextPrize = prizes.find((p) => totalRevenue < p.target) ?? lastPrize;
  const prizeProgress = Math.min(100, (totalRevenue / nextPrize.target) * 100);
  const prizeFirstName =
    (user?.companyName || "Operador").split(" ")[0] || "Operador";
  const fmtTarget = (v: number) =>
    v >= 1_000_000
      ? `${(v / 1_000_000).toLocaleString("pt-BR", {
          maximumFractionDigits: 1,
        })}M`
      : `${Math.round(v / 1000)}K`;

  return (
    <>
      <Head>
        <title>ShadowPay — Dashboard</title>
      </Head>

      <LightShell valuesVisible={valuesVisible} onToggleValues={toggleValues}>
            <div style={{ fontFeatureSettings: '"tnum" 1' }}>
              {/* Saudação com o nome em roxo */}
              <header className="mb-5">
                <h1 className="text-[22px] font-semibold text-slate-900 sm:text-[26px]">
                  {greeting}, <span className="sp-brand-text">{prizeFirstName}</span>
                </h1>
                <p className="mt-1 text-[14px] text-slate-500 first-letter:uppercase">{todayLabel}</p>
              </header>

              {/* BANNER promocional — largura total do conteúdo (igual à faixa
                  de métricas). Arquivo em public/dashboard-banner.webp. */}
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="mb-6"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/dashboard-banner.webp"
                  alt="ShadowPay — seu lucro vale mais"
                  className="block h-auto w-full rounded-[12px]"
                  draggable={false}
                />
              </motion.section>

              {/* Convite pra ativar as notificações de venda neste aparelho */}
              <PushPromptBanner token={token} />

              {/* 2FA modal (controlado pelo banner do hero) */}
              <TwoFAModal
                isOpen={is2FAModalOpen}
                onClose={() => setIs2FAModalOpen(false)}
                token={token!}
                user={localUser}
                setUser={setLocalUser}
              />

              {/* KPIs — cards separados; o 1º é o destaque roxo com brilho.
                  O período (seletor no card do gráfico) vale pra eles também. */}
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5"
                style={{ opacity: loading ? 0.55 : 1, transition: "opacity 0.2s" }}
              >
                {statStrip.map((s, i) => (
                  <div
                    key={s.label}
                    className={`sp-kpi relative flex min-w-0 flex-col overflow-hidden rounded-2xl p-4 sm:p-5 ${
                      i === 0 ? "sp-kpi-hero sp-glow col-span-2 md:col-span-1" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <IconChip>{s.icon}</IconChip>
                      {s.gauge != null && <ConversionGauge pct={s.gauge} />}
                    </div>
                    <p className="sp-kpi-label mt-4 text-[13.5px] font-medium leading-tight">{s.label}</p>
                    <span
                      className={`sp-kpi-value mt-1.5 whitespace-nowrap font-semibold leading-none tabular-nums ${
                        s.value.length > 12
                          ? "text-[17px] sm:text-[20px] 2xl:text-[24px]"
                          : "text-[20px] sm:text-[24px] 2xl:text-[28px]"
                      }`}
                      style={{
                        fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
                      }}
                    >
                      {s.value}
                    </span>
                  </div>
                ))}
              </motion.section>

              {/* GRÁFICO + PRÓXIMA PREMIAÇÃO (premiação ocupa a coluna direita) */}
              <section className="mb-6 grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[1.4fr_1fr]">
                {/* Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="flex flex-col rounded-xl p-4 sm:p-5"
                  style={{
                    background: T.card,
                    border: `1px solid ${T.border}`,
                    boxShadow: T.cardShadow,
                  }}
                >
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2
                        className="text-[15px] font-semibold text-slate-900"
                        style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
                      >
                        Desempenho
                      </h2>
                      <p className="text-[13px] text-slate-500">
                        Faturamento {BUCKET_TEXT[chartBucket]} · {resolved.description}
                      </p>
                    </div>
                    {/* Período — muda o gráfico E os cards de faturamento acima */}
                    <PeriodPicker value={period} onChange={changePeriod} />
                  </div>

                  {/* Chart */}
                  <div className="sp-chart relative min-h-[280px] w-full flex-1">
                    {!loading && stats.total === 0 && (
                      <p className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-[13px] font-medium text-slate-400">
                        Nenhuma venda neste período
                      </p>
                    )}
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="spRevenueFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={T.primary} stopOpacity={0.22} />
                            <stop offset="100%" stopColor={T.primary} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(15, 23, 42, 0.05)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          stroke="#94A3B8"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          interval="preserveStartEnd"
                          minTickGap={14}
                        />
                        <YAxis
                          stroke="#94A3B8"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          width={54}
                          allowDecimals={false}
                          tickFormatter={axisMoney}
                        />
                        <Tooltip
                          cursor={{ stroke: "rgba(138,30,247,0.25)", strokeWidth: 1 }}
                          content={({ active, payload }: any) => {
                            const b: ChartBucket | undefined = active ? payload?.[0]?.payload : undefined;
                            if (!b) return null;
                            return (
                              <div
                                className="rounded-xl bg-white px-3.5 py-2.5"
                                style={{ border: `1px solid ${T.border}`, boxShadow: "0 12px 32px rgba(15, 23, 42, 0.10)" }}
                              >
                                <p className="text-[11.5px] font-semibold text-slate-500">
                                  {bucketTitle(chartBucket, b.key)}
                                </p>
                                <p className="mt-0.5 text-[15px] font-bold tabular-nums text-slate-900">
                                  {hideable(fmt(b.gross))}
                                </p>
                                <p className="mt-0.5 text-[11.5px] text-slate-500">
                                  {num(b.paid)} {b.paid === 1 ? "venda paga" : "vendas pagas"} · {num(b.total)}{" "}
                                  {b.total === 1 ? "gerada" : "geradas"}
                                </p>
                              </div>
                            );
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="gross"
                          stroke={T.primary}
                          strokeWidth={2.4}
                          fill="url(#spRevenueFill)"
                          dot={chartData.length <= 3 ? { r: 3 } : false}
                          activeDot={{ r: 4 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Coluna direita: próxima premiação */}
                <div className="flex flex-col gap-4">
                {/* Próxima premiação — card claro (cor da página), placa no meio */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.12 }}
                  className="flex flex-col items-center rounded-xl p-6 text-center"
                  style={{
                    background: T.card,
                    border: `1px solid ${T.border}`,
                    boxShadow: T.cardShadow,
                  }}
                >
                  <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col items-center">
                    <p className="text-[15px] font-semibold text-slate-900">
                      Sua próxima premiação, {prizeFirstName}
                    </p>

                    {/* Placa (poster emoldurado) — troféu + marco de faturamento */}
                    <div className="flex flex-1 items-center justify-center py-6">
                      <div
                        style={{
                          width: 236,
                          maxWidth: "82%",
                          borderRadius: 16,
                          padding: 10,
                          background: "linear-gradient(145deg,#3A3A42,#161619)",
                          boxShadow:
                            "0 18px 36px rgba(15,23,42,0.28), inset 0 1px 0 rgba(255,255,255,0.08)",
                        }}
                      >
                        <div
                          className="flex flex-col items-center rounded-[10px] px-4 py-6"
                          style={{
                            background: "#232329",
                            border: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <p
                            className="text-[11px] font-semibold tracking-wide"
                            style={{ color: "#9CA3AF" }}
                          >
                            ShadowPay
                          </p>
                          <span
                            className="my-3 flex h-16 w-16 items-center justify-center rounded-full"
                            style={{ background: "rgba(251,191,36,0.12)" }}
                          >
                            <Trophy className="h-8 w-8" style={{ color: "#FBBF24" }} />
                          </span>
                          <p className="text-[38px] font-extrabold leading-none text-white">
                            {fmtTarget(nextPrize.target)}
                          </p>
                          <p
                            className="mt-1.5 text-[12px] font-semibold"
                            style={{ color: "#D1D5DB" }}
                          >
                            {nextPrize.target >= 1_000_000
                              ? `${nextPrize.target / 1_000_000} ${
                                  nextPrize.target === 1_000_000 ? "milhão" : "milhões"
                                } em vendas`
                              : `${nextPrize.target / 1000} mil em vendas`}
                          </p>
                          <p
                            className="mt-2 text-[10px] uppercase tracking-wider"
                            style={{ color: "#8B8B93" }}
                          >
                            Prêmio: {nextPrize.prize}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p
                      className="text-[30px] font-semibold leading-none text-slate-900"
                      style={{
                        fontFamily:
                          "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
                      }}
                    >
                      {hideable(fmt(totalRevenue))}
                    </p>

                    <div
                      className="mt-4 h-2 w-full overflow-hidden rounded-full"
                      style={{ background: "#E5E7EB" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${prizeProgress}%`,
                          background: "linear-gradient(90deg, #B552F9 0%, #8A1EF7 100%)",
                          transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
                        }}
                      />
                    </div>
                    <p className="mt-2.5 text-[13px] text-slate-500">
                      {Math.floor(prizeProgress)}% do caminho até o próximo prêmio
                    </p>
                  </div>
                </motion.div>

                </div>
              </section>

              {/* ÚLTIMAS VENDAS — as mais recentes, de qualquer período */}
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="mb-6 rounded-2xl p-4 sm:p-5"
                style={{ background: T.card, border: `1px solid ${T.border}` }}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[15px] font-semibold text-slate-900">Últimas vendas</h2>
                    <p className="text-[13px] text-slate-500">As transações mais recentes da sua conta.</p>
                  </div>
                  <Link href="/v1/products/sales" className="sp-brand-text text-[13px] font-semibold">
                    Ver todas →
                  </Link>
                </div>
                {recent.length === 0 ? (
                  <p className="py-8 text-center text-[13px] text-slate-400">
                    {loading ? "Carregando…" : "Nenhuma venda ainda."}
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {recent.map((t) => {
                      const s = txStatus(t);
                      const name = t.customer?.name || t.customerName || "Cliente";
                      return (
                        <li key={t.id} className="flex items-center gap-3 py-3">
                          <IconChip>
                            <CircleDollarSign />
                          </IconChip>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-medium text-slate-900">{name}</p>
                            <p className="truncate text-[12.5px] text-slate-500">
                              {t.product?.name || t.productName || "Produto"} · {timeAgo(t.createdAt)}
                            </p>
                          </div>
                          <span className="hidden sm:inline">
                            <StatusBadge tone={TX_TONE[s]}>{TX_STATUS_STYLE[s].label}</StatusBadge>
                          </span>
                          <span className="w-[96px] shrink-0 text-right text-[14px] font-semibold tabular-nums text-slate-900">
                            {hideable(fmt(Number(t.grossAmount) || 0))}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </motion.section>

            </div>
      </LightShell>

      <ShadowPanel />
    </>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
