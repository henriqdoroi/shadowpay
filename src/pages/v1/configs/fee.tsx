"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import Head from "next/head";
import Image from "next/image";
import { CreditCard, Receipt, Bitcoin, Percent } from "lucide-react";
import { toast } from "sonner";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";

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
    adquerer?: AdquirerData;
  };
}

function FeeContent() {
  const { token } = useAuth();
  const [fees, setFees] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState("");

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v || 0);
  const pct = (v: number) => `${v.toFixed(2)}%`;

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setLoading(true);
        const r = await axios.get<FeesResponse>(
          "https://shadowpay-api-production.up.railway.app/api/user/fees",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!r.data.success) {
          toast.error("Erro ao carregar taxas");
          return;
        }
        const { companyName, fees: f, adquerer } = r.data.data;
        setCompany(companyName);
        const txOutFixo =
          Number(adquerer?.txCashOut) || Number(f.pix?.fixo) || 0;
        const txOutPct =
          Number(adquerer?.txPercentCashOut) ||
          Number(f.pix?.percentual) ||
          0;

        const items: FeeStructure[] = [
          {
            id: "pix-out",
            name: "PIX Cash Out",
            icon: (
              <Image
                src="/pix-icon.svg"
                width={18}
                height={18}
                alt="Pix"
                className="object-contain"
              />
            ),
            description: "Saques instantâneos via PIX",
            color: "#22D3EE",
            fixedFee: txOutFixo,
            percentageFee: txOutPct,
          },
          {
            id: "pix-in",
            name: "PIX Cash In",
            icon: (
              <Image
                src="/pix-icon.svg"
                width={18}
                height={18}
                alt="Pix"
                className="object-contain"
              />
            ),
            description: "Recebimentos via PIX",
            color: "#7C3AED",
            fixedFee: Number(f.pix?.fixoin) || 0,
            percentageFee: Number(f.pix?.percentualin) || 0,
          },
          {
            id: "card",
            name: "Cartão de crédito",
            icon: <CreditCard className="h-4 w-4" />,
            description: "Pagamentos com cartão",
            color: "#22C55E",
            fixedFee: Number(f.card?.fixo) || 0,
            percentageFee: Number(f.card?.percentual) || 0,
          },
          {
            id: "boleto",
            name: "Boleto bancário",
            icon: <Receipt className="h-4 w-4" />,
            description: "Pagamentos via boleto",
            color: "#F59E0B",
            fixedFee: Number(f.boleto?.fixo) || 0,
            percentageFee: Number(f.boleto?.percentual) || 0,
          },
          {
            id: "crypto",
            name: "Criptomoedas",
            icon: <Bitcoin className="h-4 w-4" />,
            description: "Bitcoin e outras",
            color: "#A78BFA",
            fixedFee: Number(f.crypto?.fixo) || 0,
            percentageFee: Number(f.crypto?.percentual) || 0,
          },
        ];
        setFees(items);
      } catch (e) {
        console.error(e);
        toast.error("Erro ao conectar com o servidor");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const info = [
    {
      title: "Como são calculadas?",
      body:
        "Cada taxa = parte fixa (R$) + parte percentual sobre o valor. O valor final é a soma das duas.",
    },
    {
      title: "Quando são cobradas?",
      body:
        "Descontadas automaticamente no momento da confirmação do pagamento, deduzidas do que você recebe.",
    },
    {
      title: "Taxas competitivas",
      body:
        "Nossas taxas estão entre as mais competitivas do mercado pra você manter mais do seu faturamento.",
    },
    {
      title: "Transparência total",
      body:
        "Todas as taxas são apresentadas antes da confirmação. Sem surpresas, sem custos ocultos.",
    },
  ];

  return (
    <>
      <Head>
        <title>ShadowPay — Taxas</title>
      </Head>
      <LightShell>
        <header className="mb-6">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
            Integrações
          </p>
          <h1
            className="text-[28px] font-bold tracking-tight text-slate-900"
            style={{
              fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
              letterSpacing: "-0.005em",
            }}
          >
            Estrutura de taxas
          </h1>
          <p className="mt-1 text-[14px] text-slate-500">
            {company
              ? `${company} · taxas vigentes da sua conta`
              : "Taxas aplicadas em cada método de pagamento"}
          </p>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl p-5"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(15,23,42,0.06)",
                  height: 220,
                }}
              />
            ))}
          </div>
        ) : (
          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {fees.map((fee) => (
              <div
                key={fee.id}
                className="rounded-2xl p-5"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(15,23,42,0.06)",
                  boxShadow:
                    "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
                }}
              >
                <div className="mb-4 flex items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{
                      background: `${fee.color}14`,
                      color: fee.color,
                    }}
                  >
                    {fee.icon}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.10em] text-slate-500">
                    {fee.name}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">
                      Taxa fixa
                    </p>
                    <p
                      className="mt-1 text-[22px] font-bold tracking-tight text-slate-900"
                      style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
                    >
                      {fmt(fee.fixedFee)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">
                      Taxa percentual
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-600">
                      + {pct(fee.percentageFee)}
                    </p>
                  </div>

                  <div
                    className="border-t pt-3"
                    style={{ borderColor: "rgba(15,23,42,0.05)" }}
                  >
                    <p className="text-xs text-slate-400">{fee.description}</p>
                  </div>

                  <div
                    className="rounded-xl p-3"
                    style={{ background: "#F8F9FC" }}
                  >
                    <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">
                      Exemplo R$ 100,00
                    </p>
                    <p className="mt-1 text-sm font-semibold text-emerald-600">
                      {fmt(fee.fixedFee + (100 * fee.percentageFee) / 100)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        <div
          className="rounded-2xl p-5"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(15,23,42,0.06)",
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          <h2
            className="mb-4 flex items-center gap-2 text-[14px] font-semibold text-slate-900"
            style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
          >
            <Percent className="h-4 w-4 text-violet-500" />
            Informações importantes
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            {info.map((card) => (
              <div key={card.title} className="space-y-1.5">
                <h3 className="text-sm font-semibold text-slate-800">
                  {card.title}
                </h3>
                <p className="text-sm text-slate-500">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </LightShell>
      <ShadowPanel />
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
