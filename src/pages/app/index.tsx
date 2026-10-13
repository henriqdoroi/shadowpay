"use client";

/**
 * /app — App mobile PWA da ShadowPay (home). Rebuild do protótipo Expo
 * como PWA instalável. Hero de saldo ESCURO premium (com o cartão do
 * ninja) + corpo claro. Dados reais via /api/user/*.
 *
 * Etapa 1: home + barra inferior + instalável. Próximas etapas portam
 * Transações / Saldo / Relatórios / Perfil pro mesmo estilo de app.
 */
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import axios from "axios";
import {
  Bell,
  Eye,
  EyeOff,
  ChevronRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  QrCode,
  TrendingUp,
  Ticket,
  CheckCircle2,
  Percent,
  Home as HomeIcon,
  CreditCard,
  BarChart3,
  User,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

const API = "https://shadowpay-backend.onrender.com";
const PURPLE = "#7117E8";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(v) || 0);

const isPaid = (t: any) =>
  ["PAID", "APPROVED", "paid", "approved"].includes(String(t?.status));
const isPending = (t: any) =>
  ["PENDING", "pending", "WAITING", "waiting"].includes(String(t?.status));
const isFailed = (t: any) =>
  ["FAILED", "REFUSED", "CANCELED", "CANCELLED", "EXPIRED", "failed"].includes(
    String(t?.status),
  );

