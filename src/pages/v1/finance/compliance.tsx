"use client";

import { useEffect, useState } from "react";
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
import { AlertTriangle, Shield, FileX, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Tipagem para o seller com possíveis dados de infração
interface Seller {
  id: string;
  companyName?: string;
  email: string;
  status_infringement: string;
  infringement?: Record<string, any>;
}

export default function Compliance() {
  const transacoesEmAnalise = 0;
  const transacoesFraudulentas = 0;

  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          console.error("Token JWT não encontrado no localStorage");
          return;
        }

        const response = await fetch(
          "https://api.safira.cash/api/payments/infringements",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Response status:", response);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Erro na API:", response.status, errorText);
          return;
        }

        const json = await response.json();

        if (!json.success) {
          console.error("Erro na resposta da API:", json.message);
          return;
        }

        setSellers(json.data || []);
      } catch (err) {
        console.error("Erro ao buscar sellers:", err);
      }
    };

    fetchSellers();
  }, []);

  const handleViewDetails = (seller: Seller) => {
    setSelectedSeller(seller);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 px-2 sm:px-4">
            <div className="flex items-center gap-2 px-2 sm:px-4">
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
                    <BreadcrumbPage>Compliance</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-6 p-4 pt-0 min-h-screen sm:p-6 md:p-8">
            {/* Cards de Estatísticas */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg sm:text-xl font-semibold">
                      Transações em Análise
                    </span>
                    <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h3 className="text-3xl sm:text-4xl font-bold">
                      {transacoesEmAnalise}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Aguardando revisão manual
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg sm:text-xl font-semibold">
                      Transações Fraudulentas
                    </span>
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h3 className="text-3xl sm:text-4xl font-bold text-destructive">
                      {transacoesFraudulentas}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Identificadas pelo sistema
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Área de Petições de Compliance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">
                  Petições de Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sellers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-4 px-2 text-center sm:px-8 max-w-xl mx-auto">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                      <FileX className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg sm:text-xl font-medium">
                        Nenhuma petição encontrada
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Não há petições de compliance pendentes no momento.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sellers.map((seller) => (
                      <div
                        key={seller.id}
                        className="flex justify-between items-center border rounded p-4"
                      >
                        <div>
                          <p className="font-semibold">
                            {seller.companyName || seller.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Status: {seller.status_infringement}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleViewDetails(seller)}
                          variant="outline"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Modal de Detalhes */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Detalhes da Petição</DialogTitle>
              </DialogHeader>
              <div className="max-h-[400px] overflow-auto text-sm bg-muted p-4 rounded">
                <pre className="whitespace-pre-wrap break-all">
                  {selectedSeller?.infringement
                    ? JSON.stringify(selectedSeller.infringement, null, 2)
                    : "Nenhum dado disponível"}
                </pre>
              </div>
            </DialogContent>
          </Dialog>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
