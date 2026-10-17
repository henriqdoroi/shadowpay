"use client";

/**
 * /auth/jwt/login — split:
 *   LEFT  · formulário branco (craft Stripe) — lógica de auth mantida.
 *   RIGHT · filme 3D da ShadowPay (lg+) — ver components/login/Film3D.tsx.
 */

import Head from "next/head";
import { useState, useEffect, useCallback } from "react";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Lock } from "lucide-react";
import Film3D from "@/components/login/Film3D";

const T = {
  ink: "#0F172A",
  inkSecondary: "#334155",
  inkMute: "#64748B",
  primary: "#7C3AED",
  primaryPress: "#6D28D9",
  canvas: "#FFFFFF",
  hairline: "#E3E8EE",
  hairlineInput: "#DCE3EC",
};
const FONT = "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif";

const ICON = "/shadow-ninja-icon.png";
function AppIcon({ size = 38 }: { size?: number }) {
  return <img src={ICON} alt="ShadowPay" style={{ width: size, height: size, objectFit: "contain", flexShrink: 0 }} />;
}

export default function Login() {
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { login, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) router.push("/v1/dashboard");
  }, [isAuthenticated, router]);

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const result = await login(email, password);
        if (result.success) {
          toast.success("Login realizado com sucesso!");
          // Push: se este aparelho já permitiu, o AuthContext o registra pra
          // esta conta; senão, o seller ativa pelo banner do dashboard.
          router.push("/v1/dashboard");
        } else {
          toast.error(result.error || "Erro no login. Verifique suas credenciais.");
        }
      } catch (err) {
        toast.error("Erro inesperado no login.");
        console.error(err);
      }
    },
    [email, password, login, router]
  );

  const inputCls = "h-11 w-full rounded-lg px-3.5 text-[14px] outline-none transition-colors placeholder:text-slate-400 focus:border-[#7C3AED] focus:ring-2 focus:ring-[rgba(124,58,237,0.12)]";
  const inputStyle: React.CSSProperties = { background: T.canvas, border: `1px solid ${T.hairlineInput}`, color: T.ink };

  return (
    <>
      <Head>
        <title>ShadowPay — Acesso</title>
      </Head>

      <div className="grid min-h-screen w-full lg:grid-cols-[1fr_1.15fr]" style={{ fontFamily: FONT, background: T.canvas, color: T.ink }}>
        {/* ===== ESQUERDA — formulário white ===== */}
        <div className="flex items-center justify-center px-5 py-10 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-[380px]">
            <Link href="/" className="mb-10 flex items-center gap-2.5">
              <AppIcon size={38} />
              <span className="text-[17px] font-semibold tracking-tight" style={{ color: T.ink }}>Shadow<span style={{ color: T.primary, fontStyle: "italic", fontWeight: 500 }}>Pay</span></span>
            </Link>

            <h1 style={{ fontFamily: FONT, fontSize: 28, fontWeight: 600, letterSpacing: "-0.6px", color: T.ink }}>Entrar na sua conta</h1>
            <p className="mt-1.5 text-[14px]" style={{ color: T.inkMute }}>Bem-vindo de volta. Acesse seu painel.</p>

            <form onSubmit={handleLogin} className="mt-7 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-[12px] font-medium" style={{ color: T.inkSecondary }}>E-mail</label>
                <input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} className={inputCls} style={inputStyle} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-[12px] font-medium" style={{ color: T.inkSecondary }}>Senha</label>
                  <button type="button" onClick={() => setIsForgotPasswordOpen(true)} className="text-[12px] transition-opacity hover:opacity-70 disabled:opacity-50" style={{ color: T.primary }} disabled={isLoading}>Esqueceu a senha?</button>
                </div>
                <input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} className={inputCls} style={inputStyle} />
              </div>
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-[14px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-45"
                style={{ background: isLoading ? T.primaryPress : T.primary, boxShadow: "0 1px 2px rgba(13,37,61,0.10)" }}
                onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = T.primaryPress; }}
                onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.background = T.primary; }}
              >
                {isLoading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Conectando…</>) : (<>Entrar<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>)}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: T.hairline }} />
              <span className="text-[11px] uppercase tracking-[0.18em]" style={{ color: T.inkMute }}>ou</span>
              <div className="h-px flex-1" style={{ background: T.hairline }} />
            </div>

            <p className="text-center text-[14px]" style={{ color: T.inkMute }}>
              Não tem uma conta?{" "}
              <Link href="/auth/jwt/register" className="font-semibold transition-opacity hover:opacity-70" style={{ color: T.primary }}>Criar conta</Link>
            </p>

            <p className="mt-8 flex items-center justify-center gap-1.5 text-[11px]" style={{ color: T.inkMute }}>
              <Lock className="h-3 w-3" />
              Conexão segura · dados criptografados
            </p>
          </motion.div>
        </div>

        {/* ===== DIREITA — o filme ===== */}
        <section className="relative hidden overflow-hidden lg:block" style={{ background: "#05030b" }}>
          <Film3D />
        </section>

        <ForgotPasswordModal isOpen={isForgotPasswordOpen} onClose={() => setIsForgotPasswordOpen(false)} />
      </div>
    </>
  );
}