function AppHome() {
  const router = useRouter();
  const { token } = useAuth();
  const [balance, setBalance] = useState(0);
  const [rows, setRows] = useState<any[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!token) return;
    const h = { headers: { Authorization: `Bearer ${token}` } };
    axios
      .get(`${API}/api/user/dashboard-stats`, h)
      .then((r) => {
        if (r.data?.success)
          setBalance(Number(r.data.data?.currentBalance) || 0);
      })
      .catch(() => {});
    axios
      .get(`${API}/api/user/transactions-report?page=1&limit=1000`, h)
      .then((r) => {
        const data =
          r.data?.data?.transactions || r.data?.data?.rows || r.data?.data || [];
        setRows(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, [token]);

  const m = useMemo(() => {
    const paid = rows.filter(isPaid);
    const aprovadas = paid.reduce((a, t) => a + Number(t.grossAmount || 0), 0);
    const pendentes = rows
      .filter(isPending)
      .reduce((a, t) => a + Number(t.grossAmount || 0), 0);
    const recusadas = rows
      .filter(isFailed)
      .reduce((a, t) => a + Number(t.grossAmount || 0), 0);
    const ticket = paid.length ? aprovadas / paid.length : 0;
    const conv = rows.length ? (paid.length / rows.length) * 100 : 0;

    // série por hora (dados reais; fica em 0 quando não há vendas)
    const buckets = new Array(24).fill(0);
    paid.forEach((t) => {
      const d = new Date(t.paidAt || t.createdAt || Date.now());
      const h = d.getHours();
      if (h >= 0 && h < 24) buckets[h] += Number(t.grossAmount || 0);
    });
    return {
      paidCount: paid.length,
      total: rows.length,
      aprovadas,
      pendentes,
      recusadas,
      ticket,
      conv,
      buckets,
    };
  }, [rows]);

  const hide = (s: string) => (visible ? s : "••••••");

  // path do mini-gráfico (área + linha)
  const chart = useMemo(() => {
    const W = 300;
    const H = 90;
    const max = Math.max(...m.buckets, 1);
    const pts = m.buckets.map((v, i) => {
      const x = (i / 23) * W;
      const y = H - (v / max) * (H - 8) - 4;
      return [x, y] as [number, number];
    });
    const line = pts
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
      .join(" ");
    const area = `${line} L${W},${H} L0,${H} Z`;
    return { W, H, line, area };
  }, [m.buckets]);

  const actions = [
    { key: "receber", label: "Receber", Icon: ArrowDownToLine, go: "/v1/finance" },
    { key: "pagar", label: "Pagar", Icon: ArrowUpFromLine, go: "/v1/finance" },
    {
      key: "transferir",
      label: "Transferir",
      Icon: ArrowLeftRight,
      go: "/v1/finance",
    },
    { key: "cobrar", label: "Cobrar", Icon: QrCode, go: "/v1/products/create" },
  ];

  const metrics = [
    {
      title: "Vendas aprovadas",
      sub: "No período",
      value: hide(fmt(m.aprovadas)),
      Icon: TrendingUp,
    },
    {
      title: "Ticket médio",
      sub: "Por venda",
      value: hide(fmt(m.ticket)),
      Icon: Ticket,
    },
    {
      title: "PIX pagos",
      sub: `de ${m.total} gerados`,
      value: visible ? String(m.paidCount) : "••",
      Icon: CheckCircle2,
    },
    {
      title: "Taxa de conversão",
      sub: "Pagos ÷ gerados",
      value: `${m.conv.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`,
      Icon: Percent,
    },
  ];

  const summary: [string, number, string][] = [
    ["Aprovadas", m.aprovadas, "#2DBA5C"],
    ["Pendentes", m.pendentes, "#FF9E2B"],
    ["Recusadas", m.recusadas, "#F0252E"],
  ];

  const nav = [
    { key: "inicio", label: "Início", Icon: HomeIcon, go: "/app", active: true },
    {
      key: "transacoes",
      label: "Transações",
      Icon: CreditCard,
      go: "/v1/products/sales",
    },
    { key: "saldo", central: true, go: "/v1/finance", Icon: HomeIcon, label: "" },
    { key: "relatorios", label: "Relatórios", Icon: BarChart3, go: "/v1/reports" },
    { key: "perfil", label: "Perfil", Icon: User, go: "/v1/configs/profile" },
  ];

  return (
    <div
      className="mx-auto min-h-screen w-full max-w-[480px] pb-28"
      style={{ background: "#F4F5F7", fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* HEADER */}
      <header className="flex items-center justify-between px-5 pb-3 pt-6">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[15px] font-black text-white"
            style={{ background: PURPLE }}
          >
            S
          </span>
          <span className="text-[16px] font-bold tracking-tight text-slate-900">
            Shadow<span style={{ color: PURPLE }}>Pay</span>
          </span>
        </div>
        <button
          onClick={() => router.push("/v1/configs/profile?tab=notificacoes")}
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white"
          style={{ border: "1px solid rgba(15,23,42,0.06)" }}
          aria-label="Notificações"
        >
          <Bell className="h-[18px] w-[18px] text-slate-700" />
          <span
            className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full"
            style={{ background: "#F0252E" }}
          />
        </button>
      </header>

      <div className="space-y-4 px-4">
        {/* HERO SALDO — escuro premium com o cartão do ninja */}
        <section
          className="relative overflow-hidden rounded-[26px] p-5"
          style={{
            background:
              "linear-gradient(150deg, #241248 0%, #140A2B 48%, #060109 100%)",
            boxShadow: "0 20px 44px -18px rgba(76,29,149,0.6)",
          }}
        >
          <div
            className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(124,58,237,0.40) 0%, transparent 62%)",
            }}
          />
          {/* cartão do ninja (decorativo, canto) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/app/card-black-clean.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute select-none"
            style={{
              right: -38,
              bottom: 28,
              width: 230,
              transform: "rotate(-8deg)",
              opacity: 0.95,
              maskImage:
                "radial-gradient(130% 130% at 70% 50%, #000 55%, transparent 92%)",
              WebkitMaskImage:
                "radial-gradient(130% 130% at 70% 50%, #000 55%, transparent 92%)",
            }}
          />

          <div className="relative">
            <button
              onClick={() => setVisible((v) => !v)}
              className="flex items-center gap-2"
            >
              <span
                className="text-[12px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: "#B6A6E6" }}
              >
                Saldo disponível
              </span>
              {visible ? (
                <Eye className="h-[15px] w-[15px]" style={{ color: "#8B7BBE" }} />
              ) : (
                <EyeOff
                  className="h-[15px] w-[15px]"
                  style={{ color: "#8B7BBE" }}
                />
              )}
            </button>

            <button
              onClick={() => router.push("/v1/finance")}
              className="mt-2 flex items-center gap-1.5"
            >
              <span
                className="text-[34px] font-bold leading-none tracking-tight text-white"
                style={{ letterSpacing: "-0.02em" }}
              >
                {hide(fmt(balance))}
              </span>
              <ChevronRight className="h-5 w-5" style={{ color: "#8B7BBE" }} />
            </button>

            <div className="mt-2.5 inline-flex items-center gap-2">
              <span
                className="rounded-md px-2 py-0.5 text-[11px] font-bold"
                style={{ background: "rgba(45,186,92,0.18)", color: "#4ADE80" }}
              >
                Pronto pra saque
              </span>
            </div>

            {/* ações rápidas */}
            <div className="mt-6 grid grid-cols-4 gap-2">
              {actions.map(({ key, label, Icon, go }) => (
                <button
                  key={key}
                  onClick={() => router.push(go)}
                  className="flex flex-col items-center gap-1.5 rounded-2xl py-3 transition-colors active:scale-95"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <Icon className="h-[22px] w-[22px]" style={{ color: "#C4B5FD" }} />
                  <span className="text-[11px] font-semibold text-white">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* VISÃO GERAL */}
        <section
          className="rounded-[22px] bg-white p-4"
          style={{ border: "1px solid rgba(15,23,42,0.05)" }}
        >
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-slate-900">Visão geral</h2>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-[11.5px] font-semibold text-slate-600"
              style={{ background: "#F1F5F9" }}
            >
              Hoje
            </span>
          </div>
          <div>
            {metrics.map((mt, i) => (
              <div
                key={mt.title}
                className="flex items-center gap-3 py-3"
                style={{
                  borderTop:
                    i === 0 ? "none" : "1px solid rgba(15,23,42,0.05)",
                }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "rgba(113,23,232,0.08)", color: PURPLE }}
                >
                  <mt.Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-slate-800">
                    {mt.title}
                  </p>
                  <p className="text-[11.5px] text-slate-400">{mt.sub}</p>
                </div>
                <p className="text-[15px] font-bold text-slate-900">
                  {mt.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* RESUMO DE VENDAS */}
        <section
          className="rounded-[22px] bg-white p-4"
          style={{ border: "1px solid rgba(15,23,42,0.05)" }}
        >
          <h2 className="mb-3 text-[15px] font-bold text-slate-900">
            Resumo de vendas
          </h2>
          <div
            className="mb-4 flex rounded-2xl"
            style={{ background: "#F8FAFC", border: "1px solid rgba(15,23,42,0.05)" }}
          >
            {summary.map(([label, value, color], i) => (
              <div
                key={label}
                className="flex-1 px-3 py-3"
                style={{
                  borderLeft: i === 0 ? "none" : "1px solid rgba(15,23,42,0.06)",
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: color }}
                  />
                  <span className="text-[11px] font-semibold text-slate-500">
                    {label}
                  </span>
                </div>
                <p className="mt-1 text-[13.5px] font-bold text-slate-900">
                  {hide(fmt(value))}
                </p>
              </div>
            ))}
          </div>

          <svg
            viewBox={`0 0 ${chart.W} ${chart.H}`}
            preserveAspectRatio="none"
            className="h-24 w-full"
          >
            <defs>
              <linearGradient id="appArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PURPLE} stopOpacity={0.22} />
                <stop offset="100%" stopColor={PURPLE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={chart.area} fill="url(#appArea)" />
            <path
              d={chart.line}
              fill="none"
              stroke={PURPLE}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="mt-1 flex justify-between text-[10px] text-slate-400">
            {["00h", "06h", "12h", "18h", "23h"].map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        </section>
      </div>

      {/* BOTTOM NAV */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[480px] items-end justify-around px-3 pb-5 pt-2"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(15,23,42,0.06)",
        }}
      >
        {nav.map((item) =>
          item.central ? (
            <button
              key={item.key}
              onClick={() => router.push(item.go)}
              className="flex -translate-y-3 flex-col items-center"
              aria-label="Saldo"
            >
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full text-[18px] font-black text-white"
                style={{
                  background: `linear-gradient(135deg, ${PURPLE}, #3B079D)`,
                  boxShadow: "0 10px 22px -6px rgba(113,23,232,0.7)",
                }}
              >
                S
              </span>
            </button>
          ) : (
            <button
              key={item.key}
              onClick={() => router.push(item.go)}
              className="flex flex-1 flex-col items-center gap-1 py-1"
            >
              <item.Icon
                className="h-[21px] w-[21px]"
                style={{ color: item.active ? PURPLE : "#94A3B8" }}
              />
              <span
                className="text-[10px] font-semibold"
                style={{ color: item.active ? PURPLE : "#94A3B8" }}
              >
                {item.label}
              </span>
            </button>
          ),
        )}
      </nav>
    </div>
  );
}

export default function AppPage() {
  return (
    <ProtectedRoute>
      <Head>
        <title>ShadowPay</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1"
        />
        <meta name="theme-color" content="#F4F5F7" />
      </Head>
      <AppHome />
    </ProtectedRoute>
  );
}
