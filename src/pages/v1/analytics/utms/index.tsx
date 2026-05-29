"use client";

/**
 * /v1/analytics/utms — Análise de UTMs (estilo dark da imagem).
 *
 * Tabela paginada agrupada por UTM (campaign, source, medium, content, term).
 * Filtros: busca, agrupar, produto e período (preset + personalizado).
 *
 * Backend: GET /api/tracking/analysis (agrega real do banco).
 */

import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import axios from "axios";
import {
  Search,
  ChevronDown,
  Calendar,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";
import { useAuth } from "@/contexts/AuthContext";

const API = "https://shadowpay-api-production.up.railway.app";

const T = {
  text: "#0F172A",
  text2: "#475569",
  textMuted: "#94A3B8",
  primary: "#7C3AED",
  primaryBg: "rgba(124,58,237,0.08)",
  border: "rgba(15,23,42,0.08)",
  borderSoft: "rgba(15,23,42,0.06)",
  card: "#FFFFFF",
  green: "#10B981",
};

type GroupBy =
  | "utm_campaign"
  | "utm_source"
  | "utm_medium"
  | "utm_content"
  | "utm_term";

const GROUP_LABEL: Record<GroupBy, string> = {
  utm_campaign: "utm_campaign",
  utm_source: "utm_source",
  utm_medium: "utm_medium",
  utm_content: "utm_content",
  utm_term: "utm_term",
};

type Row = {
  key: string;
  label: string;
  vendas: number;
  faturamento: number;
};

type Product = { id: string; name: string };

function UtmsContent() {
  const { token } = useAuth();
  const [groupBy, setGroupBy] = useState<GroupBy>("utm_campaign");
  const [search, setSearch] = useState("");
  const [productId, setProductId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [period, setPeriod] = useState<{ from: string; to: string }>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);
    return {
      from: start.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
    };
  });
  const [rows, setRows] = useState<Row[]>([]);
  const [emptyRow, setEmptyRow] = useState<Row | null>(null);
  const [totals, setTotals] = useState({ vendas: 0, faturamento: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const pageSize = 20;

  // dropdowns toggle
  const [openGroup, setOpenGroup] = useState(false);
  const [openProduct, setOpenProduct] = useState(false);

  // fetch produtos pra select
  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API}/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => {
        if (r.data?.success) {
          const list = r.data.data || r.data.products || [];
          setProducts(
            list.map((p: any) => ({
              id: p.id,
              name: p.name || p.title || `Produto ${p.id.slice(0, 6)}`,
            }))
          );
        }
      })
      .catch(() => setProducts([]));
  }, [token]);

  const fetchAnalysis = async (p = 1) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        groupBy,
        page: String(p),
        pageSize: String(pageSize),
      });
      if (search.trim()) params.append("search", search.trim());
      if (productId) params.append("productId", productId);
      if (period.from) params.append("startDate", `${period.from}T00:00:00`);
      if (period.to) params.append("endDate", `${period.to}T23:59:59`);

      const r = await axios.get(
        `${API}/api/tracking/analysis?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        const d = r.data.data;
        setRows(d.rows || []);
        setEmptyRow(d.emptyRow || null);
        setTotals(
          d.totals || {
            vendas: 0,
            faturamento: 0,
          }
        );
        setPage(d.pagination?.page || 1);
        setTotalPages(d.pagination?.totalPages || 1);
        setTotalCount(d.pagination?.totalCount || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAnalysis(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, groupBy, productId, period.from, period.to]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v || 0);
  const num = (v: number) => new Intl.NumberFormat("pt-BR").format(v || 0);

  const productLabel = useMemo(() => {
    if (!productId) return "Qualquer";
    return products.find((p) => p.id === productId)?.name || "—";
  }, [productId, products]);

  const periodLabel = useMemo(() => {
    if (!period.from && !period.to) return "Tudo";
    const fmtD = (s: string) =>
      new Date(s + "T00:00:00").toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    return `${fmtD(period.from)} → ${fmtD(period.to)}`;
  }, [period]);

  return (
    <>
      <Head>
        <title>ShadowPay — Análise de UTMs</title>
      </Head>

      <LightShell>
        {/* HEADER */}
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1
            className="text-[28px] font-bold tracking-tight text-slate-900"
            style={{ letterSpacing: "-0.005em" }}
          >
            Análise de UTMs
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            {/* Buscar */}
            <div
              className="relative flex h-10 items-center rounded-xl px-3"
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                minWidth: 260,
              }}
            >
              <Search
                className="mr-2 h-4 w-4"
                style={{ color: T.textMuted }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchAnalysis(1);
                }}
                placeholder={`Buscar ${GROUP_LABEL[groupBy]}...`}
                className="flex-1 bg-transparent text-[13px] outline-none"
              />
            </div>

            {/* Agrupar */}
            <FilterDropdown
              open={openGroup}
              setOpen={setOpenGroup}
              labelKey="AGRUPAR"
              value={GROUP_LABEL[groupBy]}
            >
              <div className="space-y-0.5">
                {(Object.keys(GROUP_LABEL) as GroupBy[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      setGroupBy(g);
                      setOpenGroup(false);
                    }}
                    className="block w-full rounded-md px-3 py-1.5 text-left text-[12.5px] font-semibold transition-colors hover:bg-slate-50"
                    style={{
                      color: groupBy === g ? T.primary : T.text2,
                      background: groupBy === g ? T.primaryBg : "transparent",
                    }}
                  >
                    {GROUP_LABEL[g]}
                  </button>
                ))}
              </div>
            </FilterDropdown>

            {/* Produto */}
            <FilterDropdown
              open={openProduct}
              setOpen={setOpenProduct}
              labelKey="PRODUTO"
              value={
                productLabel.length > 18
                  ? productLabel.slice(0, 18) + "…"
                  : productLabel
              }
            >
              <div className="max-h-72 overflow-y-auto">
                <button
                  onClick={() => {
                    setProductId("");
                    setOpenProduct(false);
                  }}
                  className="block w-full rounded-md px-3 py-1.5 text-left text-[12.5px] font-semibold transition-colors hover:bg-slate-50"
                  style={{
                    color: !productId ? T.primary : T.text2,
                    background: !productId ? T.primaryBg : "transparent",
                  }}
                >
                  Qualquer
                </button>
                {products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setProductId(p.id);
                      setOpenProduct(false);
                    }}
                    className="block w-full truncate rounded-md px-3 py-1.5 text-left text-[12.5px] font-semibold transition-colors hover:bg-slate-50"
                    style={{
                      color: productId === p.id ? T.primary : T.text2,
                      background:
                        productId === p.id ? T.primaryBg : "transparent",
                    }}
                  >
                    {p.name}
                  </button>
                ))}
                {products.length === 0 && (
                  <p className="px-3 py-2 text-[11.5px] text-slate-400">
                    Sem produtos
                  </p>
                )}
              </div>
            </FilterDropdown>

            {/* Período */}
            <div
              className="flex h-10 items-center gap-2 rounded-xl px-3"
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
              }}
            >
              <span
                className="text-[10.5px] font-bold uppercase tracking-[0.16em]"
                style={{ color: T.primary }}
              >
                PERÍODO
              </span>
              <input
                type="date"
                value={period.from}
                onChange={(e) =>
                  setPeriod((p) => ({ ...p, from: e.target.value }))
                }
                className="bg-transparent text-[12.5px] outline-none"
                style={{ color: T.text }}
              />
              <span style={{ color: T.textMuted }}>→</span>
              <input
                type="date"
                value={period.to}
                onChange={(e) =>
                  setPeriod((p) => ({ ...p, to: e.target.value }))
                }
                className="bg-transparent text-[12.5px] outline-none"
                style={{ color: T.text }}
              />
            </div>

            <button
              onClick={() => fetchAnalysis(1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
              style={{ borderColor: T.border }}
              aria-label="Atualizar"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        {/* TABELA */}
        <section
          className="overflow-hidden rounded-2xl"
          style={{
            background: T.card,
            border: `1px solid ${T.borderSoft}`,
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr
                  className="text-left text-[10.5px] font-bold uppercase tracking-wider"
                  style={{ color: T.textMuted, background: "#F8FAFC" }}
                >
                  <th className="px-5 py-3">{GROUP_LABEL[groupBy]}</th>
                  <th className="px-5 py-3 text-right">Vendas</th>
                  <th className="px-5 py-3 text-right">Faturamento</th>
                </tr>
              </thead>
              <tbody>
                {loading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-16 text-center text-slate-500">
                      Carregando…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-16 text-center">
                      <TrendingUp
                        className="mx-auto mb-2 h-7 w-7"
                        style={{ color: T.textMuted }}
                      />
                      <p className="text-[13px] font-semibold text-slate-700">
                        Nenhuma campanha com vendas no período
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-slate-500">
                        Adicione UTMs aos seus links de checkout para começar
                        a rastrear.
                      </p>
                    </td>
                  </tr>
                ) : (
                  <>
                    {rows.map((r) => (
                      <tr
                        key={r.key}
                        className="transition-colors hover:bg-slate-50"
                        style={{ borderTop: `1px solid ${T.borderSoft}` }}
                      >
                        <td className="px-5 py-3 font-semibold text-slate-800">
                          {r.label}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-slate-700">
                          {num(r.vendas)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-semibold" style={{ color: T.green }}>
                          {fmt(r.faturamento)}
                        </td>
                      </tr>
                    ))}
                    {emptyRow && (
                      <tr
                        style={{
                          borderTop: `1px solid ${T.borderSoft}`,
                          background: "#F8FAFC",
                        }}
                      >
                        <td className="px-5 py-3 italic text-slate-500">
                          {emptyRow.label}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-slate-500">
                          {num(emptyRow.vendas)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-semibold text-slate-700">
                          {fmt(emptyRow.faturamento)}
                        </td>
                      </tr>
                    )}
                    {/* Linha Total */}
                    <tr
                      style={{
                        borderTop: `2px solid ${T.border}`,
                        background: "#F8FAFC",
                      }}
                    >
                      <td className="px-5 py-3 font-bold text-slate-900">
                        Total
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">
                        {num(totals.vendas)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold" style={{ color: T.green }}>
                        {fmt(totals.faturamento)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINACAO */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderTop: `1px solid ${T.borderSoft}` }}
            >
              <p className="text-[11.5px] text-slate-500">
                Mostrando {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, totalCount)} de{" "}
                {num(totalCount)} itens
              </p>
              <div className="flex items-center gap-1.5">
                <PageBtn disabled={page <= 1} onClick={() => fetchAnalysis(1)}>
                  Primeira
                </PageBtn>
                <PageBtn
                  disabled={page <= 1}
                  onClick={() => fetchAnalysis(page - 1)}
                >
                  Anterior
                </PageBtn>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(
                    1,
                    Math.min(totalPages - 4, page - 2)
                  ) + i;
                  if (p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => fetchAnalysis(p)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[12px] font-semibold"
                      style={{
                        background: p === page ? T.primary : T.card,
                        color: p === page ? "#FFFFFF" : T.text2,
                        border: `1px solid ${p === page ? T.primary : T.border}`,
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
                <PageBtn
                  disabled={page >= totalPages}
                  onClick={() => fetchAnalysis(page + 1)}
                >
                  Próxima
                </PageBtn>
                <PageBtn
                  disabled={page >= totalPages}
                  onClick={() => fetchAnalysis(totalPages)}
                >
                  Última
                </PageBtn>
              </div>
            </div>
          )}
        </section>
      </LightShell>

      <ShadowPanel />
    </>
  );
}

function FilterDropdown({
  open,
  setOpen,
  labelKey,
  value,
  children,
}: {
  open: boolean;
  setOpen: (b: boolean) => void;
  labelKey: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 items-center gap-2 rounded-xl px-3 text-[13px]"
        style={{
          background: T.card,
          border: `1px solid ${T.border}`,
        }}
      >
        <span
          className="text-[10.5px] font-bold uppercase tracking-[0.16em]"
          style={{ color: T.primary }}
        >
          {labelKey}
        </span>
        <span className="font-semibold" style={{ color: T.text }}>
          {value}
        </span>
        <ChevronDown
          className="h-3.5 w-3.5"
          style={{ color: T.textMuted }}
        />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 top-12 z-40 min-w-[200px] rounded-xl bg-white p-1.5 shadow-xl"
            style={{ border: `1px solid ${T.border}` }}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}

function PageBtn({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 items-center rounded-lg px-2.5 text-[11.5px] font-semibold transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        background: T.card,
        color: T.text2,
        border: `1px solid ${T.border}`,
      }}
    >
      {children}
    </button>
  );
}

export default function UtmsPage() {
  return (
    <ProtectedRoute>
      <UtmsContent />
    </ProtectedRoute>
  );
}
