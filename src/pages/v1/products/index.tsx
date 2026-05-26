import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
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

/* Count-up suave (Shadow Design Language) */
function useCountUp(target: number, duration = 1100) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

const SHADOW_BG =
  "radial-gradient(1100px 700px at 85% -10%, #0B1020 0%, #060A14 55%, #03060F 100%)";

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

  const getStatusBadge = (status: string) => {
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

  const handleEdit = (productId: string) =>
    router.push(`/v1/products/edit/${productId}`);
  const handleNewProduct = () => router.push("/v1/products/create");

  const handleAccessLink = (product: Product) => {
    const url = product.checkoutUrl || `/v1/checkout/${product.id}`;
    window.open(url, "_blank");
  };

  const handleDelete = (productId: string, productName: string) => {
    toast(
      () => (
        <div className="flex flex-col gap-2 p-2">
          <p className="font-medium">
            Tem certeza que deseja excluir <strong>{productName}</strong>?
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <Button
              size="sm"
              className="cursor-pointer"
              variant="outline"
              onClick={() => toast.dismiss()}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="cursor-pointer"
              variant="destructive"
              onClick={async () => {
                toast.dismiss();
                try {
                  const token = localStorage.getItem("token");
                  if (!token) throw new Error("Token não encontrado");

                  const res = await fetch(
                    `https://shadowpay-api-production.up.railway.app/api/products/${productId}`,
                    {
                      method: "DELETE",
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    }
                  );

                  if (!res.ok) {
                    const errData = await res.json().catch(() => null);
                    throw new Error(
                      errData?.message || "Erro ao excluir produto"
                    );
                  }

                  // Remove produto localmente
                  setProducts((prev) => prev.filter((p) => p.id !== productId));
                  toast.success("Produto excluído com sucesso!");
                } catch (error) {
                  console.error("Erro ao excluir produto:", error);
                  if (error instanceof Error) toast.error(error.message);
                  else toast.error("Erro desconhecido");
                }
              }}
            >
              Excluir
            </Button>
          </div>
        </div>
      ),
      { duration: 10000 }
    );
  };

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // 1) Busca produtos
        const prodRes = await fetch("https://shadowpay-api-production.up.railway.app/api/products", {
          headers,
        });
        if (!prodRes.ok)
          throw new Error(`Erro ao carregar produtos: ${prodRes.status}`);
        const prodJson = await prodRes.json();
        const productsData: any[] =
          prodJson?.data?.products || prodJson?.products || [];

        // Função para extrair array de vendas da resposta
        const parseSalesResponse = (j: any) => {
          if (!j) return [];
          if (Array.isArray(j)) return j;
          return j?.data?.sales || j?.sales || j?.data || [];
        };

        // 2) Busca vendas (tentando approved na API, mas filtrando no front)
        let salesFetched: any[] = [];
        try {
          const r = await fetch(
            "https://shadowpay-api-production.up.railway.app/api/sales?status=approved&limit=1000",
            { headers }
          );
          if (r.ok) salesFetched = parseSalesResponse(await r.json());
        } catch (e) {
          console.warn("Erro ao buscar /sales?status=approved", e);
        }

        // Fallback caso a busca anterior não funcione
        if (!Array.isArray(salesFetched) || salesFetched.length === 0) {
          try {
            const r2 = await fetch(
              "https://shadowpay-api-production.up.railway.app/api/sales?limit=1000",
              { headers }
            );
            if (r2.ok) salesFetched = parseSalesResponse(await r2.json());
          } catch (e) {
            console.warn("Erro ao buscar /sales fallback", e);
          }
        }

        // 3) Filtra somente status approved (garantia extra)
        salesFetched = salesFetched.filter(
          (s: any) => String(s?.status).trim().toLowerCase() === "approved"
        );

        // 4) Helpers
        const norm = (v: any) =>
          typeof v === "string" ? v.trim().toLowerCase() : "";
        const getSaleProductId = (s: any) =>
          norm(s?.product_id || s?.productId || s?.productID || s?.product?.id);
        const getSaleUniqueId = (s: any) =>
          String(
            s?.id ||
              s?._id ||
              s?.sale_id ||
              s?.externalTransactionId ||
              s?.external_transaction_id ||
              ""
          ).trim();

        // 5) Deduplica vendas
        const seen = new Set<string>();
        const uniqueSales: any[] = [];
        for (const s of salesFetched) {
          let sid = getSaleUniqueId(s);
          if (!sid) {
            const fallback = `${getSaleProductId(s)}::${(
              s?.email ||
              s?.customerEmail ||
              s?.name ||
              ""
            )
              .toString()
              .toLowerCase()}::${norm(s?.created_at || s?.createdAt)}`;
            sid = fallback;
          }
          if (seen.has(sid)) continue;
          seen.add(sid);
          uniqueSales.push(s);
        }

        // 6) Conta vendas por productId
        const salesByProduct: Record<string, number> = {};
        for (const s of uniqueSales) {
          const pid = getSaleProductId(s);
          if (!pid) continue;
          salesByProduct[pid] = (salesByProduct[pid] || 0) + 1;
        }

        // 7) Mapeia produtos com contagem
        const mappedProducts: Product[] = productsData.map((p: any) => {
          const pid = norm(p.id || p._id || p.productId);
          const approvedSalesCount = salesByProduct[pid] || 0;

          return {
            id: p.id,
            name: p.name,
            description: p.description,
            price: parseFloat(String(p.price || 0)),
            status: p.isActive ? "ativo" : "inativo",
            sales: approvedSalesCount,
            createdAt: p.createdAt,
            checkoutUrl: p.linkSalesPage,
          };
        });

        setProducts(mappedProducts);
      } catch (err) {
        console.error("Erro no fetchProducts:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Métricas derivadas
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

  const animatedRevenue = useCountUp(stats.revenue);

  const kpis = [
    {
      label: "Total de produtos",
      value: String(stats.total),
      icon: <Boxes className="h-4 w-4" />,
      accent: "#8B5CF6",
    },
    {
      label: "Produtos ativos",
      value: String(stats.active),
      icon: <CheckCircle2 className="h-4 w-4" />,
      accent: "#34D399",
    },
    {
      label: "Vendas aprovadas",
      value: String(stats.totalSales),
      icon: <ShoppingBag className="h-4 w-4" />,
      accent: "#6366F1",
    },
    {
      label: "Receita estimada",
      value: formatCurrency(animatedRevenue),
      icon: <TrendingUp className="h-4 w-4" />,
      accent: "#F59E0B",
    },
  ];

  return (
    <>
      <Head>
        <title>ShadowPay — Produtos</title>
      </Head>

      <div className="min-h-screen">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="text-white" style={{ background: SHADOW_BG }}>
            {/* Header */}
            <header className="flex flex-col gap-4 px-4 pt-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-white/60 hover:text-white" />
                <div>
                  <h1
                    className="text-2xl font-bold tracking-tight text-white md:text-[28px]"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    Meus Produtos
                  </h1>
                  <p className="mt-1 text-xs text-white/40">
                    Gerencie seus produtos e acompanhe as vendas
                  </p>
                </div>
              </div>
              <button
                onClick={handleNewProduct}
                className="group relative inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(120deg, #7C3AED, #6366F1)",
                  boxShadow: "0 14px 36px -14px rgba(124,58,237,0.7)",
                }}
              >
                <Plus className="h-4 w-4" />
                Novo Produto
              </button>
            </header>

            <main className="flex flex-col gap-5 p-4 lg:p-8">
              {/* KPIs */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((k, i) => (
                  <motion.div
                    key={k.label}
                    initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{
                      duration: 0.7,
                      delay: i * 0.06,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl"
                  >
                    <div
                      className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-80"
                      style={{ background: `${k.accent}22` }}
                    />
                    <div className="relative mb-4 flex items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ background: `${k.accent}1f`, color: k.accent }}
                      >
                        {k.icon}
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                        {k.label}
                      </span>
                    </div>
                    <div
                      className="relative text-2xl font-semibold tracking-tight text-white"
                      style={{ fontFamily: "'Clash Display', sans-serif" }}
                    >
                      {k.value}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Tabela de produtos */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-xl"
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                  <h2
                    className="flex items-center gap-2 text-sm font-semibold text-white"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    <Package className="h-4 w-4 text-violet-300" />
                    Lista de Produtos
                  </h2>
                  <span className="text-xs text-white/40">
                    {products.length} {products.length === 1 ? "item" : "itens"}
                  </span>
                </div>

                <div className="overflow-x-auto p-2 sm:p-4">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-white/40">
                        <th className="px-3 py-2 font-medium">Produto</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 font-medium">Preço</th>
                        <th className="px-3 py-2 font-medium">Vendas</th>
                        <th className="px-3 py-2 font-medium">Criado em</th>
                        <th className="px-3 py-2 text-right font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <tr
                            key={i}
                            className="animate-pulse border-t border-white/[0.05]"
                          >
                            <td className="px-3 py-3">
                              <div className="h-4 w-40 rounded bg-white/10" />
                            </td>
                            <td className="px-3 py-3">
                              <div className="h-6 w-16 rounded-full bg-white/10" />
                            </td>
                            <td className="px-3 py-3">
                              <div className="h-4 w-16 rounded bg-white/10" />
                            </td>
                            <td className="px-3 py-3">
                              <div className="h-4 w-12 rounded bg-white/10" />
                            </td>
                            <td className="px-3 py-3">
                              <div className="h-4 w-20 rounded bg-white/10" />
                            </td>
                            <td className="px-3 py-3 text-right">
                              <div className="ml-auto h-8 w-32 rounded bg-white/10" />
                            </td>
                          </tr>
                        ))
                      ) : products.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-14 text-center">
                            <Package className="mx-auto mb-3 h-7 w-7 text-violet-400/40" />
                            <p className="text-sm font-medium text-white/60">
                              Nenhum produto cadastrado
                            </p>
                            <p className="mt-1 text-xs text-white/35">
                              Crie seu primeiro produto para começar a vender.
                            </p>
                            <button
                              onClick={handleNewProduct}
                              className="mx-auto mt-4 inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-200 transition-colors hover:bg-violet-500/20"
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
                            className="border-t border-white/[0.05] transition-colors hover:bg-white/[0.03]"
                          >
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                                  <Package className="h-4 w-4" />
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-white/90">
                                    {product.name}
                                  </p>
                                  <p className="line-clamp-1 max-w-[240px] text-xs text-white/40">
                                    {product.description}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              {getStatusBadge(product.status)}
                            </td>
                            <td className="px-3 py-3 font-medium text-white/90">
                              {formatCurrency(product.price)}
                            </td>
                            <td className="px-3 py-3">
                              <span className="font-semibold text-white">
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
                                  onClick={() => handleAccessLink(product)}
                                  title="Abrir link do checkout"
                                  className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-xs text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Link</span>
                                </button>
                                <button
                                  onClick={() => handleEdit(product.id)}
                                  title="Editar produto"
                                  className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-xs text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Editar</span>
                                </button>
                                <button
                                  onClick={() =>
                                    handleDelete(product.id, product.name)
                                  }
                                  title="Excluir produto"
                                  className="flex h-8 items-center gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-2.5 text-xs text-rose-300 transition-colors hover:bg-rose-500/20"
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

                {/* Paginação */}
                {!loading && products.length > 0 && (
                  <div className="flex flex-col gap-3 border-t border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-center text-xs text-white/40 sm:text-left">
                      Mostrando 1-{products.length} de {products.length} produtos
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        disabled
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/70 transition-colors hover:bg-white/[0.07] disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20 text-sm font-semibold text-violet-200">
                        1
                      </button>
                      <button
                        disabled
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/70 transition-colors hover:bg-white/[0.07] disabled:opacity-40"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </main>
          </SidebarInset>
        </SidebarProvider>
        <ShadowPanel />
      </div>
    </>
  );
}
