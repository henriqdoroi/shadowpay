import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Cpu,
  Fingerprint,
  Radio,
  ShieldCheck,
  Zap,
} from "lucide-react";

/* ============================================================
 * Shadow Core — versão LIGHT (white) oficial
 * ============================================================ */

const T = {
  bg: "#FFFFFF",
  bgSoft: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#0F172A",
  text2: "#475569",
  text3: "#94A3B8",
  primary: "#7C3AED",
  primaryStrong: "#6D28D9",
  primaryBg: "rgba(124, 58, 237, 0.08)",
  border: "rgba(15, 23, 42, 0.08)",
};

function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}

function MetricCard({
  icon,
  label,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  delay = 0,
  start,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  delay?: number;
  start: boolean;
}) {
  const v = useCountUp(value, 1800, start);
  const formatted = v.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={start ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-2xl p-5"
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        boxShadow:
          "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.10)",
      }}
    >
      <div
        className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em]"
        style={{ color: T.text3 }}
      >
        <span style={{ color: T.primary }}>{icon}</span>
        {label}
      </div>
      <div
        className="text-3xl font-semibold tracking-tight"
        style={{ fontFamily: "'Clash Display', sans-serif", color: T.text }}
      >
        {prefix}
        {formatted}
        {suffix}
      </div>
    </motion.div>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-full px-3.5 py-1.5"
      style={{
        background: T.bgSoft,
        border: `1px solid ${T.border}`,
      }}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
          style={{ background: "#16A34A" }}
        />
        <span
          className="relative inline-flex h-1.5 w-1.5 rounded-full"
          style={{ background: "#16A34A" }}
        />
      </span>
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.2em]"
        style={{ color: T.text2 }}
      >
        {label}
      </span>
    </div>
  );
}

export default function ShadowCorePage() {
  const router = useRouter();
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef, { once: true, amount: 0.3 });

  return (
    <>
      <Head>
        <title>ShadowPay — Shadow Core</title>
      </Head>

      <main
        className="relative min-h-screen w-full overflow-hidden"
        style={{
          fontFamily: "'Satoshi', system-ui, sans-serif",
          background: T.bg,
          color: T.text,
        }}
      >
        {/* Halo violeta sutil */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-20%] h-[600px] w-[800px] -translate-x-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 60%)",
            filter: "blur(40px)",
          }}
        />

        {/* Top bar */}
        <div className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2.5">
            <ShadowMark size={26} />
            <span
              className="text-sm font-semibold tracking-[0.05em]"
              style={{ fontFamily: "'Clash Display', sans-serif", color: T.text }}
            >
              ShadowPay
            </span>
          </div>
          <StatusPill label="Shadow Online" />
        </div>

        {/* Stage central */}
        <div
          ref={stageRef}
          className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 pt-10 text-center"
        >
          {/* Orb */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative mb-10 flex items-center justify-center"
          >
            <div
              className="absolute h-44 w-44 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(124,58,237,0.20) 0%, transparent 65%)",
                filter: "blur(24px)",
              }}
            />
            <div
              className="relative flex h-28 w-28 items-center justify-center rounded-full"
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                boxShadow:
                  "0 1px 2px rgba(15,23,42,0.04), 0 24px 56px -20px rgba(124,58,237,0.35)",
              }}
            >
              <ShadowMark size={44} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.35em]"
            style={{ color: T.text2 }}
          >
            <Radio className="h-3.5 w-3.5" style={{ color: T.primary }} />
            Shadow Core Online
          </motion.div>

          {/* Wordmark */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-3xl text-balance text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl"
            style={{ fontFamily: "'Clash Display', sans-serif", color: T.text }}
          >
            Infraestrutura
            <br />
            <span
              style={{
                background: `linear-gradient(120deg, ${T.primary} 10%, ${T.primaryStrong} 55%, #6366F1 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Financeira de Elite
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-6 max-w-xl text-pretty text-base leading-relaxed md:text-lg"
            style={{ color: T.text2 }}
          >
            Pagamentos PIX processados em tempo real, com a precisão e a estética
            de um sistema operacional financeiro. Construído para escala.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
          >
            <button
              onClick={() => router.push("/auth/jwt/login")}
              className="group relative flex items-center gap-2 overflow-hidden rounded-full px-7 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
                color: "#FFFFFF",
                boxShadow: "0 14px 32px -14px rgba(124,58,237,0.5)",
              }}
            >
              Entrar no sistema
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => router.push("/v1/dashboard")}
              className="rounded-full px-6 py-3 text-sm font-medium transition-colors hover:opacity-80"
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                color: T.text,
              }}
            >
              Ver dashboard
            </button>
          </motion.div>

          {/* Status pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-2.5"
          >
            <StatusPill label="Processing Active" />
            <StatusPill label="Monitoring Systems" />
            <StatusPill label="Routing Optimal" />
          </motion.div>

          {/* Métricas */}
          <div className="mt-14 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard
              icon={<Zap className="h-3.5 w-3.5" />}
              label="Volume Processado"
              value={2480350.75}
              prefix="R$ "
              decimals={2}
              delay={0.85}
              start={inView}
            />
            <MetricCard
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
              label="Taxa de Aprovação"
              value={98.7}
              suffix="%"
              decimals={1}
              delay={0.95}
              start={inView}
            />
            <MetricCard
              icon={<Activity className="h-3.5 w-3.5" />}
              label="Transações Hoje"
              value={12840}
              delay={1.05}
              start={inView}
            />
          </div>

          {/* Features */}
          <div className="mt-16 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
            <FeatureItem
              icon={<Cpu className="h-5 w-5" />}
              title="Roteamento Inteligente"
              text="Cada transação roteada pela infraestrutura ideal, em tempo real."
              delay={1.1}
              start={inView}
            />
            <FeatureItem
              icon={<Fingerprint className="h-5 w-5" />}
              title="Segurança de Núcleo"
              text="KYC, 2FA e trilha de auditoria imutável em cada operação."
              delay={1.2}
              start={inView}
            />
            <FeatureItem
              icon={<Radio className="h-5 w-5" />}
              title="Shadow Presence"
              text="Monitoramento vivo da sua operação, 24/7, sempre online."
              delay={1.3}
              start={inView}
            />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.9, delay: 1.4 }}
            className="mt-16 text-[11px] uppercase tracking-[0.3em]"
            style={{ color: T.text3 }}
          >
            Built for modern scale
          </motion.p>
        </div>
      </main>
    </>
  );
}

function FeatureItem({
  icon,
  title,
  text,
  delay,
  start,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  delay: number;
  start: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={start ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl p-5 text-left"
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
      }}
    >
      <div
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ background: T.primaryBg, color: T.primary }}
      >
        {icon}
      </div>
      <h3 className="mb-1 text-sm font-semibold" style={{ color: T.text }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: T.text2 }}>
        {text}
      </p>
    </motion.div>
  );
}

function ShadowMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21" stroke="url(#sg)" strokeWidth="2" opacity="0.5" />
      <circle cx="24" cy="24" r="8" fill="url(#sg)" />
      <circle cx="24" cy="24" r="13" stroke="url(#sg)" strokeWidth="1.5" opacity="0.3" />
    </svg>
  );
}
