"use client";

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
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import axios from "axios";

interface Sale {
  id: string;
  productId: string;
  productName: string;
  price: string | number;
  status: "pendente" | "aprovado" | "reprovado";
  paymentMethod: string | null;
  name: string;
  email: string;
  celular: string;
  document: string;
  createdAt: string;
  updatedAt: string;
  paymentType: string;
  externalTransactionId?: string | null;
}

const mapTransactionStatusToSale = (txStatus: string) => {
  switch (txStatus?.toUpperCase()) {
    case "APPROVED":
      return "aprovado";
    case "REJECTED":
      return "reprovado";
    default:
      return "pendente";
  }
};

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;
  const intervalRef = useRef<NodeJS.Timer | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  const formatCurrency = (value: string | number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { variant: "secondary" as const, label: "Pendente" },
      aprovado: { variant: "default" as const, label: "Aprovado" },
      reprovado: { variant: "destructive" as const, label: "Reprovado" },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const fetchSales = async (page: number) => {
    if (!token) return;
    try {
      setLoading(true);

      // 1️⃣ Busca todas as vendas da página
      const res = await axios.get(
        `https://api.safira.cash/api/sales?page=${page}&limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const fetchedSales: Sale[] = res.data.data.sales || [];
      const count: number = res.data.data.totalCount || fetchedSales.length;

      // 2️⃣ Pega todos os saleIds válidos das vendas
      const saleIds = fetchedSales.map((s) => s.id).join(",");

      let transactions: any[] = [];
      if (saleIds) {
        // 3️⃣ Busca todas as transações relacionadas pelo saleId
        const txRes = await axios.get(
          `https://api.safira.cash/api/admin/transactions?saleIds=${saleIds}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        transactions = txRes.data.data.transactions || [];
      }
      // 4️⃣ Atualiza status das vendas baseado na transação correspondente
      const updatedSales = fetchedSales.map((sale) => {
        const tx = transactions.find((t: any) => t.saleId === sale.id);
        sale.status = tx ? mapTransactionStatusToSale(tx.status) : "pendente";
        sale.externalTransactionId = tx?.transactionId || null;
        return sale;
      });

      setSales(updatedSales);
      setTotalCount(count);
      setTotalPages(count > limit ? Math.ceil(count / limit) : 1);
    } catch (err) {
      console.error("Erro ao carregar vendas:", err);
      toast.error("Erro ao carregar vendas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales(page);

    return () => {
      if (intervalRef.current)
        clearInterval(intervalRef.current as ReturnType<typeof setInterval>);
    };
  }, [token, page]);

  const handlePrevPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };
  const handleNextPage = () => {
    if (page < totalPages) setPage((p) => p + 1);
  };
  const handleGoToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  if (loading) return <div className="p-4">Carregando pedidos...</div>;

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
                    <BreadcrumbPage>Pedidos</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-6 p-4 pt-0 min-h-screen">
            <h1 className="text-2xl font-bold">Pedidos de Vendas</h1>
            <p className="text-muted-foreground">
              Acompanhe o status de todas as vendas realizadas
            </p>

            <Card className="p-6 min-w-[280px] max-w-[360px] w-full md:min-w-auto md:max-w-none flex flex-col justify-between mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" /> Lista de Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Celular</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{sale.productName || "-"}</TableCell>
                        <TableCell>
                          {sale.name || "-"}
                          <br />
                          <span className="text-sm text-muted-foreground">
                            {sale.email || "-"}
                          </span>
                        </TableCell>
                        <TableCell>{formatCurrency(sale.price)}</TableCell>
                        <TableCell>{sale.paymentType || "-"}</TableCell>
                        <TableCell>
                          {getStatusBadge(sale.status || "pendente")}
                        </TableCell>
                        <TableCell>{sale.celular || "-"}</TableCell>
                        <TableCell>{sale.document || "-"}</TableCell>
                        <TableCell>{formatDate(sale.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground text-center sm:text-left">
                      Mostrando {(page - 1) * limit + 1}-
                      {Math.min(page * limit, totalCount)} de {totalCount}{" "}
                      pedidos
                    </div>

                    <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevPage}
                        disabled={page === 1}
                        className="px-2 sm:px-3 cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline ml-1">Anterior</span>
                      </Button>

                      {(() => {
                        const maxPagesToShow = 5; // Quantidade máxima de páginas visíveis
                        let start = Math.max(1, page - 2);
                        let end = Math.min(totalPages, page + 2);

                        if (page <= 3) {
                          start = 1;
                          end = Math.min(totalPages, maxPagesToShow);
                        } else if (page >= totalPages - 2) {
                          start = Math.max(1, totalPages - maxPagesToShow + 1);
                          end = totalPages;
                        }

                        const pages = [];
                        if (start > 1) {
                          pages.push(
                            <Button
                              key={1}
                              variant={page === 1 ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => handleGoToPage(1)}
                            >
                              1
                            </Button>
                          );
                          if (start > 2) {
                            pages.push(<span key="start-ellipsis">...</span>);
                          }
                        }

                        for (let i = start; i <= end; i++) {
                          pages.push(
                            <Button
                              key={i}
                              variant={page === i ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => handleGoToPage(i)}
                            >
                              {i}
                            </Button>
                          );
                        }

                        if (end < totalPages) {
                          if (end < totalPages - 1) {
                            pages.push(<span key="end-ellipsis">...</span>);
                          }
                          pages.push(
                            <Button
                              key={totalPages}
                              variant={
                                page === totalPages ? "default" : "outline"
                              }
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => handleGoToPage(totalPages)}
                            >
                              {totalPages}
                            </Button>
                          );
                        }

                        return pages;
                      })()}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={page === totalPages}
                        className="px-2 sm:px-3 cursor-pointer"
                      >
                        <span className="hidden sm:inline mr-1">Próximo</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
