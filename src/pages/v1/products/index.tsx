"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Package,
  Upload,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Edit,
  Trash2,
  ExternalLink,
  MoreHorizontal,
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
  category?: string;
  type?: string;
  imageUrl?: string;
}

function ProductsContent() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v || 0);

  /* ---------- fetch ---------- */
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
          // try to extract image from checkoutConfig if exists
          let img = "";
          try {
            const cfg =
              typeof p.checkoutConfig === "string"
                ? JSON.parse(p.checkoutConfig)
                : p.checkoutConfig;
            img =
              cfg?.productImage ||
              cfg?.productImageUrl ||
              p.productImage ||
              p.image ||
              "";
          } catch {}
          return {
            id: p.id,
            name: p.name,
            description: p.description,
            price: parseFloat(String(p.price || 0)),
            status: p.isActive ? "ativo" : "inativo",
            sales: byProduct[pid] || 0,
            createdAt: p.createdAt,
            checkoutUrl: p.linkSalesPage,
            category: p.category || "Finanças e Com",
            type: p.type || "Curso",
            imageUrl: img,
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

  /* ---------- handlers ---------- */
  const handleEdit = (id: string) => router.push(`/v1/products/edit/${id}`);
  const handleNew = () => router.push("/v1/products/create");
  const handleLink = (p: Product) => {
    const url = p.checkoutUrl || `/v1/checkout/${p.id}`;
    window.open(url, "_blank");
  };
  const handleDelete = (id: string, name: string) => {
    setActionMenuId(null);
    toast(
      () => (
        <div className="flex flex-col gap-2 p-2">
          <p className="font-medium">
            Excluir <strong>{name}</strong>?
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
                  if (!token) throw new Error("Sem token");
                  const res = await fetch(`${API}/api/products/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (!res.ok) throw new Error("Erro ao excluir");
                  setProducts((prev) => prev.filter((p) => p.id !== id));
                  toast.success("Excluído!");
                } catch (e: any) {
                  toast.error(e.message || "Erro");
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

  /* ---------- filter + paginate ---------- */
  const filtered = useMemo(() => {
    let list = products;
    if (search.trim())
      list = list.filter((p) =>
        p.name.toLowerCase().includes(search.trim().toLowerCase())
      );
    if (filterStatus !== "all")
      list = list.filter((p) => p.status === filterStatus);
    if (filterType !== "all")
      list = list.filter((p) => p.type?.toLowerCase() === filterType);
    return list;
  }, [products, search, filterStatus, filterType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  /* ---------- thumb gen ---------- */
  const palette = [
    { bg: "#1ED760", text: "#FFFFFF" }, // spotify green
    { bg: "#E14B5A", text: "#FFFFFF" }, // pmd red
    { bg: "#7C3AED", text: "#FFFFFF" }, // violet
    { bg: "#F87171", text: "#FFFFFF" }, // verifica red
    { bg: "#FF8FAB", text: "#FFFFFF" }, // pink
    { bg: "#2D7CF6", text: "#FFFFFF" }, // blue
    { bg: "#FFB627", text: "#000000" }, // orange
    { bg: "#000000", text: "#FFFFFF" }, // tiktok black
    { bg: "#0F1116", text: "#7C3AED" }, // acesso vit black
    { bg: "#FF6B00", text: "#FFFFFF" }, // bank orange
    { bg: "#8B1813", text: "#FFFFFF" }, // inter dark red
  ];

  const thumbFor = (p: Product, idx: number) => {
    if (p.imageUrl) {
      // eslint-disable-next-line @next/next/no-img-element
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.imageUrl}
          alt={p.name}
          className="h-14 w-14 rounded-2xl object-cover"
        />
      );
    }
    const c = palette[idx % palette.length]!;
    const initial = (p.name?.[0] || "P").toUpperCase();
    return (
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold"
        style={{
          background: c.bg,
          color: c.text,
          fontFamily: "'Clash Display', sans-serif",
        }}
      >
        {initial}
      </div>
    );
  };

  const statusPill = (status: string) => {
    if (status === "ativo") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          APROVADO
        </span>
      );
    }
    if (status === "rascunho") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-600">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          RASCUNHO
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
        INATIVO
      </span>
    );
  };

  const inputCls =
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100";
  const selectCls = inputCls + " cursor-pointer appearance-none pr-8";

  return (
    <>
      <Head>
        <title>ShadowPay — Produtos</title>
      </Head>
      <LightShell>
        {/* HEADER */}
        <section
          className="mb-5 rounded-2xl p-5 sm:p-6"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(15,23,42,0.06)",
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: "rgba(124,58,237,0.10)",
                  color: "#7C3AED",
                }}
              >
                <Package className="h-5 w-5" />
              </span>
              <div>
                <h1
                  className="text-[24px] font-bold leading-none tracking-tight text-slate-900"
                  style={{
                    fontFamily: "'Clash Display', sans-serif",
                    letterSpacing: "-0.005em",
                  }}
                >
                  Produtos
                </h1>
                <p className="mt-1 text-[13px] text-slate-500">
                  Gerencie seu catálogo de produtos
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => toast("Importação em breve")}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Upload className="h-4 w-4 text-slate-500" />
                Importar
              </button>
              <button
                onClick={() => toast("Exportação em breve")}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Download className="h-4 w-4 text-slate-500" />
                Exportar
              </button>
              <button
                onClick={handleNew}
                className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5"
                style={{
                  background: "#7C3AED",
                  boxShadow: "0 8px 20px -8px rgba(124,58,237,0.55)",
                }}
              >
                <Plus className="h-4 w-4" />
                Novo produto
              </button>
            </div>
          </div>
        </section>

        {/* FILTROS */}
        <section
          className="mb-5 rounded-2xl p-4"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(15,23,42,0.06)",
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className={inputCls + " pl-9"}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 lg:flex lg:items-end lg:gap-2">
              <div>
                <label className="mb-1 block text-[11px] text-slate-500">
                  Categoria
                </label>
                <div className="relative">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className={selectCls + " min-w-[140px]"}
                  >
                    <option value="all">Todas</option>
                    <option value="financas">Finanças</option>
                    <option value="educacional">Educacional</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-slate-500">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setPage(1);
                    }}
                    className={selectCls + " min-w-[120px]"}
                  >
                    <option value="all">Todos</option>
                    <option value="ativo">Aprovado</option>
                    <option value="inativo">Inativo</option>
                    <option value="rascunho">Rascunho</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-slate-500">
                  Tipo
                </label>
                <div className="relative">
                  <select
                    value={filterType}
                    onChange={(e) => {
                      setFilterType(e.target.value);
                      setPage(1);
                    }}
                    className={selectCls + " min-w-[120px]"}
                  >
                    <option value="all">Todos</option>
                    <option value="curso">Curso</option>
                    <option value="serviço">Serviço</option>
                    <option value="produto">Produto</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setSearch("");
                setFilterCategory("all");
                setFilterStatus("all");
                setFilterType("all");
                setPage(1);
              }}
              className="inline-flex h-10 items-center gap-2 self-end rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Filter className="h-4 w-4 text-slate-500" />
              Filtros
            </button>
          </div>
        </section>

        {/* GRID */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl p-5"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(15,23,42,0.06)",
                  minHeight: 140,
                }}
              />
            ))}
          </div>
        ) : paged.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(15,23,42,0.06)",
              boxShadow:
                "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
            }}
          >
            <Package className="mx-auto mb-3 h-8 w-8 text-violet-300" />
            <p className="text-sm font-medium text-slate-600">
              {products.length === 0
                ? "Nenhum produto cadastrado"
                : "Nenhum produto encontrado com esses filtros"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {products.length === 0
                ? "Crie seu primeiro produto para começar a vender."
                : "Ajuste os filtros ou crie um novo produto."}
            </p>
            <button
              onClick={handleNew}
              className="mx-auto mt-4 inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100"
            >
              <Plus className="h-3.5 w-3.5" />
              Criar produto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paged.map((p, i) => (
              <div
                key={p.id}
                className="group relative rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(15,23,42,0.06)",
                  boxShadow:
                    "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
                }}
              >
                <div className="flex items-start gap-3">
                  {thumbFor(p, i)}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {(p.type || "Curso").toUpperCase()}
                    </p>
                    <h3
                      className="mt-0.5 line-clamp-2 text-[14px] font-bold leading-snug text-slate-900"
                      style={{ fontFamily: "'Clash Display', sans-serif" }}
                      title={p.name}
                    >
                      {p.name}
                    </h3>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {statusPill(p.status)}
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        {(p.category || "Finanças e Com").toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Dropdown trigger */}
                  <button
                    onClick={() =>
                      setActionMenuId(actionMenuId === p.id ? null : p.id)
                    }
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Mais opções"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>

                  {/* Dropdown menu */}
                  {actionMenuId === p.id && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setActionMenuId(null)}
                      />
                      <div
                        className="absolute right-3 top-12 z-40 w-40 overflow-hidden rounded-xl bg-white p-1 shadow-xl"
                        style={{ border: "1px solid rgba(15,23,42,0.08)" }}
                      >
                        <button
                          onClick={() => {
                            setActionMenuId(null);
                            handleLink(p);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Abrir link
                        </button>
                        <button
                          onClick={() => {
                            setActionMenuId(null);
                            handleEdit(p.id);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Excluir
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {!loading && filtered.length > 0 && (
          <div
            className="mt-5 flex flex-col items-center justify-between gap-3 rounded-2xl p-3.5 sm:flex-row"
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(15,23,42,0.06)",
              boxShadow:
                "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
            }}
          >
            <p className="text-xs text-slate-500">
              Mostrando {(page - 1) * perPage + 1} a{" "}
              {Math.min(page * perPage, filtered.length)} de {filtered.length}{" "}
              produtos
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors"
                  style={{
                    background:
                      page === n ? "rgba(124,58,237,0.10)" : "transparent",
                    border:
                      page === n ? "none" : "1px solid #E2E8F0",
                    color: page === n ? "#7C3AED" : "#475569",
                  }}
                >
                  {n}
                </button>
              ))}
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="relative ml-2">
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className={selectCls + " min-w-[130px]"}
                >
                  <option value={10}>10 por página</option>
                  <option value={20}>20 por página</option>
                  <option value={50}>50 por página</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>
        )}
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
