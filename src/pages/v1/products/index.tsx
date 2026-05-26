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

import { ShadowShell } from "@/components/shadow/ShadowShell";
import { ShadowPageHeader } from "@/components/shadow/ShadowPageHeader";
import { ShadowCard } from "@/components/shadow/ShadowCard";
import { ShadowButton } from "@/components/shadow/ShadowButton";
import { ShadowMetricCard } from "@/components/shadow/ShadowMetricCard";
import { useCountUp } from "@/components/shadow/useCountUp";
import ShadowPanel from "@/components/ShadowPanel";

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

const API = "https://shadowpay-api-production.up.railway.app";

export default function Products() {
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
        color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        label: "Ativo",
      },
      inativo: {
        color: "bg-white/10 text-white/55 border-white/15",
        label: "Inativo",
      },
      rascunho: {
        color: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        label: "Rascunho",
      },
    };
    const cfg = map[status] ?? {
      color: "bg-white/10 text-white/55 border-white/15",
      label: status,
    };
    return (
      <span
        className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${cfg.color}`}
      >
        {cfg.label}
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
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.07]"
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
              className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
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

  const revAnim = useCountUp(stats.revenue);

  return (
    <>
      <Head>
        <title>ShadowPay — Produtos</title>
      </Head>

      <ShadowShell>
        <ShadowPageHeader
          eyebrow="Vendas"
          title="Produtos"
          subtitle="Gerencie seus produtos, links de checkout e acompanhe vendas."
          actions={
            <ShadowButton onClick={handleNew} variant="primary">
              <Plus className="h-4 w-4" /> Novo produto
            </ShadowButton>
          }
        />

        {/* KPIs */}
        <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ShadowMetricCard
            label="Total de produtos"
            value={String(stats.total)}
            icon={<Boxes className="h-4 w-4" />}
            accent="#7C3AED"
            delay={0}
          />
          <ShadowMetricCard
            label="Produtos ativos"
            value={String(stats.active)}
            icon={<CheckCircle2 className="h-4 w-4" />}
            accent="#22C55E"
            delay={0.05}
          />
          <ShadowMetricCard
            label="Vendas aprovadas"
            value={String(stats.totalSales)}
            icon={<ShoppingBag className="h-4 w-4" />}
            accent="#6366F1"
            delay={0.1}
          />
          <ShadowMetricCard
            label="Receita estimada"
            value={formatCurrency(revAnim)}
            icon={<TrendingUp className="h-4 w-4" />}
            accent="#22D3EE"
            delay={0.15}
          />
        </section>

        {/* Tabela */}
        <ShadowCard padded="none">
          <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
            <h2
              className="flex items-center gap-2 text-sm font-semibold text-white"
              style={{ fontFamily: "'Clash Display', sans-serif" }}
            >
              <Package className="h-4 w-4 text-violet-300" />
              Lista de produtos
            </h2>
            <span className="text-xs text-white/40">
              {products.length} {products.length === 1 ? "item" : "itens"}
            </span>
          </div>

          <div className="overflow-x-auto p-2 sm:p-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.16em] text-white/40">
                  <th className="px-3 py-2.5 font-medium">Produto</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Preço</th>
                  <th className="px-3 py-2.5 font-medium">Vendas</th>
                  <th className="px-3 py-2.5 font-medium">Criado em</th>
                  <th className="px-3 py-2.5 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr
                      key={i}
                      className="border-t border-white/[0.04]"
                    >
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-3 py-3">
                          <div className="shadow-shimmer h-4 w-full max-w-[120px] rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <Package className="mx-auto mb-3 h-7 w-7 text-violet-400/40" />
                      <p className="text-sm font-medium text-white/65">
                        Nenhum produto cadastrado
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        Crie seu primeiro produto para começar a vender.
                      </p>
                      <button
                        onClick={handleNew}
                        className="mx-auto mt-4 inline-flex items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-200 transition-colors hover:bg-violet-500/20"
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
                      className="border-t border-white/[0.04] transition-colors hover:bg-white/[0.025]"
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/20">
                            <Package className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white/90">
                              {product.name}
                            </p>
                            <p className="line-clamp-1 max-w-[260px] text-xs text-white/40">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {statusPill(product.status)}
                      </td>
                      <td className="px-3 py-3 font-medium text-white/90">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-bold text-white">
                          {product.sales}
                        </span>
                        <span className="ml-1 text-xs text-white/40">
                          vendas
                        </span>
                      </td>
                      <td className="px-3 py-3 text-white/50">
                        {product.createdAt
                          ? formatDate(product.createdAt)
                          : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleLink(product)}
                            title="Abrir checkout"
                            className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.02] px-2.5 text-xs text-white/70 hover:bg-white/[0.06] hover:text-white"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Link</span>
                          </button>
                          <button
                            onClick={() => handleEdit(product.id)}
                            title="Editar"
                            className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.02] px-2.5 text-xs text-white/70 hover:bg-white/[0.06] hover:text-white"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Editar</span>
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(product.id, product.name)
                            }
                            title="Excluir"
                            className="flex h-8 items-center gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-2.5 text-xs text-rose-300 hover:bg-rose-500/20"
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
            <div className="flex flex-col gap-3 border-t border-white/[0.04] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-center text-xs text-white/40 sm:text-left">
                Mostrando 1-{products.length} de {products.length} produtos
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <button
                  disabled
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.02] text-white/55 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-sm font-semibold text-violet-200 ring-1 ring-violet-500/30">
                  1
                </button>
                <button
                  disabled
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.02] text-white/55 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </ShadowCard>
      </ShadowShell>

      <ShadowPanel />
    </>
  );
}
