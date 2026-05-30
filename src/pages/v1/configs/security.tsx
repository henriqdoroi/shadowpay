"use client";

/**
 * /v1/configs/security — Segurança tema light.
 *
 * Layout 2 colunas:
 *   esq: Autenticação de Dois Fatores
 *   dir: Alterar Senha
 */

import { useEffect, useState } from "react";
import Head from "next/head";
import axios from "axios";
import { toast } from "sonner";
import {
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Settings,
  Smartphone,
  ShieldCheck,
  Info,
  Key,
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import { ProfileTabs } from "@/components/ProfileTabs";
import ShadowPanel from "@/components/ShadowPanel";
import TwoFAModal from "@/pages/v1/dashboard/2faAuthentication";
import { useAuth } from "@/contexts/AuthContext";

const API = "https://shadowpay-api-production.up.railway.app";

const T = {
  card: "#FFFFFF",
  borderSoft: "rgba(15,23,42,0.06)",
  text: "#0F172A",
  text2: "#475569",
  textMuted: "#94A3B8",
  primary: "#7C3AED",
  primarySoft: "rgba(124,58,237,0.10)",
  green: "#10B981",
  greenSoft: "rgba(16,185,129,0.12)",
  blue: "#06B6D4",
  blueSoft: "rgba(6,182,212,0.12)",
  amber: "#F59E0B",
  amberSoft: "rgba(245,158,11,0.12)",
  red: "#EF4444",
  redSoft: "rgba(239,68,68,0.12)",
  inputBg: "#F8FAFC",
  inputBorder: "rgba(15,23,42,0.10)",
};

function SectionIcon({
  children,
  bg,
  color,
}: {
  children: React.ReactNode;
  bg: string;
  color: string;
}) {
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
      style={{ background: bg, color }}
    >
      {children}
    </div>
  );
}

function StatusPill({
  label,
  variant,
}: {
  label: string;
  variant: "green" | "amber";
}) {
  const map = {
    green: { bg: T.greenSoft, color: T.green },
    amber: { bg: T.amberSoft, color: "#B45309" },
  };
  const cfg = map[variant];
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {label}
    </span>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-4 sm:p-6"
      style={{
        background: T.card,
        border: `1px solid ${T.borderSoft}`,
        boxShadow:
          "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
      }}
    >
      {children}
    </div>
  );
}

