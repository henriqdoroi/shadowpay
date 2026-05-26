"use client";

import { useState } from "react";
import Head from "next/head";
import {
  Check,
  X,
  TrendingUp,
  Users,
  Clock,
  CreditCard,
  Mail,
  Phone,
  Hash,
  Building,
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";

interface WithdrawRequest {
  id: string;
  merchantId: string;
  clientName: string;
  pixKey: string;
  pixKeyType: "CPF" | "CNPJ" | "EMAIL" | "TELEFONE" | "CHAVE_ALEATORIA";
  amount: number;
  netAmount: number;
  profit: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

const mockData: WithdrawRequest[] = [
  {
    id: "WD001",
    merchantId: "MERCH_001",
    clientName: "João Silva Santos",
    pixKey: "123.456.789-00",
    pixKeyType: "CPF",
    amount: 1500,
    netAmount: 1485,
    profit: 15,
    status: "PENDING",
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "WD002",
    merchantId: "MERCH_002",
    clientName: "Maria Oliveira Costa",
    pixKey: "maria.oliveira@email.com",
    pixKeyType: "EMAIL",
    amount: 2300.5,
    netAmount: 2277.5,
    profit: 23,
    status: "PENDING",
    createdAt: "2024-01-15T09:15:00Z",
  },
  {
    id: "WD003",
    merchantId: "MERCH_003",
    clientName: "Carlos Eduardo Lima",
    pixKey: "+55 11 99999-8888",
    pixKeyType: "TELEFONE",
    amount: 850.75,
    netAmount: 842.25,
    profit: 8.5,
    status: "APPROVED",
    createdAt: "2024-01-15T08:45:00Z",
  },
  {
    id: "WD004",
    merchantId: "MERCH_001",
    clientName: "Ana Paula Ferreira",
    pixKey: "12.345.678/0001-90",
    pixKeyType: "CNPJ",
    amount: 5200,
    netAmount: 5148,
    profit: 52,
    status: "PENDING",
    createdAt: "2024-01-15T07:20:00Z",
  },
];

function WithdrawAdminContent() {
  const [requests, setRequests] = useState<WithdrawRequest[]>(mockData);
  const [loadingActions, setLoadingActions] = useState<{
    [key: string]: boolean;
  }>({});

  const handleApprove = async (id: string) => {
    setLoadingActions((p) => ({ ...p, [id]: true }));
    await new Promise((r) => setTimeout(r, 1500));
    setRequests((p) =>
      p.map((r) =>
        r.id === id ? { ...r, status: "APPROVED" as const } : r
      )
    );
    setLoadingActions((p) => ({ ...p, [id]: false }));
  };

  const handleReject = async (id: string) => {
    setLoadingActions((p) => ({ ...p, [id]: true }));
    await new Promise((r) => setTimeout(r, 1500));
    setRequests((p) =>
      p.map((r) =>
        r.id === id ? { ...r, status: "REJECTED" as const } : r
      )
    );
    setLoadingActions((p) => ({ ...p, [id]: false }));
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v || 0);
  const fmtDate = (s: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(s));

  const pixIcon = (t: string) => {
    switch (t) {
      case "CPF":
      case "CNPJ":
        return <Hash className="h-3.5 w-3.5" />;
      case "EMAIL":
        return <Mail className="h-3.5 w-3.5" />;
      case "TELEFONE":
        return <Phone className="h-3.5 w-3.5" />;
      default:
        return <CreditCard className="h-3.5 w-3.5" />;
    }
  };

  const statusPill = (s: string) => {
    const map: Record<string, { color: string; text: string }> = {
      PENDING: {
        color: "bg-amber-50 text-amber-700 border-amber-200",
        text: "Pendente",
      },
      APPROVED: {
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        text: "Aprovado",
      },
      REJECTED: {
        color: "bg-rose-50 text-rose-700 border-rose-200",
        text: "Rejeitado",
      },
    };
    const cfg = map[s] ?? {
      color: "bg-slate-50 text-slate-600 border-slate-200",
      text: s,
    };
    return (
      <span
        className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${cfg.color}`}
      >
        {cfg.text}
      </span>
    );
  };

  const pending = requests.filter((r) => r.status === "PENDING");
  const totalPending = pending.reduce((s, r) => s + r.amount, 0);
  const totalProfit = requests.reduce((s, r) => s + r.profit, 0);
  const approvedToday = requests.filter((r) => {
    const today = new Date().toDateString();
    return (
      r.status === "APPROVED" &&
      new Date(r.createdAt).toDateString() === today
    );
  }).length;

  const kpis = [
    {
      label: "Saques pendentes",
      value: String(pending.length),
      sub: `${fmt(totalPending)} em análise`,
      icon: <Clock className="h-4 w-4" />,
      color: "#F59E0B",
    },
    {
      label: "Aprovados hoje",
      value: String(approvedToday),
      sub: "Saques processados",
      icon: <Check className="h-4 w-4" />,
      color: "#22C55E",
    },
    {
      label: "Lucro total",
      value: fmt(totalProfit),
      sub: "Em taxas",
      icon: <TrendingUp className="h-4 w-4" />,
      color: "#22D3EE",
    },
    {
      label: "Total solicitações",
      value: String(requests.length),
      sub: "Todas",
      icon: <Users className="h-4 w-4" />,
      color: "#7C3AED",
    },
  ];

  return (
    <>
      <Head>
        <title>ShadowPay — Saques (Admin)</title>
      </Head>
      <LightShell>
        <header className="mb-6">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
            Admin
          </p>
          <h1
            className="text-[28px] font-bold tracking-tight text-slate-900"
            style={{
              fontFamily: "'Clash Display', sans-serif",
              letterSpacing: "-0.005em",
            }}
          >
            Gerenciamento de Saques
          </h1>
          <p className="mt-1 text-[14px] text-slate-500">
            Aprove e rejeite solicitações de saque.
          </p>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="rounded-2xl p-5"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(15,23,42,0.06)",
                boxShadow:
                  "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500">
                  {k.label}
                </p>
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: `${k.color}14`, color: k.color }}
                >
                  {k.icon}
                </span>
              </div>
              <div
                className="mt-2 text-[24px] font-bold leading-none tracking-tight text-slate-900"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                {k.value}
              </div>
              <p className="mt-1.5 text-xs text-slate-400">{k.sub}</p>
            </div>
          ))}
        </section>

        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(15,23,42,0.06)",
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid rgba(15,23,42,0.06)" }}
          >
            <h2
              className="text-[14px] font-semibold text-slate-900"
              style={{ fontFamily: "'Clash Display', sans-serif" }}
            >
              Solicitações de saque
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Lista de todas as solicitações dos usuários
            </p>
          </div>
          <div className="overflow-x-auto p-2 sm:p-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                  <th className="px-3 py-2.5 font-semibold">ID</th>
                  <th className="px-3 py-2.5 font-semibold">Merchant</th>
                  <th className="px-3 py-2.5 font-semibold">Cliente</th>
                  <th className="px-3 py-2.5 font-semibold">Chave PIX</th>
                  <th className="px-3 py-2.5 font-semibold">Tipo</th>
                  <th className="px-3 py-2.5 font-semibold">Bruto</th>
                  <th className="px-3 py-2.5 font-semibold">Líquido</th>
                  <th className="px-3 py-2.5 font-semibold">Lucro</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold">Data</th>
                  <th className="px-3 py-2.5 text-right font-semibold">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/50"
                    style={{ borderTop: "1px solid rgba(15,23,42,0.04)" }}
                  >
                    <td className="px-3 py-3 font-mono text-xs text-slate-700">
                      {r.id}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        {r.merchantId}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-900">
                      {r.clientName}
                    </td>
                    <td className="px-3 py-3">
                      <div className="max-w-[180px] truncate text-xs text-slate-600">
                        {r.pixKey}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        {pixIcon(r.pixKeyType)}
                        {r.pixKeyType}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-900">
                      {fmt(r.amount)}
                    </td>
                    <td className="px-3 py-3 font-medium text-sky-600">
                      {fmt(r.netAmount)}
                    </td>
                    <td className="px-3 py-3 font-medium text-emerald-600">
                      {fmt(r.profit)}
                    </td>
                    <td className="px-3 py-3">{statusPill(r.status)}</td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      {fmtDate(r.createdAt)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {r.status === "PENDING" ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleApprove(r.id)}
                            disabled={loadingActions[r.id]}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            {loadingActions[r.id] ? (
                              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleReject(r.id)}
                            disabled={loadingActions[r.id]}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                          >
                            {loadingActions[r.id] ? (
                              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <X className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </LightShell>
      <ShadowPanel />
    </>
  );
}

export default function WithdrawAdmin() {
  return (
    <ProtectedRoute>
      <WithdrawAdminContent />
    </ProtectedRoute>
  );
}
