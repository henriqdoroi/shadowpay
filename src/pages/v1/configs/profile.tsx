"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import { toast } from "sonner";
import {
  User,
  Building,
  Mail,
  Phone,
  FileText,
  Lock,
  Eye,
  EyeOff,
  MessageSquare,
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";

interface UserProfile {
  companyName: string;
  email: string;
  number: string;
  cpf_cnpj: string;
  zipCode: string;
  companyModality: string | null;
  companyActivity: string | null;
}

function ProfileContent() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwd, setPwd] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Token não encontrado");
        const r = await fetch(
          "https://shadowpay-api-production.up.railway.app/api/user/profile",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!r.ok) throw new Error(`Erro: ${r.statusText}`);
        const j = await r.json();
        setUserProfile(j.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePwdSubmit = async () => {
    if (pwd.newPassword !== pwd.confirmPassword) {
      toast.error("As senhas não coincidem!");
      return;
    }
    if (pwd.newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres!");
      return;
    }
    setChanging(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token não encontrado");
      const r = await fetch(
        "https://shadowpay-api-production.up.railway.app/api/auth/password",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            current_password: pwd.currentPassword,
            new_password: pwd.newPassword,
          }),
        }
      );
      if (!r.ok) {
        const j = await r.json();
        throw new Error(j.message || "Erro ao alterar senha");
      }
      setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Senha alterada com sucesso!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setChanging(false);
    }
  };

  const field = (label: string, value: string, icon?: React.ReactNode) => (
    <div>
      <label className="mb-1.5 block flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-slate-400">
        {icon}
        {label}
      </label>
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
        {value || "—"}
      </div>
    </div>
  );

  const pwdInputCls =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-10 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100";

  return (
    <>
      <Head>
        <title>ShadowPay — Perfil</title>
      </Head>
      <LightShell>
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
              Configurações
            </p>
            <h1
              className="text-[28px] font-bold tracking-tight text-slate-900"
              style={{
                fontFamily: "'Clash Display', sans-serif",
                letterSpacing: "-0.005em",
              }}
            >
              Seu perfil
            </h1>
            <p className="mt-1 text-[14px] text-slate-500">
              Visualize suas informações e altere sua senha.
            </p>
          </div>
          <a
            href="https://wa.me/5531975610055?text=Ol%C3%A1%20gostaria%20de%20saber%20mais%20sobre%20solu%C3%A7%C3%B5es%20escal%C3%A1veis%20para%20processar%20pagamento"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <MessageSquare className="h-4 w-4" />
            Suporte
          </a>
        </header>

        {loading ? (
          <div
            className="rounded-2xl p-10 text-center text-sm text-slate-500"
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(15,23,42,0.06)",
              boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
            }}
          >
            Carregando…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
            Erro: {error}
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Empresa */}
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(15,23,42,0.06)",
                  boxShadow:
                    "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
                }}
              >
                <div className="mb-4 flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <Building className="h-4 w-4" />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Informações da empresa
                  </span>
                </div>
                <div className="space-y-4">
                  {field("Razão Social", userProfile?.companyName || "")}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {field("CNPJ", userProfile?.cpf_cnpj || "")}
                    {field("CEP", userProfile?.zipCode || "")}
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {field("Tipo de empresa", userProfile?.companyModality || "")}
                    {field("Ramo de atuação", userProfile?.companyActivity || "")}
                  </div>
                </div>
              </div>

              {/* Contato */}
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(15,23,42,0.06)",
                  boxShadow:
                    "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
                }}
              >
                <div className="mb-4 flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                    <User className="h-4 w-4" />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Informações de contato
                  </span>
                </div>
                <div className="space-y-4">
                  {field(
                    "E-mail",
                    userProfile?.email || "",
                    <Mail className="h-3 w-3" />
                  )}
                  {field(
                    "WhatsApp",
                    userProfile?.number || "",
                    <Phone className="h-3 w-3" />
                  )}
                  <div className="flex items-start gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
                    <p className="text-xs text-cyan-800">
                      Para alterar os dados cadastrais, entre em contato com o suporte.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Senha */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(15,23,42,0.06)",
                boxShadow:
                  "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
              }}
            >
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Lock className="h-4 w-4" />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Alterar senha
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {(
                  [
                    {
                      key: "currentPassword",
                      label: "Senha atual",
                      visible: showCurrent,
                      toggle: () => setShowCurrent((v) => !v),
                    },
                    {
                      key: "newPassword",
                      label: "Nova senha",
                      visible: showNew,
                      toggle: () => setShowNew((v) => !v),
                    },
                    {
                      key: "confirmPassword",
                      label: "Confirmar senha",
                      visible: showConfirm,
                      toggle: () => setShowConfirm((v) => !v),
                    },
                  ] as const
                ).map((f) => (
                  <div key={f.key}>
                    <label className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-slate-400">
                      {f.label}
                    </label>
                    <div className="relative">
                      <input
                        type={f.visible ? "text" : "password"}
                        value={pwd[f.key]}
                        onChange={(e) =>
                          setPwd((prev) => ({
                            ...prev,
                            [f.key]: e.target.value,
                          }))
                        }
                        className={pwdInputCls}
                      />
                      <button
                        type="button"
                        onClick={f.toggle}
                        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      >
                        {f.visible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 sm:max-w-md">
                  <p className="mb-1 font-semibold">Dicas de segurança</p>
                  <ul className="ml-5 list-disc space-y-0.5">
                    <li>Use pelo menos 8 caracteres</li>
                    <li>Combine letras, números e símbolos</li>
                    <li>Evite informações pessoais</li>
                    <li>Não reutilize senhas antigas</li>
                  </ul>
                </div>
                <button
                  onClick={handlePwdSubmit}
                  disabled={
                    changing ||
                    !pwd.currentPassword ||
                    !pwd.newPassword ||
                    !pwd.confirmPassword
                  }
                  className="inline-flex h-11 min-w-[160px] items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white disabled:opacity-40"
                  style={{
                    background: "#7C3AED",
                    boxShadow: "0 8px 20px -8px rgba(124,58,237,0.55)",
                  }}
                >
                  {changing ? "Alterando…" : "Alterar senha"}
                </button>
              </div>
            </div>
          </>
        )}
      </LightShell>
      <ShadowPanel />
    </>
  );
}

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
