"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";
import TwoFAModal from "../dashboard/2faAuthentication";
import Head from "next/head";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Shield,
  KeyRound,
  ShieldCheck,
  ShieldOff,
  Activity,
  Loader2,
  Lock,
  Smartphone,
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

type AuditLog = {
  id: string;
  action: string;
  targetType?: string;
  targetId?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
};

function ActionLabel({ action }: { action: string }) {
  const map: Record<string, { label: string; color: string }> = {
    "auth.login": { label: "Login realizado", color: "#16A34A" },
    "auth.register": { label: "Conta criada", color: "#7C3AED" },
    "auth.logout": { label: "Logout", color: "#64748B" },
    "auth.password.change": { label: "Senha alterada", color: "#F59E0B" },
    "auth.2fa.enable": { label: "2FA ativado", color: "#16A34A" },
    "auth.2fa.disable": { label: "2FA desativado", color: "#EF4444" },
    "kyc.start": { label: "KYC iniciado", color: "#0EA5E9" },
    "kyc.submit": { label: "KYC enviado", color: "#0EA5E9" },
    "kyc.approve": { label: "KYC aprovado", color: "#16A34A" },
    "kyc.reject": { label: "KYC rejeitado", color: "#EF4444" },
    "withdrawal.create": { label: "Saque solicitado", color: "#F59E0B" },
    "webhook.create": { label: "Webhook criado", color: "#7C3AED" },
  };
  const info = map[action] || { label: action, color: "#64748B" };
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: `${info.color}14`, color: info.color }}
    >
      {info.label}
    </span>
  );
}

