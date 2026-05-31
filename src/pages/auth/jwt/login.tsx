"use client";

/**
 * /auth/jwt/login — Login com a "craft" da Stripe aplicada na paleta
 * ShadowPay (violeta + white):
 *  - tipografia display fina (300) com letter-spacing negativo (editorial)
 *  - UM único CTA sólido (sem gradiente), em pílula
 *  - inputs com hairline + foco que troca a borda pro primário
 *  - profundidade sutil com sombra navy (nada de glow roxo)
 *  - painel de atmosfera (malha violeta orgânica) à esquerda no desktop
 *  - números/figuras tabulares (tnum) onde aparecem cifras
 * Toda a lógica de auth + push subscribe foi mantida intacta.
 */

import Head from "next/head";
import { useState, useEffect } from "react";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, ShieldCheck, Zap, Lock } from "lucide-react";

/* Paleta: ShadowPay (violeta) + tokens "ink/hairline/canvas" no estilo Stripe */
const T = {
  ink: "#0F172A",
  inkSecondary: "#334155",
  inkMute: "#64748B",
  primary: "#7C3AED",
  primaryPress: "#6D28D9",
  canvas: "#FFFFFF",
  canvasSoft: "#F6F9FC",
  hairline: "#E3E8EE",
  hairlineInput: "#DCE3EC",
};

function ShadowMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="sg-login" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21" stroke="url(#sg-login)" strokeWidth="2" opacity="0.5" />
      <circle cx="24" cy="24" r="8" fill="url(#sg-login)" />
      <circle cx="24" cy="24" r="13" stroke="url(#sg-login)" strokeWidth="1.5" opacity="0.3" />
    </svg>
  );
}

const DISPLAY: React.CSSProperties = {
  fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
  fontFeatureSettings: '"ss01" 1',
};

