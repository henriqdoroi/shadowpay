"use client";

import Head from "next/head";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";

const T = {
  bg: "#F1F3F8",
  surface: "#FFFFFF",
  text: "#0F172A",
  text2: "#475569",
  text3: "#94A3B8",
  primary: "#7C3AED",
  primaryStrong: "#6D28D9",
  border: "rgba(15, 23, 42, 0.08)",
  borderStrong: "rgba(15, 23, 42, 0.12)",
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

export default function Login() {
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { login, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) router.push("/v1/dashboard");
    document.body.classList.add("no-scroll");
    return () => {
      document.body.classList.remove("no-scroll");
    };
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

  return (
    <>
      <Head>
        <title>ShadowPay — Acesso</title>
      </Head>

      <div
        className="relative min-h-screen w-full overflow-hidden"
        style={{
          fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
          background: T.bg,
          color: T.text,
        }}
      >
        {/* Sutil halo violeta no topo */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-30%] h-[600px] w-[800px] -translate-x-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 60%)",
            filter: "blur(40px)",
          }}
        />

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            {/* Brand */}
            <div className="mb-8 flex flex-col items-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-[0_8px_24px_-12px_rgba(124,58,237,0.4),0_2px_8px_rgba(15,23,42,0.06)]">
                <ShadowMark size={36} />
              </div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif", color: T.text }}
              >
                ShadowPay
              </h1>
              <div
                className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.3em]"
                style={{ color: T.text3 }}
              >
                <ShieldCheck className="h-3 w-3" style={{ color: T.primary }} />
                Elite Financial Infrastructure
              </div>
            </div>

            {/* Card */}
            <div
              className="rounded-2xl p-7"
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                boxShadow:
                  "0 1px 2px rgba(15,23,42,0.04), 0 12px 32px -12px rgba(15,23,42,0.12)",
              }}
            >
              <h2
                className="mb-6 text-center text-lg font-semibold"
                style={{ color: T.text }}
              >
                Acesse sua infraestrutura
              </h2>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: T.text2 }}
                  >
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11"
                    style={{
                      background: "#F8FAFC",
                      border: `1px solid ${T.border}`,
                      color: T.text,
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="password"
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: T.text2 }}
                  >
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11"
                    style={{
                      background: "#F8FAFC",
                      border: `1px solid ${T.border}`,
                      color: T.text,
                    }}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-xs transition-colors hover:opacity-80 disabled:opacity-50"
                    style={{ color: T.primary }}
                    disabled={isLoading}
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="group relative h-11 w-full overflow-hidden rounded-xl border-0 font-semibold transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
                  style={{
                    background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
                    color: "#FFFFFF",
                    boxShadow: "0 12px 28px -12px rgba(124,58,237,0.5)",
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Conectando…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Entrar no sistema
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1" style={{ background: T.border }} />
                <span
                  className="text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: T.text3 }}
                >
                  ou
                </span>
                <div className="h-px flex-1" style={{ background: T.border }} />
              </div>

              <p className="text-center text-sm" style={{ color: T.text2 }}>
                Não tem uma conta?{" "}
                <Link
                  href="/auth/jwt/register"
                  className="font-medium transition-colors hover:opacity-80"
                  style={{ color: T.primary }}
                >
                  Criar conta
                </Link>
              </p>
            </div>

            <p
              className="mt-6 text-center text-[10px] uppercase tracking-[0.3em]"
              style={{ color: T.text3 }}
            >
              © {new Date().getFullYear()} ShadowPay — Pagamentos com excelência
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
