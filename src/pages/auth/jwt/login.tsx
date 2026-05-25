"use client";

import Head from "next/head";
import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Radio } from "lucide-react";

const COLORS = {
  bg0: "#050816",
  bg1: "#0B1020",
  violet: "#8B5CF6",
  blue: "#3B82F6",
  indigo: "#6366F1",
};

function ShadowMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="sg-login" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#A855F7" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21" stroke="url(#sg-login)" strokeWidth="2" opacity="0.6" />
      <circle cx="24" cy="24" r="8" fill="url(#sg-login)" />
      <circle cx="24" cy="24" r="13" stroke="url(#sg-login)" strokeWidth="1.5" opacity="0.35" />
    </svg>
  );
}

export default function Login() {
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { login, isLoading, isAuthenticated } = useAuth();

  useEffect(() => setMounted(true), []);

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/v1/dashboard");
    }
    document.body.classList.add("no-scroll");
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [isAuthenticated, router]);

  const particles = useMemo(
    () =>
      Array.from({ length: 22 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 2,
        delay: Math.random() * 5,
        duration: 6 + Math.random() * 8,
      })),
    [],
  );

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
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
          if (permission !== "granted") {
            toast("Notificações não ativadas.");
          }
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
        toast.error(
          result.error || "Erro no login. Verifique suas credenciais.",
        );
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
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&f[]=satoshi@400,500,700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div
        className="relative min-h-screen w-full overflow-hidden text-white"
        style={{
          fontFamily: "'Satoshi', system-ui, sans-serif",
          background: `radial-gradient(1100px 650px at 50% -10%, ${COLORS.bg1} 0%, ${COLORS.bg0} 55%, #02030A 100%)`,
        }}
      >
        {/* Glows */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-15%] h-[560px] w-[560px] -translate-x-1/2 rounded-full blur-[120px]"
          style={{ background: `radial-gradient(circle, ${COLORS.violet}50, transparent 60%)` }}
          animate={{ opacity: [0.4, 0.65, 0.4], scale: [1, 1.08, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute bottom-[-20%] right-[-10%] h-[480px] w-[480px] rounded-full blur-[120px]"
          style={{ background: `radial-gradient(circle, ${COLORS.blue}3a, transparent 60%)` }}
          animate={{ opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(800px 600px at 50% 35%, #000 30%, transparent 75%)",
          }}
        />

        {/* Partículas */}
        {mounted &&
          particles.map((p) => (
            <motion.span
              key={p.id}
              aria-hidden
              className="pointer-events-none absolute rounded-full"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: p.size,
                height: p.size,
                background: "rgba(255,255,255,0.5)",
                boxShadow: "0 0 6px rgba(139,92,246,0.8)",
              }}
              animate={{ y: [0, -20, 0], opacity: [0, 0.7, 0] }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

        {/* Content */}
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            {/* Brand / Orb */}
            <div className="mb-8 flex flex-col items-center">
              <div className="relative mb-5 flex items-center justify-center">
                <motion.div
                  className="absolute h-28 w-28 rounded-full blur-2xl"
                  style={{ background: `radial-gradient(circle, ${COLORS.violet}, transparent 65%)` }}
                  animate={{ opacity: [0.5, 0.9, 0.5], scale: [0.95, 1.1, 0.95] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <div
                  className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/15"
                  style={{
                    background:
                      "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.16), rgba(255,255,255,0.02) 55%)",
                    boxShadow:
                      "inset 0 0 24px rgba(139,92,246,0.4), 0 0 50px -12px rgba(139,92,246,0.6)",
                  }}
                >
                  <ShadowMark size={34} />
                </div>
              </div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                ShadowPay
              </h1>
              <div className="mt-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">
                <Radio className="h-3 w-3" style={{ color: COLORS.violet }} />
                Shadow Core Online
              </div>
            </div>

            {/* Glass card */}
            <div
              className="rounded-2xl border border-white/[0.08] p-7 backdrop-blur-xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                boxShadow: "0 30px 80px -40px rgba(139,92,246,0.5)",
              }}
            >
              <h2 className="mb-6 text-center text-lg font-semibold text-white/90">
                Acesse sua infraestrutura
              </h2>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-white/50">
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
                    className="h-11 border-white/10 bg-white/[0.04] text-white placeholder:text-white/30 focus-visible:border-[#8B5CF6] focus-visible:ring-[#8B5CF6]/25 disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-white/50">
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
                    className="h-11 border-white/10 bg-white/[0.04] text-white placeholder:text-white/30 focus-visible:border-[#8B5CF6] focus-visible:ring-[#8B5CF6]/25 disabled:opacity-50"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-xs text-white/45 transition-colors hover:text-[#A855F7] disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="group relative h-11 w-full overflow-hidden rounded-xl border-0 font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
                  style={{
                    background: `linear-gradient(120deg, ${COLORS.violet}, ${COLORS.indigo})`,
                    boxShadow: "0 14px 36px -12px rgba(139,92,246,0.7)",
                  }}
                >
                  <span
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                    aria-hidden
                  />
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
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">ou</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <p className="text-center text-sm text-white/45">
                Não tem uma conta?{" "}
                <Link
                  href="/auth/jwt/register"
                  className="font-medium text-[#A855F7] transition-colors hover:text-[#C084FC]"
                >
                  Criar conta
                </Link>
              </p>
            </div>

            <p className="mt-6 text-center text-[10px] uppercase tracking-[0.3em] text-white/20">
              Elite Financial Infrastructure
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