export default function Login() {
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { login, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) router.push("/v1/dashboard");
  }, [isAuthenticated, router]);

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success("Login realizado com sucesso!");
        if ("Notification" in window && Notification.permission === "default") {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") toast("Notificações não ativadas.");
        }
        if (
          "serviceWorker" in navigator &&
          "PushManager" in window &&
          Notification.permission === "granted"
        ) {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              "BGSIIaq7ymGsCu-qDrD32FrzTJtd5KgEU5tbjhuQEWF2JVMc72XGLMJYzSK9Snb2W2Swlun9pB9O2Mrt9l7KC3A",
            ),
          });
          await fetch("/api/webhooks/notifications/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscription }),
          });
          toast.success("Notificações ativadas!");
        }
        router.push("/v1/dashboard");
      } else {
        toast.error(result.error || "Erro no login. Verifique suas credenciais.");
      }
    } catch (err) {
      toast.error("Erro inesperado no login.");
      console.error(err);
    }
  };

  const inputCls =
    "h-11 w-full rounded-lg px-3.5 text-[14px] outline-none transition-colors placeholder:text-slate-400 focus:border-[#7C3AED] focus:ring-2 focus:ring-[rgba(124,58,237,0.12)]";
  const inputStyle: React.CSSProperties = {
    background: T.canvas,
    border: `1px solid ${T.hairlineInput}`,
    color: T.ink,
  };

  return (
    <>
      <Head>
        <title>ShadowPay — Acesso</title>
      </Head>

      <div
        className="grid min-h-screen w-full lg:grid-cols-[1.05fr_1fr]"
        style={{ ...DISPLAY, background: T.canvas, color: T.ink }}
      >
        {/* ===== Painel de atmosfera (desktop) ===== */}
        <div
          className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between"
          style={{
            padding: "56px 56px 48px",
            background: `
              radial-gradient(60% 55% at 18% 22%, rgba(124,58,237,0.55), transparent 68%),
              radial-gradient(52% 48% at 82% 26%, rgba(99,102,241,0.42), transparent 70%),
              radial-gradient(58% 55% at 65% 88%, rgba(168,85,247,0.40), transparent 70%),
              radial-gradient(42% 42% at 8% 92%, rgba(236,72,153,0.22), transparent 70%),
              #160D2E
            `,
          }}
        >
          {/* grão sutil */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.8) 0.5px, transparent 0.5px)",
              backgroundSize: "4px 4px",
            }}
          />

          {/* Brand */}
          <div className="relative flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <ShadowMark size={22} />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-white">
              ShadowPay
            </span>
          </div>

          {/* Headline editorial (display fina, tracking negativo) */}
          <div className="relative max-w-[460px]">
            <h2
              className="text-white"
              style={{
                ...DISPLAY,
                fontSize: 44,
                fontWeight: 300,
                lineHeight: 1.08,
                letterSpacing: "-1.2px",
              }}
            >
              A infraestrutura de pagamentos PIX do seu negócio.
            </h2>
            <p
              className="mt-5 text-[15px] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.66)" }}
            >
              Cobre, receba e concilie em tempo real. Tudo num painel só, com a
              segurança que a operação exige.
            </p>

            {/* 3 sinais — figuras tabulares onde tem número */}
            <div className="mt-8 space-y-3">
              {[
                { icon: Zap, label: "Liquidação PIX em segundos" },
                { icon: ShieldCheck, label: "KYC + antifraude integrados" },
                { icon: Lock, label: "Chaves de API e webhooks próprios" },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                      <Icon className="h-3.5 w-3.5 text-white" />
                    </span>
                    <span className="text-[13.5px] text-white/80">{f.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rodapé do painel */}
          <div className="relative flex items-center justify-between text-[11px] text-white/45">
            <span style={{ fontFeatureSettings: '"tnum" 1' }}>
              © {new Date().getFullYear()} ShadowPay
            </span>
            <span className="uppercase tracking-[0.22em]">Financial OS</span>
          </div>
        </div>

        {/* ===== Formulário ===== */}
        <div className="flex items-center justify-center px-5 py-10 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[380px]"
          >
            {/* Brand mobile */}
            <div className="mb-8 flex items-center gap-2.5 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ border: `1px solid ${T.hairline}` }}>
                <ShadowMark size={24} />
              </div>
              <span className="text-[16px] font-semibold tracking-tight" style={{ color: T.ink }}>
                ShadowPay
              </span>
            </div>

            {/* Heading */}
            <h1
              style={{ ...DISPLAY, fontSize: 28, fontWeight: 600, letterSpacing: "-0.6px", color: T.ink }}
            >
              Entrar na sua conta
            </h1>
            <p className="mt-1.5 text-[14px]" style={{ color: T.inkMute }}>
              Bem-vindo de volta. Acesse seu painel.
            </p>

            <form onSubmit={handleLogin} className="mt-7 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-[12px] font-medium"
                  style={{ color: T.inkSecondary }}
                >
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className={inputCls}
                  style={inputStyle}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-[12px] font-medium"
                    style={{ color: T.inkSecondary }}
                  >
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-[12px] transition-opacity hover:opacity-70 disabled:opacity-50"
                    style={{ color: T.primary }}
                    disabled={isLoading}
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className={inputCls}
                  style={inputStyle}
                />
              </div>

              {/* CTA único — sólido, em pílula, sem gradiente nem glow */}
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-[14px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-45"
                style={{
                  background: isLoading ? T.primaryPress : T.primary,
                  boxShadow: "0 1px 2px rgba(13,37,61,0.10)",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) e.currentTarget.style.background = T.primaryPress;
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) e.currentTarget.style.background = T.primary;
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Conectando…
                  </>
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* Divisor */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: T.hairline }} />
              <span className="text-[11px] uppercase tracking-[0.18em]" style={{ color: T.inkMute }}>
                ou
              </span>
              <div className="h-px flex-1" style={{ background: T.hairline }} />
            </div>

            <p className="text-center text-[14px]" style={{ color: T.inkMute }}>
              Não tem uma conta?{" "}
              <Link
                href="/auth/jwt/register"
                className="font-semibold transition-opacity hover:opacity-70"
                style={{ color: T.primary }}
              >
                Criar conta
              </Link>
            </p>

            <p className="mt-8 flex items-center justify-center gap-1.5 text-[11px]" style={{ color: T.inkMute }}>
              <Lock className="h-3 w-3" />
              Conexão segura · dados criptografados
            </p>
          </motion.div>
        </div>

        <ForgotPasswordModal
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
        />
      </div>
    </>
  );
}
