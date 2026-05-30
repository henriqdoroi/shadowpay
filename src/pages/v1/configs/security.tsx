"use client";

/**
 * /v1/configs/security — Segurança dark glassy violeta.
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
import {
  DarkConfigShell,
  DarkCard,
  SectionHeader,
  DARK_T,
  darkInputCls,
  darkInputStyle,
  StatusPill,
} from "@/components/DarkConfigShell";
import TwoFAModal from "@/pages/v1/dashboard/2faAuthentication";
import { useAuth } from "@/contexts/AuthContext";

const API = "https://shadowpay-api-production.up.railway.app";

function SecurityContent() {
  const { token } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [is2FAOpen, setIs2FAOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);

  const [pwd, setPwd] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
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
        {
          currentPassword: pwd.current,
          newPassword: pwd.next,
        },
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

  const eyeBtn = (show: boolean, onToggle: () => void) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
      style={{ color: DARK_T.textMuted }}
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <>
      <Head>
        <title>ShadowPay — Segurança</title>
      </Head>
      <LightShell>
        <DarkConfigShell>
          <ProfileTabs />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* ============ ESQUERDA — 2FA ============ */}
            <DarkCard className="p-6">
              <SectionHeader
                icon={<AlertTriangle className="h-5 w-5" />}
                iconBg={DARK_T.amberSoft}
                iconColor={DARK_T.amber}
                title="Autenticação de Dois Fatores"
                subtitle="Proteção adicional para sua conta"
                right={
                  <StatusPill
                    label={twofaEnabled ? "Ativo" : "Inativo"}
                    variant={twofaEnabled ? "green" : "amber"}
                  />
                }
              />

              {/* 2 sub-cards: Configuração + Método */}
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div
                  className="rounded-xl p-3"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${DARK_T.cardBorder}`,
                  }}
                >
                  <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: DARK_T.textMuted }}>
                    <Settings className="h-3 w-3" style={{ color: DARK_T.red }} />
                    Configuração
                  </div>
                  <div className="text-[13.5px] font-bold" style={{ color: DARK_T.text }}>
                    {twofaEnabled ? "Ativada" : "Pendente"}
                  </div>
                </div>
                <div
                  className="rounded-xl p-3"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${DARK_T.cardBorder}`,
                  }}
                >
                  <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: DARK_T.textMuted }}>
                    <Smartphone className="h-3 w-3" />
                    Método
                  </div>
                  <div className="text-[13.5px] font-bold" style={{ color: DARK_T.text }}>
                    {twofaEnabled ? "Authenticator" : "Não config."}
                  </div>
                </div>
              </div>

              {/* Recomenda ativar */}
              {!twofaEnabled && (
                <div
                  className="mb-4 flex items-center gap-2 rounded-xl p-3"
                  style={{
                    background: DARK_T.amberSoft,
                    border: `1px solid rgba(245,158,11,0.25)`,
                  }}
                >
                  <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: DARK_T.amber }} />
                  <span className="text-[12.5px]" style={{ color: DARK_T.text }}>
                    Recomendamos ativar o 2FA.
                  </span>
                </div>
              )}

              {/* Como funciona? */}
              <button
                onClick={() => setHowOpen(!howOpen)}
                className="mb-4 flex w-full items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-violet-500/5"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${DARK_T.cardBorder}`,
                }}
              >
                <span className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: DARK_T.text }}>
                  <Info className="h-4 w-4" style={{ color: DARK_T.primary }} />
                  Como funciona o 2FA?
                </span>
                {howOpen ? (
                  <ChevronUp className="h-4 w-4" style={{ color: DARK_T.textMuted }} />
                ) : (
                  <ChevronDown className="h-4 w-4" style={{ color: DARK_T.textMuted }} />
                )}
              </button>

              {howOpen && (
                <div
                  className="mb-4 rounded-xl p-4 text-[12.5px] leading-relaxed"
                  style={{
                    background: "rgba(15,11,28,0.5)",
                    border: `1px solid ${DARK_T.cardBorder}`,
                    color: DARK_T.text2,
                  }}
                >
                  Ao ativar o 2FA você instala um app autenticador (Google
                  Authenticator, Authy, etc.) no seu celular. Para entrar e
                  fazer operações sensíveis (saque, troca de senha) o sistema
                  pede um código de 6 dígitos gerado pelo app. Mesmo que
                  alguém descubra sua senha, não consegue acessar sem o
                  celular.
                </div>
              )}

              <button
                onClick={() => setIs2FAOpen(true)}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[12px] font-bold uppercase tracking-[0.1em] text-white transition-transform hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(135deg, ${DARK_T.primary} 0%, ${DARK_T.primaryStrong} 100%)`,
                  boxShadow: `0 10px 28px -10px ${DARK_T.primaryGlow}`,
                }}
              >
                <ShieldCheck className="h-4 w-4" />
                {twofaEnabled ? "Reconfigurar 2FA" : "Ativar 2FA"}
              </button>
            </DarkCard>

            {/* ============ DIREITA — Senha ============ */}
            <DarkCard className="p-6">
              <SectionHeader
                icon={<Lock className="h-5 w-5" />}
                title="Alterar Senha"
                subtitle="Mantenha sua conta segura"
              />

              {/* Senha atual */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type={show.current ? "text" : "password"}
                    value={pwd.current}
                    onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                    placeholder="Senha atual"
                    className={darkInputCls}
                    style={{ ...darkInputStyle, paddingRight: 40 }}
                  />
                  {eyeBtn(show.current, () =>
                    setShow({ ...show, current: !show.current })
                  )}
                </div>
              </div>

              {/* Info */}
              <div
                className="mb-4 flex items-center gap-2 rounded-xl p-3"
                style={{
                  background: DARK_T.blueSoft,
                  border: `1px solid rgba(6,182,212,0.25)`,
                }}
              >
                <Info className="h-4 w-4 shrink-0" style={{ color: DARK_T.blue }} />
                <span className="text-[12px]" style={{ color: DARK_T.text }}>
                  A nova senha deve ter no mínimo 8 caracteres.
                </span>
              </div>

              {/* Nova senha */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type={show.next ? "text" : "password"}
                    value={pwd.next}
                    onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                    placeholder="Nova senha"
                    className={darkInputCls}
                    style={{ ...darkInputStyle, paddingRight: 40 }}
                  />
                  {eyeBtn(show.next, () => setShow({ ...show, next: !show.next }))}
                </div>
              </div>

              {/* Confirmar */}
              <div className="mb-5">
                <div className="relative">
                  <input
                    type={show.confirm ? "text" : "password"}
                    value={pwd.confirm}
                    onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                    placeholder="Confirmar nova senha"
                    className={darkInputCls}
                    style={{ ...darkInputStyle, paddingRight: 40 }}
                  />
                  {eyeBtn(show.confirm, () =>
                    setShow({ ...show, confirm: !show.confirm })
                  )}
                </div>
              </div>

              <button
                onClick={submitPwd}
                disabled={changing}
                className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-[12px] font-bold uppercase tracking-[0.1em] text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, rgba(139,92,246,0.6) 0%, rgba(124,58,237,0.7) 100%)`,
                  boxShadow: `0 10px 28px -10px ${DARK_T.primaryGlow}`,
                }}
              >
                <Key className="h-4 w-4" />
                {changing ? "Alterando…" : "Alterar Senha"}
              </button>
            </DarkCard>
          </div>

          <TwoFAModal
            isOpen={is2FAOpen}
            onClose={() => setIs2FAOpen(false)}
            token={token!}
            user={user}
            setUser={setUser}
          />
        </DarkConfigShell>
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
