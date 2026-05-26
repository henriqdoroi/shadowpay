"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { toast } from "sonner";
import {
  Plus,
  ExternalLink,
  Edit,
  Trash2,
  Package,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  CheckCircle2,
  TrendingUp,
  Boxes,
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";

const API = "https://shadowpay-api-production.up.railway.app";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  status: "ativo" | "inativo" | "rascunho";
  sales: number;
  createdAt: string;
  checkoutUrl: string;
}

function ProductsContent() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateString));

  const statusPill = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      ativo: {
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        label: "Ativo",
      },
      inativo: {
        color: "bg-slate-50 text-slate-500 border-slate-200",
        label: "Inativo",
      },
      rascunho: {
        color: "bg-amber-50 text-amber-700 border-amber-200",
        label: "Rascunho",
      },
    };
    const cfg = map[status] ?? map.inativo;
    return (
      <span
        className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
          cfg!.color
        }`}
      >
        {cfg!.label}
      </span>
    );
  };

  const handleEdit = (id: string) => router.push(`/v1/products/edit/${id}`);
  const handleNew = () => router.push("/v1/products/create");
  const handleLink = (p: Product) => {
    const url = p.checkoutUrl || `/v1/checkout/${p.id}`;
    window.open(url, "_blank");
  };

  const handleDelete = (id: string, name: string) => {
    toast(
      () => (
        <div className="flex flex-col gap-2 p-2">
          <p className="font-medium">
            Tem certeza que deseja excluir <strong>{name}</strong>?
          </p>
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss()}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                toast.dismiss();
                try {
                  const token = localStorage.getItem("token");
                  if (!token) throw new Error("Token não encontrado");
                  const res = await fetch(`${API}/api/products/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (!res.ok) {
                    const e = await res.json().catch(() => null);
                    throw new Error(e?.message || "Erro ao excluir");
                  }
                  setProducts((prev) => prev.filter((p) => p.id !== id));
                  toast.success("Produto excluído!");
                } catch (e) {
                  if (e instanceof Error) toast.error(e.message);
                  else toast.error("Erro desconhecido");
                }
              }}
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
            >
              Excluir
            </button>
          </div>
        </div>
      ),
      { duration: 10000 }
    );
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const prodRes = await fetch(`${API}/api/products`, { headers });
        if (!prodRes.ok) throw new Error(`Erro ${prodRes.status}`);
        const prodJson = await prodRes.json();
        const productsData: any[] =
          prodJson?.data?.products || prodJson?.products || [];

        const parseSales = (j: any) => {
          if (!j) return [];
          if (Array.isArray(j)) return j;
          return j?.data?.sales || j?.sales || j?.data || [];
        };

        let sales: any[] = [];
        try {
          const r = await fetch(
            `${API}/api/sales?status=approved&limit=1000`,
            { headers }
          );
          if (r.ok) sales = parseSales(await r.json());
        } catch {}
        if (!Array.isArray(sales) || sales.length === 0) {
          try {
            const r2 = await fetch(`${API}/api/sales?limit=1000`, { headers });
            if (r2.ok) sales = parseSales(await r2.json());
          } catch {}
        }
        sales = sales.filter(
          (s: any) => String(s?.status).trim().toLowerCase() === "approved"
        );

        const norm = (v: any) =>
          typeof v === "string" ? v.trim().toLowerCase() : "";
        const getPid = (s: any) =>
          norm(s?.product_id || s?.productId || s?.productID || s?.product?.id);
        const getSid = (s: any) =>
          String(
            s?.id ||
              s?._id ||
              s?.sale_id ||
              s?.externalTransactionId ||
              s?.external_transaction_id ||
              ""
          ).trim();

        const seen = new Set<string>();
        const unique: any[] = [];
        for (const s of sales) {
          let sid = getSid(s);
          if (!sid)
            sid = `${getPid(s)}::${(s?.email || s?.name || "")
              .toString()
              .toLowerCase()}::${norm(s?.created_at || s?.createdAt)}`;
          if (seen.has(sid)) continue;
          seen.add(sid);
          unique.push(s);
        }

        const byProduct: Record<string, number> = {};
        for (const s of unique) {
          const pid = getPid(s);
          if (!pid) continue;
          byProduct[pid] = (byProduct[pid] || 0) + 1;
        }

        const mapped: Product[] = productsData.map((p: any) => {
          const pid = norm(p.id || p._id || p.productId);
          return {
            id: p.id,
            name: p.name,
            description: p.description,
            price: parseFloat(String(p.price || 0)),
            status: p.isActive ? "ativo" : "inativo",
            sales: byProduct[pid] || 0,
            createdAt: p.createdAt,
            checkoutUrl: p.linkSalesPage,
          };
        });

        setProducts(mapped);
      } catch (err) {
        console.error("Erro:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.status === "ativo").length;
    const totalSales = products.reduce((acc, p) => acc + (p.sales || 0), 0);
    const revenue = products.reduce(
      (acc, p) => acc + (p.price || 0) * (p.sales || 0),
      0
    );
    return { total, active, totalSales, revenue };
  }, [products]);

  const kpis = [
    {
      label: "Total de produtos",
      value: String(stats.total),
      icon: <Boxes className="h-4 w-4" />,
      color: "#7C3AED",
    },
    {
      label: "Produtos ativos",
      value: String(stats.active),
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: "#22C55E",
    },
    {
      label: "Vendas aprovadas",
      value: String(stats.totalSales),
      icon: <ShoppingBag className="h-4 w-4" />,
      color: "#3B82F6",
    },
    {
      label: "Receita estimada",
      value: formatCurrency(stats.revenue),
      icon: <TrendingUp className="h-4 w-4" />,
      color: "#22D3EE",
    },
  ];

  return (
    <>
      <Head>
        <title>ShadowPay — Produtos</title>
      </Head>
      <LightShell>
        {/* Page header */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
              Vendas
            </p>
            <h1
              className="text-[28px] font-bold tracking-tight text-slate-900"
              style={{
                fontFamily: "'Clash Display', sans-serif",
                letterSpacing: "-0.005em",
              }}
            >
              Produtos
            </h1>
            <p className="mt-1 text-[14px] text-slate-500">
              Gerencie seus produtos, links de checkout e acompanhe vendas.
            </p>
          </div>
          <button
            onClick={handleNew}
            className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5"
            style={{
              background: "#7C3AED",
              boxShadow: "0 8px 20px -8px rgba(124, 58, 237, 0.55)",
            }}
          >
            <Plus className="h-4 w-4" /> Novo produto
          </button>
        </header>

        {/* KPIs */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="rounded-2xl p-5"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(15,23,42,0.06)",
                boxShadow:
                  "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500">
                  {k.label}
                </p>
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{
                    background: `${k.color}14`,
                    color: k.color,
                  }}
                >
                  {k.icon}
                </span>
              </div>
              <div
                className="mt-2 text-[24px] font-bold leading-none tracking-tight text-slate-900"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                {k.value}
              </div>
            </div>
          ))}
        </section>

        {/* Tabela */}
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(15,23,42,0.06)",
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid rgba(15,23,42,0.06)" }}
          >
            <h2
              className="flex items-center gap-2 text-[14px] font-semibold text-slate-900"
              style={{ fontFamily: "'Clash Display', sans-serif" }}
            >
              <Package className="h-4 w-4 text-violet-500" />
              Lista de produtos
            </h2>
            <span className="text-xs text-slate-400">
              {products.length} {products.length === 1 ? "item" : "itens"}
            </span>
          </div>

          <div className="overflow-x-auto p-2 sm:p-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                  <th className="px-3 py-2.5 font-semibold">Produto</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold">Preço</th>
                  <th className="px-3 py-2.5 font-semibold">Vendas</th>
                  <th className="px-3 py-2.5 font-semibold">Criado em</th>
                  <th className="px-3 py-2.5 text-right font-semibold">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr
                      key={i}
                      style={{ borderTop: "1px solid rgba(15,23,42,0.04)" }}
                    >
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-3 py-3">
                          <div
                            className="h-4 w-full max-w-[120px] animate-pulse rounded"
                            style={{ background: "#F1F2F6" }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <Package className="mx-auto mb-3 h-7 w-7 text-violet-300" />
                      <p className="text-sm font-medium text-slate-600">
                        Nenhum produto cadastrado
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Crie seu primeiro produto para começar a vender.
                      </p>
                      <button
                        onClick={handleNew}
                        className="mx-auto mt-4 inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Criar produto
                      </button>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr
                      key={product.id}
                      className="transition-colors hover:bg-slate-50/50"
                      style={{ borderTop: "1px solid rgba(15,23,42,0.04)" }}
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                            style={{
                              background: "rgba(124,58,237,0.08)",
                              color: "#7C3AED",
                            }}
                          >
                            <Package className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {product.name}
                            </p>
                            <p className="line-clamp-1 max-w-[260px] text-xs text-slate-400">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {statusPill(product.status)}
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-bold text-slate-900">
                          {product.sales}
                        </span>
                        <span className="ml-1 text-xs text-slate-400">
                          vendas
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {product.createdAt
                          ? formatDate(product.createdAt)
                          : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleLink(product)}
                            title="Abrir checkout"
                            className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Link</span>
                          </button>
                          <button
                            onClick={() => handleEdit(product.id)}
                            title="Editar"
                            className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Editar</span>
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(product.id, product.name)
                            }
                            title="Excluir"
                            className="flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-xs text-rose-700 hover:bg-rose-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Excluir</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && products.length > 0 && (
            <div
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              style={{ borderTop: "1px solid rgba(15,23,42,0.04)" }}
            >
              <div className="text-center text-xs text-slate-400 sm:text-left">
                Mostrando 1-{products.length} de {products.length} produtos
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <button
                  disabled
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold"
                  style={{
                    background: "rgba(124,58,237,0.10)",
                    color: "#7C3AED",
                  }}
                >
                  1
                </button>
                <button
                  disabled
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </LightShell>
      <ShadowPanel />
    </>
  );
}

export default function Products() {
  return (
    <ProtectedRoute>
      <ProductsContent />
    </ProtectedRoute>
  );
}
