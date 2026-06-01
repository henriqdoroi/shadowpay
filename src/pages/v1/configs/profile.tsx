"use client";

/**
 * /v1/configs/profile — Perfil (tema white) no layout SyncPay.
 *
 * 3 abas internas:
 *   - Dados da conta: header + Configurações + Dados empresariais + Dados bancários
 *   - Taxas: taxas reais do seller/adquirente
 *   - Limites: limites da conta
 *
 * Acesso: pelo menu "•••" no rodapé da sidebar (a aba "Perfil" saiu do menu).
 */

import { useEffect, useState } from "react";
import Head from "next/head";
import axios from "axios";
import { toast } from "sonner";
import {
  Save,
  Link2,
  QrCode,
  Banknote,
  Repeat,
  ShoppingCart,
  CreditCard,
  Wallet,
  CalendarDays,
  Tag,
  Tags,
  Moon,
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import { ShadowLoader } from "@/components/ShadowLoader";

const API = "https://shadowpay-api-production.up.railway.app";

const T = {
  card: "#FFFFFF",
  border: "rgba(15,23,42,0.10)",
  borderSoft: "rgba(15,23,42,0.08)",
  text: "#0F172A",
  text2: "#334155",
  textMuted: "#64748B",
  primary: "#7C3AED",
  blue: "#2563EB",
  blueSoft: "rgba(37,99,235,0.10)",
};

const BRL = (n: number) =>
  (Number(n) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const fmtPct = (n: number) =>
  `${(Number(n) || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`;

const fmtFee = (fixed: number, pct: number) => {
  const parts: string[] = [];
  if (Number(fixed) > 0) parts.push(BRL(fixed));
  if (Number(pct) > 0) parts.push(fmtPct(pct));
  return parts.length ? parts.join(" + ") : "Grátis";
};

const fmtCreated = (s?: string | null) => {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  const mes = d
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "");
  return `${String(d.getDate()).padStart(2, "0")} ${
    mes.charAt(0).toUpperCase() + mes.slice(1)
  } ${d.getFullYear()}`;
};

const fmtDoc = (raw?: string | null) => {
  if (!raw) return "—";
  const c = raw.replace(/\D/g, "");
  if (c.length === 11)
    return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (c.length === 14)
    return c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return raw;
};

const fmtPhone = (v?: string | null) => {
  if (!v) return "—";
  const c = v.replace(/\D/g, "").slice(0, 11);
  if (c.length < 10) return v;
  if (c.length === 10) return `(${c.slice(0, 2)}) ${c.slice(2, 6)}-${c.slice(6)}`;
  return `(${c.slice(0, 2)}) ${c.slice(2, 7)}-${c.slice(7)}`;
};

type TabId = "conta" | "taxas" | "limites";

function ProfileContent() {
  const [tab, setTab] = useState<TabId>("conta");
  const [seller, setSeller] = useState<any>(null);
  const [kyc, setKyc] = useState<any>(null);
  const [fees, setFees] = useState<{ withdrawFixed: number }>({
    withdrawFixed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };
        const [pr, kr, fr] = await Promise.all([
          axios.get(`${API}/api/user/profile`, { headers }),
          axios.get(`${API}/api/user/kyc`, { headers }).catch(() => null),
          axios.get(`${API}/api/user/fees`, { headers }).catch(() => null),
        ]);
        if (pr.data?.success) {
          setSeller(pr.data.data);
          setDisplayName(pr.data.data?.companyName || "");
        }
        if (kr?.data?.success) setKyc(kr.data.data);
        if (fr?.data?.success) {
          const adq = fr.data.data?.adquerer || {};
          setFees({ withdrawFixed: Number(adq.txCashOut ?? 0) });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveName = async () => {
    const name = displayName.trim();
    if (!name) {
      toast.error("Informe um nome de exibição.");
      return;
    }
    setSavingName(true);
    try {
      const token = localStorage.getItem("token");
      const r = await axios.put(
        `${API}/api/user/profile`,
        { companyName: name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        toast.success("Nome de exibição salvo!");
        setSeller((s: any) => ({ ...s, companyName: name }));
      } else {
        toast.error(r.data?.message || "Erro ao salvar.");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Erro ao salvar.");
    } finally {
      setSavingName(false);
    }
  };

  const dc = kyc?.dadosCadastrais || {};
  const en = kyc?.endereco || {};
  const isPJ =
    dc.tipoPessoa === "PJ" ||
    String(seller?.cpf_cnpj || "").replace(/\D/g, "").length === 14;
  const tipoConta = isPJ ? "Pessoa jurídica" : "Pessoa física";

  const enderecoStr = [
    en.street,
    en.number,
    en.neighborhood,
    [en.city, en.state].filter(Boolean).join(" - "),
  ]
    .filter(Boolean)
    .join(", ");

  const initial = (seller?.companyName?.[0] || "S").toUpperCase();

  // ---- taxas (reais)
  const pixFixed = Number(seller?.feeFixedPix ?? 0);
  const pixPct = Number(seller?.feePercentPix ?? 0);
  const cardFixed = Number(seller?.feeFixedCard ?? 0);
  const cardPct = Number(seller?.feePercentCard ?? 0);
  const wFixed = fees.withdrawFixed;

  const TAXAS = [
    {
      icon: <Link2 className="h-[18px] w-[18px]" />,
      title: "Link de pagamento",
      desc: "Envio de cobrança via link de pagamento.",
      value: fmtFee(pixFixed, pixPct),
    },
    {
      icon: <QrCode className="h-[18px] w-[18px]" />,
      title: "PIX",
      desc: "Envio e recebimento por chave Pix.",
      value: fmtFee(pixFixed, pixPct),
    },
    {
      icon: <Banknote className="h-[18px] w-[18px]" />,
      title: "Saque Painel",
      desc: "Transferência manual feita pelo painel.",
      value: wFixed > 0 ? BRL(wFixed) : "Grátis",
    },
    {
      icon: <Repeat className="h-[18px] w-[18px]" />,
      title: "Saque API",
      desc: "Transferência automática via integração.",
      value: wFixed > 0 ? BRL(wFixed) : "Grátis",
    },
    {
      icon: <ShoppingCart className="h-[18px] w-[18px]" />,
      title: "Checkout",
      desc: "Cobrança via checkout com pagamento integrado.",
      value: fmtFee(pixFixed, pixPct),
    },
    {
      icon: <CreditCard className="h-[18px] w-[18px]" />,
      title: "Cartão de Crédito",
      desc: "Recebimento por cartão de crédito.",
      value: fmtFee(cardFixed, cardPct),
    },
  ];

  const LIMITES = [
    {
      icon: <Wallet className="h-[18px] w-[18px]" />,
      title: "Saque por dia",
      desc: "Valor máximo liberado por dia.",
      value: BRL(50000),
    },
    {
      icon: <CalendarDays className="h-[18px] w-[18px]" />,
      title: "Saque por mês",
      desc: "Total permitido no mês.",
      value: BRL(400000),
    },
    {
      icon: <Tag className="h-[18px] w-[18px]" />,
      title: "Ticket Mínimo",
      desc: "Valor mínimo aceito por transação.",
      value: BRL(1),
    },
    {
      icon: <Tags className="h-[18px] w-[18px]" />,
      title: "Ticket Máximo",
      desc: "Valor máximo aceito por transação.",
      value: BRL(5000),
    },
    {
      icon: <Moon className="h-[18px] w-[18px]" />,
      title: "Saque noturno",
      desc: "Valor máximo de saque noturno (das 20h às 8h).",
      value: BRL(1000),
    },
  ];

  // ---- primitivas visuais
  const Card = ({
    title,
    children,
  }: {
    title?: string;
    children: React.ReactNode;
  }) => (
    <div
      className="rounded-2xl p-5 sm:p-6"
      style={{
        background: T.card,
        border: `1px solid ${T.borderSoft}`,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
      }}
    >
      {title && (
        <>
          <p className="text-[15px] font-bold text-slate-900">{title}</p>
          <div
            className="my-4 h-px"
            style={{ background: "rgba(15,23,42,0.07)" }}
          />
        </>
      )}
      {children}
    </div>
  );

  const Field = ({
    label,
    value,
  }: {
    label: string;
    value?: React.ReactNode;
  }) => (
    <div>
      <label className="mb-1.5 block text-[12.5px] text-slate-500">
        {label}
      </label>
      <div
        className="flex h-11 w-full items-center truncate rounded-lg px-3 text-[13.5px] text-slate-700"
        style={{ border: `1px solid ${T.border}`, background: "#FFFFFF" }}
      >
        {value || "—"}
      </div>
    </div>
  );

  const FeeRow = ({
    icon,
    title,
    desc,
    value,
  }: {
    icon: React.ReactNode;
    title: string;
    desc: string;
    value: string;
  }) => (
    <div
      className="flex items-center gap-3 rounded-xl px-3.5 py-3 sm:gap-4 sm:px-4"
      style={{ border: `1px solid ${T.borderSoft}` }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: T.blueSoft, color: T.blue }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-bold text-slate-800">{title}</p>
        <p className="truncate text-[12px] text-slate-400">{desc}</p>
      </div>
      <div className="shrink-0 text-[13.5px] font-semibold text-slate-500">
        {value}
      </div>
    </div>
  );

  const tabs: { id: TabId; label: string }[] = [
    { id: "conta", label: "Dados da conta" },
    { id: "taxas", label: "Taxas" },
    { id: "limites", label: "Limites" },
  ];

  return (
    <>
      <Head>
        <title>ShadowPay — Perfil</title>
      </Head>
      <LightShell>
        <h1 className="text-[26px] font-semibold tracking-[-0.01em] text-slate-900">
          Perfil
        </h1>

        {/* Tabs (underline estilo SyncPay) */}
        <div
          className="mt-5 border-b"
          style={{ borderColor: "rgba(15,23,42,0.08)" }}
        >
          <div className="flex gap-6">
            {tabs.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="relative -mb-px pb-3 pt-1 text-[14px] font-medium transition-colors"
                  style={{ color: active ? T.primary : T.textMuted }}
                >
                  {t.label}
                  {active && (
                    <span
                      className="absolute inset-x-0 -bottom-px h-[2px] rounded-full"
                      style={{ background: T.primary }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="mt-20 flex justify-center">
            <ShadowLoader size={72} label="Carregando…" />
          </div>
        ) : (
          <div className="mx-auto mt-6 w-full max-w-[640px] space-y-5 pb-10">
            {/* ============ DADOS DA CONTA ============ */}
            {tab === "conta" && (
              <>
                {/* Header */}
                <Card>
                  <div className="flex items-center gap-4">
                    <span
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[22px] font-semibold text-white"
                      style={{ background: T.primary }}
                    >
                      {initial}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[17px] font-bold text-slate-900">
                        {seller?.companyName || "Operador"}
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-slate-400">
                        Criado em: {fmtCreated(seller?.createdAt)}
                      </p>
                      <p className="mt-1 text-[12.5px] text-slate-400">
                        ID: {seller?.id ? String(seller.id).slice(0, 10) : "—"}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Configurações */}
                <Card title="Configurações">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-[12.5px] text-slate-500">
                        Nome de exibição
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="h-11 flex-1 rounded-lg px-3 text-[13.5px] text-slate-800 outline-none transition-colors focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                          style={{ border: `1px solid ${T.border}` }}
                          placeholder="Seu nome de exibição"
                        />
                        <button
                          onClick={saveName}
                          disabled={savingName}
                          className="flex h-11 items-center gap-1.5 rounded-lg px-5 text-[13px] font-semibold text-white transition-opacity disabled:opacity-60"
                          style={{ background: T.primary }}
                        >
                          <Save className="h-4 w-4" />
                          {savingName ? "Salvando…" : "Salvar"}
                        </button>
                      </div>
                    </div>
                    <Field label="Tipo de conta" value={tipoConta} />
                  </div>
                </Card>

                {/* Dados empresariais */}
                <Card title="Dados empresariais">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field
                      label="Nome do representante"
                      value={seller?.companyName}
                    />
                    <Field
                      label="Razão social"
                      value={dc.companyName || seller?.companyName}
                    />
                    <Field label="CNPJ" value={fmtDoc(seller?.cpf_cnpj)} />
                    <Field label="Endereço" value={enderecoStr} />
                    <Field
                      label="Telefone do representante"
                      value={fmtPhone(dc.phone || seller?.number)}
                    />
                    <Field
                      label="Tipo de empresa"
                      value={seller?.companyModality || dc.mcc}
                    />
                  </div>
                </Card>

                {/* Dados bancários */}
                <Card title="Dados bancários">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Tipo de chave Pix" value="Email" />
                    <Field label="Chave Pix" value={seller?.email} />
                  </div>
                </Card>
              </>
            )}

            {/* ============ TAXAS ============ */}
            {tab === "taxas" && (
              <Card title="Taxas">
                <div className="space-y-3">
                  {TAXAS.map((r) => (
                    <FeeRow key={r.title} {...r} />
                  ))}
                </div>
              </Card>
            )}

            {/* ============ LIMITES ============ */}
            {tab === "limites" && (
              <Card title="Limites">
                <div className="space-y-3">
                  {LIMITES.map((r) => (
                    <FeeRow key={r.title} {...r} />
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </LightShell>
    </>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
