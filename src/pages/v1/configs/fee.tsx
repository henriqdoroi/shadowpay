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
import { CreditCard, Receipt, Bitcoin } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { toast } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";

interface FeeStructure {
  id: string;
  name: string;
  icon: React.ReactNode;
  fixedFee: number;
  percentageFee: number;
  description: string;
  color: string;
}

interface ApiFeeData {
  percentual: number;
  fixo: number;
  percentualin: number;
  fixoin: number;
}

interface AdquirerData {
  txCashOut: number;
  txPercentCashOut: number;
}

interface FeesResponse {
  success: boolean;
  data: {
    sellerId: string;
    companyName: string;
    fees: {
      pix: ApiFeeData;
      card: ApiFeeData;
      boleto: ApiFeeData;
      crypto: ApiFeeData;
    };
    adquerer?: AdquirerData; // Added the missing property
  };
}

const getFeeStructureTemplate = (): Omit<
  FeeStructure,
  "fixedFee" | "percentageFee"
>[] => [
  {
    id: "pix",
    name: "PIX",
    icon: (
      <Image
        src="/pix-icon.svg"
        width={24}
        height={24}
        className="brightness-0 invert"
        alt="Pix"
      />
    ),
    description: "Transferências instantâneas via PIX",
    color: "text-blue-600",
  },
  {
    id: "card",
    name: "Cartão de Crédito",
    icon: <CreditCard className="h-6 w-6" />,
    description: "Pagamentos com cartão de crédito",
    color: "text-green-600",
  },
  {
    id: "boleto",
    name: "Boleto Bancário",
    icon: <Receipt className="h-6 w-6" />,
    description: "Pagamentos via boleto bancário",
    color: "text-orange-600",
  },
  {
    id: "crypto",
    name: "Criptomoedas",
    icon: <Bitcoin className="h-6 w-6" />,
    description: "Pagamentos com Bitcoin e outras criptos",
    color: "text-purple-600",
  },
];

