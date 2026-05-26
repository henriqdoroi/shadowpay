import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { CreditCard, Receipt, Bitcoin, Percent } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { toast } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import Head from "next/head";
import { motion } from "framer-motion";
import ShadowPanel from "@/components/ShadowPanel";

interface FeeStructure {
  id: string;
  name: string;
  icon: React.ReactNode;
  fixedFee: number;
  percentageFee: number;
  description: string;
  accent: string;
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
    adquerer?: AdquirerData;
  };
}

const SHADOW_BG =
  "radial-gradient(1100px 700px at 85% -10%, #0B1020 0%, #060A14 55%, #03060F 100%)";

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
        width={18}
        height={18}
        className="brightness-0 invert"
        alt="Pix"
      />
    ),
    description: "Transferências instantâneas via PIX",
    accent: "#22D3EE",
  },
  {
    id: "card",
    name: "Cartão de Crédito",
    icon: <CreditCard className="h-4 w-4" />,
    description: "Pagamentos com cartão de crédito",
    accent: "#34D399",
  },
  {
    id: "boleto",
    name: "Boleto Bancário",
    icon: <Receipt className="h-4 w-4" />,
    description: "Pagamentos via boleto bancário",
    accent: "#F59E0B",
  },
  {
    id: "crypto",
    name: "Criptomoedas",
    icon: <Bitcoin className="h-4 w-4" />,
    description: "Bitcoin e outras criptos",
    accent: "#A78BFA",
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
    }).format(value || 0);

  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

  const fetchFees = async () => {
    try {
      setIsLoading(true);

      const feesResponse = await axios.get<FeesResponse>(
        "https://shadowpay-api-production.up.railway.app/api/user/fees",
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
      const txCashOutFixoRaw = Number(adquerer?.txCashOut) || 0;
      const txCashOutPercentualRaw = Number(adquerer?.txPercentCashOut) || 0;

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

      // PIX CASH OUT (saída)
      updatedFees.push({
        id: "pix",
        name: "PIX Cash Out",
        icon: (
          <Image
            src="/pix-icon.svg"
            width={18}
            height={18}
            className="brightness-0 invert"
            alt="Pix"
          />
        ),
        description: "Saques instantâneos via PIX",
        accent: "#22D3EE",
        fixedFee: txCashOutFixo,
        percentageFee: txCashOutPercentual,
      });

      // PIX CASH IN (entrada)
      updatedFees.push({
        id: "pix-cashin",
        name: "PIX Cash In",
        icon: (
          <Image
            src="/pix-icon.svg"
            width={18}
            height={18}
            className="brightness-0 invert"
            alt="Pix Cash In"
          />
        ),
        description: "Recebimentos via PIX",
        accent: "#8B5CF6",
        fixedFee: feesPix.fixoin || 0,
        percentageFee: feesPix.percentualin || 0,
      });

      // Demais
      template
        .filter((item) => item.id !== "pix")
        .forEach((item) => {
          const baseFee = fees[item.id as keyof typeof fees] || {
            fixo: 0,
            percentual: 0,
            fixoin: 0,
            percentualin: 0,
          };
          updatedFees.push({
            ...item,
            fixedFee: baseFee.fixo,
            percentageFee: baseFee.percentual,
          });
        });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const infoCards = [
    {
      title: "Como são calculadas as taxas?",
      body:
        "As taxas são compostas por uma parte fixa (em reais) mais uma parte percentual sobre o valor da transação. O valor final é a soma das duas partes.",
    },
    {
      title: "Quando as taxas são cobradas?",
      body:
        "São descontadas automaticamente no momento da confirmação do pagamento, deduzidas do valor que você recebe.",
    },
    {
      title: "Taxas competitivas",
      body:
        "Nossas taxas estão entre as mais competitivas do mercado, para você manter mais do seu faturamento.",
    },
    {
      title: "Transparência total",
      body:
        "Todas as taxas são apresentadas de forma clara antes da confirmação. Sem surpresas, sem custos ocultos.",
    },
  ];

  return (
    <>
      <Head>
        <title>ShadowPay — Taxas</title>
      </Head>

      <div className="min-h-screen">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="text-white" style={{ background: SHADOW_BG }}>
            <header className="flex items-center gap-3 px-4 pt-6 lg:px-8">
              <SidebarTrigger className="text-white/60 hover:text-white" />
              <div>
                <h1
                  className="text-2xl font-bold tracking-tight text-white md:text-[28px]"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                >
                  Estrutura de Taxas
                </h1>
                {companyName ? (
                  <p className="mt-1 text-xs text-white/40">
                    {companyName} · taxas vigentes da sua conta
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-white/40">
                    Taxas aplicadas em cada método de pagamento
                  </p>
                )}
              </div>
            </header>

            <main className="flex flex-col gap-5 p-4 lg:p-8">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="animate-pulse rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"
                    >
                      <div className="mb-4 h-8 w-32 rounded bg-white/10" />
                      <div className="mb-2 h-7 w-24 rounded bg-white/10" />
                      <div className="mb-4 h-5 w-20 rounded bg-white/10" />
                      <div className="h-10 w-full rounded bg-white/10" />
                    </div>
                  ))}
                </div>
              ) : feeStructures.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-10 text-center backdrop-blur-xl">
                  <Percent className="mx-auto mb-3 h-7 w-7 text-violet-400/40" />
                  <p className="text-sm font-medium text-white/60">
                    Nenhuma taxa encontrada
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {feeStructures.map((fee, i) => (
                    <motion.div
                      key={fee.id}
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
                        style={{ background: `${fee.accent}22` }}
                      />
                      <div className="relative mb-4 flex items-center gap-2.5">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{
                            background: `${fee.accent}1f`,
                            color: fee.accent,
                          }}
                        >
                          {fee.icon}
                        </span>
                        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                          {fee.name}
                        </span>
                      </div>

                      <div className="relative space-y-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.15em] text-white/35">
                            Taxa fixa
                          </p>
                          <p
                            className="mt-1 text-2xl font-semibold tracking-tight text-white"
                            style={{ fontFamily: "'Clash Display', sans-serif" }}
                          >
                            {formatCurrency(fee.fixedFee)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-[0.15em] text-white/35">
                            Taxa percentual
                          </p>
                          <p className="mt-1 text-lg font-semibold text-white/80">
                            + {formatPercentage(fee.percentageFee)}
                          </p>
                        </div>

                        <div className="border-t border-white/[0.06] pt-3">
                          <p className="text-xs text-white/45">
                            {fee.description}
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                          <p className="text-[10px] uppercase tracking-[0.15em] text-white/35">
                            Exemplo R$ 100,00
                          </p>
                          <p className="mt-1 text-sm font-semibold text-emerald-400">
                            {formatCurrency(
                              fee.fixedFee + (100 * fee.percentageFee) / 100
                            )}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Informações Importantes */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 backdrop-blur-xl"
              >
                <h2
                  className="mb-4 text-sm font-semibold text-white"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                >
                  Informações importantes
                </h2>
                <div className="grid gap-5 md:grid-cols-2">
                  {infoCards.map((card) => (
                    <div key={card.title} className="space-y-1.5">
                      <h3 className="text-sm font-semibold text-white/85">
                        {card.title}
                      </h3>
                      <p className="text-sm text-white/45">{card.body}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </main>
          </SidebarInset>
        </SidebarProvider>
        <ShadowPanel />
      </div>
    </>
  );
}

export default function Fee() {
  return (
    <ProtectedRoute>
      <FeeContent />
    </ProtectedRoute>
  );
}
