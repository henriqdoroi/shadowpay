import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  ExternalLink,
  Edit,
  Trash2,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

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

export default function Products() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateString));

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ativo: { variant: "default" as const, label: "Ativo" },
      inativo: { variant: "secondary" as const, label: "Inativo" },
      rascunho: { variant: "outline" as const, label: "Rascunho" },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
                    `https://api.safira.cash/api/products/${productId}`,
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
        const prodRes = await fetch("https://api.safira.cash/api/products", {
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
            "https://api.safira.cash/api/sales?status=approved&limit=1000",
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
              "https://api.safira.cash/api/sales?limit=1000",
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

  if (loading) return <div className="p-4">Carregando produtos...</div>;

  return (
    <div className="min-h-screen">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">Safira Cash</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Produtos</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-6 p-4 pt-0 min-h-screen">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold">Meus Produtos</h1>
                <p className="text-muted-foreground">
                  Gerencie seus info-produtos e acompanhe as vendas
                </p>
              </div>
              <Button
                onClick={handleNewProduct}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Novo Produto</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </div>
            <Card className="p-6 min-w-[280px] max-w-[360px] w-full md:min-w-auto md:max-w-none flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Lista de Produtos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/4">Produto</TableHead>
                      <TableHead className="w-1/12">Status</TableHead>
                      <TableHead className="w-1/12">Preço</TableHead>
                      <TableHead className="w-1/12">Vendas</TableHead>
                      <TableHead className="w-1/6">Criado em</TableHead>
                      <TableHead className="w-1/4 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="truncate max-w-[200px]">
                          <div className="space-y-1">
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {product.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(product.status)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(product.price)}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{product.sales}</span>
                          <span className="text-sm text-muted-foreground ml-1">
                            vendas
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(product.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            {/* <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewOrders(product.id)}
                              className="h-8 cursor-pointer"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Pedidos</span>
                            </Button> */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAccessLink(product)}
                              className="h-8 cursor-pointer"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Link</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(product.id)}
                              className="h-8 cursor-pointer"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Editar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDelete(product.id, product.name)
                              }
                              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Excluir</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginação */}
                <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-muted-foreground text-center sm:text-left">
                    Mostrando 1-{products.length} de {products.length} produtos
                  </div>
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="px-2 sm:px-3"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Anterior</span>
                    </Button>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="default"
                        size="sm"
                        className="w-8 h-8 p-0"
                      >
                        1
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="px-2 sm:px-3"
                    >
                      <span className="hidden sm:inline mr-1">Próximo</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
