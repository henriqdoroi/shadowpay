"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import { ProfileTabs } from "@/components/ProfileTabs";
import ShadowPanel from "@/components/ShadowPanel";
import Head from "next/head";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Mail,
  BellRing,
  MessageSquareText,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const API = "https://shadowpay-api-production.up.railway.app";

const T = {
  text: "#0F172A",
  text2: "#475569",
  textMuted: "#94A3B8",
  primary: "#7C3AED",
  primaryStrong: "#6D28D9",
  primaryBg: "rgba(124, 58, 237, 0.08)",
  border: "rgba(15, 23, 42, 0.08)",
  borderSoft: "rgba(15, 23, 42, 0.06)",
};

type Prefs = {
  emailSaleApproved: boolean;
  emailSalePending: boolean;
  emailSaleRefunded: boolean;
  emailWithdrawalPaid: boolean;
  emailKycUpdate: boolean;
  emailSecurityAlerts: boolean;
  emailMarketing: boolean;
  pushSaleApproved: boolean;
  pushSalePending: boolean;
  pushWithdrawalPaid: boolean;
  pushSecurityAlerts: boolean;
  whatsappSaleApproved: boolean;
  whatsappWithdrawalPaid: boolean;
};

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        background: checked ? T.primary : "#E2E8F0",
      }}
    >
      <span
        className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform"
        style={{
          transform: checked ? "translateX(22px)" : "translateX(2px)",
        }}
      />
    </button>
  );
}

type Row = { key: keyof Prefs; label: string; desc: string };

const EMAIL_ROWS: Row[] = [
  {
    key: "emailSaleApproved",
    label: "Venda aprovada",
    desc: "Cada PIX confirmado em conta — receba o ticket detalhado.",
  },
  {
    key: "emailSalePending",
    label: "PIX gerado (pendente)",
    desc: "Quando um cliente abre a tela de pagamento mas ainda não pagou.",
  },
  {
    key: "emailSaleRefunded",
    label: "Reembolso / chargeback",
    desc: "Estornos e contestações que impactam seu saldo.",
  },
  {
    key: "emailWithdrawalPaid",
    label: "Saque pago",
    desc: "Quando seu PIX de saque cair na conta vinculada.",
  },
  {
    key: "emailKycUpdate",
    label: "Atualização de KYC",
    desc: "Aprovações, rejeições e pedidos de documentação extra.",
  },
  {
    key: "emailSecurityAlerts",
    label: "Alertas de segurança",
    desc: "Logins suspeitos, mudanças de senha, 2FA. Recomendamos manter ligado.",
  },
  {
    key: "emailMarketing",
    label: "Novidades e dicas",
    desc: "Lançamentos de feature, tutoriais e boas práticas.",
  },
];

const PUSH_ROWS: Row[] = [
  { key: "pushSaleApproved", label: "Venda aprovada", desc: "Notificação no navegador a cada PIX pago." },
  { key: "pushSalePending", label: "PIX gerado", desc: "Avisa quando um cliente inicia checkout." },
  { key: "pushWithdrawalPaid", label: "Saque pago", desc: "Push quando seu PIX cair." },
  { key: "pushSecurityAlerts", label: "Alertas de segurança", desc: "Eventos críticos em tempo real." },
];

const WHATSAPP_ROWS: Row[] = [
  { key: "whatsappSaleApproved", label: "Venda aprovada", desc: "Mensagem no WhatsApp a cada PIX pago." },
  { key: "whatsappWithdrawalPaid", label: "Saque pago", desc: "Confirmação do saque por WhatsApp." },
];

function Section({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  rows,
  prefs,
  setPref,
  saving,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  rows: Row[];
  prefs: Prefs;
  setPref: (key: keyof Prefs, v: boolean) => void;
  saving: boolean;
}) {
  return (
    <div
      className="rounded-2xl"
      style={{
        background: "#FFFFFF",
        border: `1px solid ${T.borderSoft}`,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
      }}
    >
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: `1px solid ${T.borderSoft}` }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
        <div>
          <h2 className="text-[14px] font-bold text-slate-900">{title}</h2>
          <p className="text-[11px] text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.map((r) => (
          <div
            key={r.key as string}
            className="flex items-start justify-between gap-4 px-5 py-3.5"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-slate-800">
                {r.label}
              </p>
              <p className="text-[12px] text-slate-500">{r.desc}</p>
            </div>
            <Toggle
              checked={prefs[r.key]}
              onChange={(v) => setPref(r.key, v)}
              disabled={saving}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsContent() {
  const { token } = useAuth();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API}/api/user/notification-preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => {
        if (r.data?.success) setPrefs(r.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  async function setPref(key: keyof Prefs, value: boolean) {
    if (!prefs || !token) return;
    // Optimistic update
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    try {
      const r = await axios.post(
        `${API}/api/user/notification-preferences`,
        { [key]: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        // toast só na primeira mudança pra não spammar
      } else {
        toast.error("Erro ao salvar preferência.");
        setPrefs(prefs);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao salvar.");
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !prefs) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl bg-white p-12 text-center text-[13px] text-slate-500"
          style={{ border: `1px solid ${T.borderSoft}` }}>
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-violet-500" />
          Carregando preferências…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <h1
          className="text-[28px] font-bold tracking-tight text-slate-900"
          style={{ letterSpacing: "-0.005em" }}
        >
          Notificações
        </h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Escolha quais eventos te alertam e por qual canal. Salva
          automaticamente a cada toggle.
        </p>
        {saving && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-slate-500">
            <Loader2 className="h-3 w-3 animate-spin" /> Salvando…
          </p>
        )}
      </header>

      <div className="space-y-5">
        <Section
          icon={<Mail className="h-5 w-5" />}
          iconBg={T.primaryBg}
          iconColor={T.primary}
          title="E-mail"
          subtitle="Eventos enviados para o e-mail cadastrado"
          rows={EMAIL_ROWS}
          prefs={prefs}
          setPref={setPref}
          saving={saving}
        />

        <Section
          icon={<BellRing className="h-5 w-5" />}
          iconBg="rgba(6, 182, 212, 0.10)"
          iconColor="#06B6D4"
          title="Push (navegador)"
          subtitle="Notificações em tempo real via service worker"
          rows={PUSH_ROWS}
          prefs={prefs}
          setPref={setPref}
          saving={saving}
        />

        <Section
          icon={<MessageSquareText className="h-5 w-5" />}
          iconBg="rgba(22, 163, 74, 0.10)"
          iconColor="#16A34A"
          title="WhatsApp"
          subtitle="Em breve — mensagens automáticas no número cadastrado"
          rows={WHATSAPP_ROWS}
          prefs={prefs}
          setPref={setPref}
          saving={saving}
        />
      </div>

      <div
        className="mt-6 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold"
        style={{
          background: "rgba(22, 163, 74, 0.08)",
          color: "#15803D",
          border: "1px solid rgba(22, 163, 74, 0.25)",
        }}
      >
        <CheckCircle2 className="h-4 w-4" />
        Suas preferências são salvas automaticamente
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <Head>
        <title>ShadowPay — Notificações</title>
      </Head>
      <LightShell>
        <ProfileTabs />
        <NotificationsContent />
      </LightShell>
      <ShadowPanel />
    </ProtectedRoute>
  );
}