function FeeContent() {
  const { token } = useAuth();
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [companyName, setCompanyName] = useState<string>("");

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

  const fetchFees = async () => {
    try {
      setIsLoading(true);

      // 1) Buscar dados do usuário (fees + sellerId + adquirente)
      const feesResponse = await axios.get<FeesResponse>(
        "https://api.safira.cash/api/user/fees",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!feesResponse.data.success) {
        toast.error("Erro ao carregar taxas gerais");
        return;
      }

      const { sellerId, companyName, fees, adquerer } = feesResponse.data.data;

      setCompanyName(companyName);

      if (!sellerId) {
        toast.error("Seller ID não encontrado");
        return;
      }

      // Taxas do adquirente
      const txCashOutFixoRaw = Number(adquerer?.txCashOut) || 0; // fixo PIX (PIX CASH OUT)
      const txCashOutPercentualRaw = Number(adquerer?.txPercentCashOut) || 0; // percentual PIX CASH OUT

      // Taxas gerais da API (do seller)
      const feesPix = fees.pix || {
        fixo: 0,
        percentual: 0,
        fixoin: 0,
        percentualin: 0,
      };
      const txCashOutFixo =
        txCashOutFixoRaw > 0 ? txCashOutFixoRaw : feesPix.fixo || 0;
      const txCashOutPercentual =
        txCashOutPercentualRaw > 0
          ? txCashOutPercentualRaw
          : feesPix.percentual || 0;

      const template = getFeeStructureTemplate();
      const updatedFees: FeeStructure[] = [];

      // Card PIX CASH OUT (saída) usando taxas do adquirente
      updatedFees.push({
        id: "pix",
        name: "PIX CASH OUT",
        icon: (
          <Image
            src="/pix-icon.svg"
            width={24}
            height={24}
            className="brightness-0 invert"
            alt="Pix"
          />
        ),
        description: "Transferências instantâneas via PIX",
        color: "text-blue-600",
        fixedFee: txCashOutFixo,
        percentageFee: txCashOutPercentual,
      }); 

      // Card PIX CASH IN (entrada) usando taxas do seller
      updatedFees.push({
        id: "pix-cashin",
        name: "PIX CASH IN",
        icon: (
          <Image
            src="/pix-icon.svg"
            width={24}
            height={24}
            className="brightness-0 invert"
            alt="Pix Cash In"
          />
        ),
        description: "Transferências recebidas via PIX",
        color: "text-blue-600",
        fixedFee: feesPix.fixoin || 0,
        percentageFee: feesPix.percentualin || 0,
      });

      // Demais cards (cartão, boleto, crypto) usando taxas do seller
      template
        .filter((item) => item.id !== "pix") // PIX já inserido manualmente
        .forEach((item) => {
          const baseFee = fees[item.id as keyof typeof fees] || {
            fixo: 0,
            percentual: 0,
          };
          updatedFees.push({
            ...item,
            fixedFee: baseFee.fixo,
            percentageFee: baseFee.percentual,
          });
        });

      // Atualiza o estado com as taxas montadas
      setFeeStructures(updatedFees);
    } catch (error) {
      console.error("[fetchFees] Erro ao buscar taxas:", error);
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFees();
    }
  }, [token]);

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
                    <BreadcrumbPage>Taxas</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-6 p-4 pt-0 min-h-screen">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Estrutura de Taxas
              </h1>
              {companyName && (
                <p className="text-lg font-medium text-muted-foreground">
                  {companyName}
                </p>
              )}
              <p className="text-muted-foreground">
                Confira as taxas aplicadas para cada método de pagamento
                disponível em nossa plataforma.
              </p>
            </div>

            {isLoading ? (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="relative overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-muted rounded animate-pulse" />
                          <div className="w-24 h-5 bg-muted rounded animate-pulse" />
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1">
                        <div className="w-16 h-4 bg-muted rounded animate-pulse" />
                        <div className="w-20 h-8 bg-muted rounded animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <div className="w-20 h-4 bg-muted rounded animate-pulse" />
                        <div className="w-16 h-6 bg-muted rounded animate-pulse" />
                      </div>
                      <div className="pt-2 border-t">
                        <div className="w-full h-4 bg-muted rounded animate-pulse" />
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="w-32 h-3 bg-muted rounded animate-pulse mb-1" />
                        <div className="w-16 h-4 bg-muted rounded animate-pulse" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : feeStructures.length === 0 ? (
              <p className="text-center text-muted-foreground">
                Nenhuma taxa encontrada.
              </p>
            ) : (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                {feeStructures.map((fee) => (
                  <Card key={fee.id} className="relative overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`${fee.color}`}>{fee.icon}</div>
                          <span className="text-lg">{fee.name}</span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Taxa Fixa
                        </p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(fee.fixedFee)}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Taxa Percentual
                        </p>
                        <p className="text-xl font-semibold text-muted-foreground">
                          + {formatPercentage(fee.percentageFee)}
                        </p>
                      </div>

                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                          {fee.description}
                        </p>
                      </div>

                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">
                          Exemplo para R$ 100,00:
                        </p>
                        <p className="text-sm font-medium">
                          {formatCurrency(
                            fee.fixedFee + (100 * fee.percentageFee) / 100
                          )}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Informações Importantes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="font-semibold">
                      Como são calculadas as taxas?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      As taxas são compostas por uma parte fixa (valor em reais)
                      mais uma parte percentual calculada sobre o valor da
                      transação. O valor final é a soma dessas duas partes.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">
                      Quando as taxas são cobradas?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      As taxas são descontadas automaticamente no momento da
                      confirmação do pagamento, sendo deduzidas do valor que
                      você recebe.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Taxas competitivas</h3>
                    <p className="text-sm text-muted-foreground">
                      Nossas taxas estão entre as mais competitivas do mercado,
                      garantindo que você mantenha mais do seu faturamento.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Transparência total</h3>
                    <p className="text-sm text-muted-foreground">
                      Todas as taxas são apresentadas de forma clara antes da
                      confirmação da transação, sem surpresas ou custos ocultos.
                    </p>
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

export default function Fee() {
  return (
    <ProtectedRoute>
      <FeeContent />
    </ProtectedRoute>
  );
}
