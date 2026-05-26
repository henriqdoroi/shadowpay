"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Head from "next/head";
import { motion } from "framer-motion";
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

const SHADOW_BG =
  "radial-gradient(1100px 700px at 85% -10%, #0B1020 0%, #060A14 55%, #03060F 100%)";

export default function Profile() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Token não encontrado");

        const response = await fetch(
          "https://shadowpay-api-production.up.railway.app/api/user/profile",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Erro ao buscar perfil: ${response.statusText}`);
        }

        const result = await response.json();
        setUserProfile(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePasswordSubmit = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("As senhas não coincidem!");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres!");
      return;
    }

    setIsChangingPassword(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token não encontrado");

      const response = await fetch(
        "https://shadowpay-api-production.up.railway.app/api/auth/password",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            current_password: passwordData.currentPassword,
            new_password: passwordData.newPassword,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao alterar senha");
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast.success("Senha alterada com sucesso!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const fieldRow = (label: string, value: string) => (
    <div className="space-y-1.5">
      <label className="block text-[11px] uppercase tracking-[0.16em] text-white/40">
        {label}
      </label>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm text-white/85">
        {value || "—"}
      </div>
    </div>
  );

  const passwordInputCls =
    "h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 pr-10 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-violet-500/50 focus:bg-white/[0.05]";

  return (
    <>
      <Head>
        <title>ShadowPay — Perfil</title>
      </Head>

      <div className="min-h-screen">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="text-white" style={{ background: SHADOW_BG }}>
            <header className="flex flex-col gap-4 px-4 pt-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-white/60 hover:text-white" />
                <div>
                  <h1
                    className="text-2xl font-bold tracking-tight text-white md:text-[28px]"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    Seu perfil
                  </h1>
                  <p className="mt-1 text-xs text-white/40">
                    Visualize suas informações e altere sua senha
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  window.open(
                    "https://wa.me/5531975610055?text=Ol%C3%A1%20gostaria%20de%20saber%20mais%20sobre%20solu%C3%A7%C3%B5es%20escal%C3%A1veis%20para%20processar%20pagamento",
                    "_blank"
                  )
                }
                className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white/80 transition-colors hover:bg-white/[0.07] hover:text-white"
              >
                <MessageSquare className="h-4 w-4" />
                Suporte
              </button>
            </header>

            <main className="flex flex-col gap-5 p-4 lg:p-8">
              {loading ? (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-10 text-center text-sm text-white/60">
                  Carregando…
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.06] p-5 text-sm text-rose-300">
                  Erro: {error}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Empresa */}
                    <motion.div
                      initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl"
                    >
                      <div
                        className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full opacity-50 blur-2xl"
                        style={{ background: "#8B5CF622" }}
                      />
                      <div className="relative mb-4 flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                          <Building className="h-4 w-4" />
                        </span>
                        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                          Informações da empresa
                        </span>
                      </div>
                      <div className="relative space-y-4">
                        {fieldRow("Razão Social", userProfile?.companyName || "")}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {fieldRow("CNPJ", userProfile?.cpf_cnpj || "")}
                          {fieldRow("CEP", userProfile?.zipCode || "")}
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {fieldRow(
                            "Tipo de Empresa",
                            userProfile?.companyModality || ""
                          )}
                          {fieldRow(
                            "Ramo de Atuação",
                            userProfile?.companyActivity || ""
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* Contato */}
                    <motion.div
                      initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{
                        duration: 0.7,
                        delay: 0.08,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl"
                    >
                      <div
                        className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full opacity-50 blur-2xl"
                        style={{ background: "#22D3EE22" }}
                      />
                      <div className="relative mb-4 flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
                          <User className="h-4 w-4" />
                        </span>
                        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                          Informações de contato
                        </span>
                      </div>
                      <div className="relative space-y-4">
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-white/40">
                            <Mail className="h-3.5 w-3.5" /> E-mail
                          </label>
                          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm text-white/85">
                            {userProfile?.email || "—"}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-white/40">
                            <Phone className="h-3.5 w-3.5" /> WhatsApp
                          </label>
                          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm text-white/85">
                            {userProfile?.number || "—"}
                          </div>
                        </div>
                        <div className="flex items-start gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.05] p-4">
                          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                          <p className="text-xs text-cyan-200/80">
                            Para alterar os dados cadastrais, entre em contato com
                            o suporte.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Senha */}
                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.7,
                      delay: 0.16,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl"
                  >
                    <div className="mb-4 flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
                        <Lock className="h-4 w-4" />
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                        Alterar senha
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {(
                        ["currentPassword", "newPassword", "confirmPassword"] as const
                      ).map((field) => {
                        const label =
                          field === "currentPassword"
                            ? "Senha atual"
                            : field === "newPassword"
                            ? "Nova senha"
                            : "Confirmar senha";
                        const visible =
                          field === "currentPassword"
                            ? showCurrentPassword
                            : field === "newPassword"
                            ? showNewPassword
                            : showConfirmPassword;
                        const toggle = () => {
                          if (field === "currentPassword")
                            setShowCurrentPassword((v) => !v);
                          else if (field === "newPassword")
                            setShowNewPassword((v) => !v);
                          else setShowConfirmPassword((v) => !v);
                        };
                        return (
                          <div key={field} className="space-y-1.5">
                            <label
                              htmlFor={field}
                              className="block text-[11px] uppercase tracking-[0.16em] text-white/40"
                            >
                              {label}
                            </label>
                            <div className="relative">
                              <input
                                id={field}
                                type={visible ? "text" : "password"}
                                value={passwordData[field]}
                                onChange={(e) =>
                                  handlePasswordChange(field, e.target.value)
                                }
                                className={passwordInputCls}
                              />
                              <button
                                type="button"
                                onClick={toggle}
                                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-white/55 hover:bg-white/[0.06] hover:text-white"
                              >
                                {visible ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs text-amber-200/80 sm:max-w-md">
                        <p className="mb-1 font-semibold text-amber-200">
                          Dicas de segurança
                        </p>
                        <ul className="ml-5 list-disc space-y-0.5">
                          <li>Use pelo menos 8 caracteres</li>
                          <li>Combine letras, números e símbolos</li>
                          <li>Evite informações pessoais</li>
                          <li>Não reutilize senhas antigas</li>
                        </ul>
                      </div>
                      <button
                        onClick={handlePasswordSubmit}
                        disabled={
                          isChangingPassword ||
                          !passwordData.currentPassword ||
                          !passwordData.newPassword ||
                          !passwordData.confirmPassword
                        }
                        className="inline-flex h-11 min-w-[160px] items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                        style={{
                          background: "linear-gradient(120deg, #7C3AED, #6366F1)",
                          boxShadow: "0 14px 36px -14px rgba(124,58,237,0.7)",
                        }}
                      >
                        {isChangingPassword ? "Alterando…" : "Alterar senha"}
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </main>
          </SidebarInset>
        </SidebarProvider>
        <ShadowPanel />
      </div>
    </>
  );
}