function SecurityContent() {
  const { token } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [is2FAOpen, setIs2FAOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);

  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => {
        if (r.data?.success) setUser(r.data.data);
      })
      .catch(console.error);
  }, [token]);

  const twofaEnabled = !!user?.twofaEnabled && !!user?.twofaConfirmed;

  const submitPwd = async () => {
    if (!pwd.current || !pwd.next || !pwd.confirm) {
      toast.error("Preencha todos os campos.");
      return;
    }
    if (pwd.next.length < 8) {
      toast.error("A nova senha precisa ter no mínimo 8 caracteres.");
      return;
    }
    if (pwd.next !== pwd.confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setChanging(true);
    try {
      const r = await axios.post(
        `${API}/api/user/change-password`,
        { currentPassword: pwd.current, newPassword: pwd.next },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        toast.success("Senha alterada com sucesso!");
        setPwd({ current: "", next: "", confirm: "" });
      } else {
        toast.error(r.data?.message || "Erro ao alterar senha.");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Erro ao alterar senha.");
    } finally {
      setChanging(false);
    }
  };

  const inputCls =
    "h-12 w-full rounded-xl border bg-white px-3 pr-10 text-[13px] outline-none transition-colors focus:border-violet-300 focus:ring-2 focus:ring-violet-100";

  const eyeBtn = (visible: boolean, toggle: () => void) => (
    <button
      type="button"
      onClick={toggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <>
      <Head>
        <title>ShadowPay — Segurança</title>
      </Head>
      <LightShell>
        <ProfileTabs />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* ============ 2FA ============ */}
          <Card>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <SectionIcon bg={T.amberSoft} color={T.amber}>
                  <AlertTriangle className="h-5 w-5" />
                </SectionIcon>
                <div>
                  <p className="text-[16px] font-bold text-slate-900">
                    Autenticação de Dois Fatores
                  </p>
                  <p className="text-[12px] text-slate-500">
                    Proteção adicional para sua conta
                  </p>
                </div>
              </div>
              <StatusPill
                label={twofaEnabled ? "Ativo" : "Inativo"}
                variant={twofaEnabled ? "green" : "amber"}
              />
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div
                className="rounded-xl p-3"
                style={{
                  background: "#F8FAFC",
                  border: `1px solid ${T.borderSoft}`,
                }}
              >
                <div
                  className="mb-1 flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-wider"
                  style={{ color: T.textMuted }}
                >
                  <Settings className="h-3 w-3" style={{ color: T.red }} />
                  Configuração
                </div>
                <div className="text-[13px] font-bold text-slate-900">
                  {twofaEnabled ? "Ativada" : "Pendente"}
                </div>
              </div>
              <div
                className="rounded-xl p-3"
                style={{
                  background: "#F8FAFC",
                  border: `1px solid ${T.borderSoft}`,
                }}
              >
                <div
                  className="mb-1 flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-wider"
                  style={{ color: T.textMuted }}
                >
                  <Smartphone className="h-3 w-3" />
                  Método
                </div>
                <div className="text-[13px] font-bold text-slate-900">
                  {twofaEnabled ? "Authenticator" : "Não config."}
                </div>
              </div>
            </div>

            {!twofaEnabled && (
              <div
                className="mb-4 flex items-center gap-2 rounded-xl p-3"
                style={{
                  background: T.amberSoft,
                  border: `1px solid rgba(245,158,11,0.25)`,
                }}
              >
                <AlertTriangle
                  className="h-4 w-4 shrink-0"
                  style={{ color: T.amber }}
                />
                <span className="text-[12.5px] text-slate-700">
                  Recomendamos ativar o 2FA.
                </span>
              </div>
            )}

            <button
              onClick={() => setHowOpen(!howOpen)}
              className="mb-4 flex w-full items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-slate-50"
              style={{
                background: "#F8FAFC",
                border: `1px solid ${T.borderSoft}`,
              }}
            >
              <span className="flex items-center gap-2 text-[13px] font-semibold text-slate-800">
                <Info className="h-4 w-4" style={{ color: T.primary }} />
                Como funciona o 2FA?
              </span>
              {howOpen ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {howOpen && (
              <div
                className="mb-4 rounded-xl p-4 text-[12.5px] leading-relaxed text-slate-600"
                style={{
                  background: "#F8FAFC",
                  border: `1px solid ${T.borderSoft}`,
                }}
              >
                Ao ativar o 2FA você instala um app autenticador (Google
                Authenticator, Authy, etc.) no seu celular. Para fazer
                operações sensíveis (saque, troca de senha) o sistema pede um
                código de 6 dígitos gerado pelo app. Mesmo que alguém
                descubra sua senha, não consegue acessar sem o celular.
              </div>
            )}

            <button
              onClick={() => setIs2FAOpen(true)}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[12px] font-bold uppercase tracking-wider text-white transition-transform hover:-translate-y-0.5"
              style={{
                background: T.primary,
                boxShadow: "0 10px 28px -10px rgba(124,58,237,0.55)",
              }}
            >
              <ShieldCheck className="h-4 w-4" />
              {twofaEnabled ? "Reconfigurar 2FA" : "Ativar 2FA"}
            </button>
          </Card>

          {/* ============ ALTERAR SENHA ============ */}
          <Card>
            <div className="mb-4 flex items-center gap-3">
              <SectionIcon bg={T.primarySoft} color={T.primary}>
                <Lock className="h-5 w-5" />
              </SectionIcon>
              <div>
                <p className="text-[16px] font-bold text-slate-900">
                  Alterar Senha
                </p>
                <p className="text-[12px] text-slate-500">
                  Mantenha sua conta segura
                </p>
              </div>
            </div>

            <div className="mb-4">
              <div className="relative">
                <input
                  type={show.current ? "text" : "password"}
                  value={pwd.current}
                  onChange={(e) =>
                    setPwd({ ...pwd, current: e.target.value })
                  }
                  placeholder="Senha atual"
                  className={inputCls}
                  style={{ borderColor: T.inputBorder }}
                />
                {eyeBtn(show.current, () =>
                  setShow({ ...show, current: !show.current })
                )}
              </div>
            </div>

            <div
              className="mb-4 flex items-center gap-2 rounded-xl p-3"
              style={{
                background: T.blueSoft,
                border: `1px solid rgba(6,182,212,0.25)`,
              }}
            >
              <Info
                className="h-4 w-4 shrink-0"
                style={{ color: T.blue }}
              />
              <span className="text-[12px] text-slate-700">
                A nova senha deve ter no mínimo 8 caracteres.
              </span>
            </div>

            <div className="mb-4">
              <div className="relative">
                <input
                  type={show.next ? "text" : "password"}
                  value={pwd.next}
                  onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                  placeholder="Nova senha"
                  className={inputCls}
                  style={{ borderColor: T.inputBorder }}
                />
                {eyeBtn(show.next, () => setShow({ ...show, next: !show.next }))}
              </div>
            </div>

            <div className="mb-5">
              <div className="relative">
                <input
                  type={show.confirm ? "text" : "password"}
                  value={pwd.confirm}
                  onChange={(e) =>
                    setPwd({ ...pwd, confirm: e.target.value })
                  }
                  placeholder="Confirmar nova senha"
                  className={inputCls}
                  style={{ borderColor: T.inputBorder }}
                />
                {eyeBtn(show.confirm, () =>
                  setShow({ ...show, confirm: !show.confirm })
                )}
              </div>
            </div>

            <button
              onClick={submitPwd}
              disabled={changing}
              className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-[12px] font-bold uppercase tracking-wider text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              style={{
                background: T.primary,
                boxShadow: "0 8px 20px -8px rgba(124,58,237,0.55)",
              }}
            >
              <Key className="h-4 w-4" />
              {changing ? "Alterando…" : "Alterar Senha"}
            </button>
          </Card>
        </div>

        <TwoFAModal
          isOpen={is2FAOpen}
          onClose={() => setIs2FAOpen(false)}
          token={token!}
          user={user}
          setUser={setUser}
        />
      </LightShell>
      <ShadowPanel />
    </>
  );
}

export default function SecurityPage() {
  return (
    <ProtectedRoute>
      <SecurityContent />
    </ProtectedRoute>
  );
}