function SecurityContent() {
  const { user, token } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [localUser, setLocalUser] = useState<any>(user);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => {
        if (r.data?.success) setLocalUser(r.data.data);
      })
      .catch(() => {});

    axios
      .get(`${API}/api/user/audit-logs?limit=15`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => {
        if (r.data?.success) setLogs(r.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLogsLoading(false));
  }, [token]);

  const twofaEnabled = Boolean(localUser?.twofaEnabled);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      toast.error("As senhas novas não batem.");
      return;
    }
    if (newPwd.length < 8) {
      toast.error("A nova senha precisa de pelo menos 8 caracteres.");
      return;
    }
    setPwdLoading(true);
    try {
      const r = await axios.post(
        `${API}/api/user/change-password`,
        { currentPassword: currentPwd, newPassword: newPwd },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success !== false) {
        toast.success("Senha alterada com sucesso.");
        setCurrentPwd("");
        setNewPwd("");
        setConfirmPwd("");
      } else {
        toast.error(r.data?.message || "Erro ao alterar senha.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao alterar senha.");
    } finally {
      setPwdLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
          CONFIGURAÇÕES
        </p>
        <h1
          className="text-[28px] font-bold tracking-tight text-slate-900"
          style={{ letterSpacing: "-0.005em" }}
        >
          Segurança
        </h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Proteja sua conta com 2FA, senha forte e monitore acessos.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div
          className="rounded-2xl p-5"
          style={{
            background: "#FFFFFF",
            border: `1px solid ${T.borderSoft}`,
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          <div className="mb-3 flex items-center gap-2.5">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                background: twofaEnabled ? "rgba(22,163,74,0.10)" : T.primaryBg,
                color: twofaEnabled ? "#16A34A" : T.primary,
              }}
            >
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">
                Autenticação em 2 etapas
              </h2>
              <p className="text-[11px] text-slate-500">
                Código TOTP via Google Authenticator / Authy
              </p>
            </div>
          </div>
          <div
            className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-[12px]"
            style={{
              background: twofaEnabled
                ? "rgba(22,163,74,0.08)"
                : "rgba(245,158,11,0.08)",
              color: twofaEnabled ? "#15803D" : "#B45309",
            }}
          >
            {twofaEnabled ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="font-semibold">2FA ativo</span>
              </>
            ) : (
              <>
                <ShieldOff className="h-3.5 w-3.5" />
                <span className="font-semibold">
                  2FA desativado — recomendamos ativar
                </span>
              </>
            )}
          </div>
          <button
            onClick={() => setIs2FAModalOpen(true)}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5"
            style={{
              background: twofaEnabled
                ? "#EF4444"
                : `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
              boxShadow: twofaEnabled
                ? "0 8px 20px -8px rgba(239,68,68,0.4)"
                : "0 8px 20px -8px rgba(124,58,237,0.45)",
            }}
          >
            {twofaEnabled ? "Desativar 2FA" : "Ativar 2FA"}
          </button>
        </div>

        <div
          className="rounded-2xl p-5"
          style={{
            background: "#FFFFFF",
            border: `1px solid ${T.borderSoft}`,
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          <div className="mb-3 flex items-center gap-2.5">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: T.primaryBg, color: T.primary }}
            >
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">
                Alterar senha
              </h2>
              <p className="text-[11px] text-slate-500">
                Mínimo 8 caracteres, com letra maiúscula e número.
              </p>
            </div>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <input
              type="password"
              placeholder="Senha atual"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              className="h-10 w-full rounded-lg px-3 text-[13px] outline-none focus:border-violet-500"
              style={{
                background: "#F8FAFC",
                border: `1px solid ${T.borderSoft}`,
                color: T.text,
              }}
              required
            />
            <input
              type="password"
              placeholder="Nova senha"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              className="h-10 w-full rounded-lg px-3 text-[13px] outline-none focus:border-violet-500"
              style={{
                background: "#F8FAFC",
                border: `1px solid ${T.borderSoft}`,
                color: T.text,
              }}
              minLength={8}
              required
            />
            <input
              type="password"
              placeholder="Confirme a nova senha"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              className="h-10 w-full rounded-lg px-3 text-[13px] outline-none focus:border-violet-500"
              style={{
                background: "#F8FAFC",
                border: `1px solid ${T.borderSoft}`,
                color: T.text,
              }}
              minLength={8}
              required
            />
            <button
              type="submit"
              disabled={pwdLoading || !currentPwd || !newPwd || !confirmPwd}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
                boxShadow: "0 8px 20px -8px rgba(124,58,237,0.45)",
              }}
            >
              {pwdLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Alterando…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Alterar senha
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <div
        className="mt-5 overflow-hidden rounded-2xl"
        style={{
          background: "#FFFFFF",
          border: `1px solid ${T.borderSoft}`,
          boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${T.borderSoft}` }}
        >
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-500" />
            <h2 className="text-[14px] font-bold text-slate-900">
              Histórico de atividades
            </h2>
          </div>
          <p className="text-[11px] text-slate-500">
            Últimos 15 eventos da sua conta
          </p>
        </div>
        {logsLoading ? (
          <div className="px-5 py-12 text-center text-[13px] text-slate-500">
            Carregando…
          </div>
        ) : logs.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Shield
              className="mx-auto mb-3 h-10 w-10"
              style={{ color: T.textMuted }}
            />
            <p className="text-[14px] font-semibold text-slate-700">
              Sem atividades registradas
            </p>
            <p className="mt-1 text-[12px] text-slate-500">
              Eventos de segurança aparecem aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr
                  className="text-left text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: T.textMuted, background: "#F8FAFC" }}
                >
                  <th className="px-5 py-2.5">Evento</th>
                  <th className="px-5 py-2.5">IP</th>
                  <th className="px-5 py-2.5">Dispositivo</th>
                  <th className="px-5 py-2.5 text-right">Quando</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    style={{ borderTop: `1px solid ${T.borderSoft}` }}
                  >
                    <td className="px-5 py-3">
                      <ActionLabel action={log.action} />
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-600">
                      {log.ip || "—"}
                    </td>
                    <td
                      className="px-5 py-3 truncate text-slate-500"
                      style={{ maxWidth: 200 }}
                    >
                      {(() => {
                        const ua = log.userAgent;
                        if (!ua) return "—";
                        const m = ua.split("(")[1]?.split(")")[0];
                        return m || ua.slice(0, 30);
                      })()}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-500">
                      {new Date(log.createdAt).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TwoFAModal
        isOpen={is2FAModalOpen}
        onClose={() => setIs2FAModalOpen(false)}
        token={token || ""}
        user={localUser}
        setUser={setLocalUser}
      />
    </div>
  );
}

export default function SecurityPage() {
  return (
    <ProtectedRoute>
      <Head>
        <title>ShadowPay — Segurança</title>
      </Head>
      <LightShell>
        <SecurityContent />
      </LightShell>
      <ShadowPanel />
    </ProtectedRoute>
  );
}
