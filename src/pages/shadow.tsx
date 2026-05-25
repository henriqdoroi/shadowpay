import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
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
 * Shadow Design Language — v1
 * Tela cinematográfica "SHADOW CORE". Dark luxury, glassmorphism,
 * motion. Autossuficiente (não depende de tema global).
 * ============================================================ */

const COLORS = {
  bg0: "#050816",
  bg1: "#0B1020",
  violet: "#8B5CF6",
  plasma: "#A855F7",
  blue: "#3B82F6",
  indigo: "#6366F1",
};

/* Count-up suave via requestAnimationFrame */
function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      // easeOutExpo
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
      initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
      animate={start ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-xl"
      style={{ boxShadow: "0 20px 60px -30px rgba(139,92,246,0.45)" }}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
        style={{ background: COLORS.violet }}
      />
      <div className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">
        <span className="text-white/70">{icon}</span>
        {label}
      </div>
      <div
        className="text-3xl font-semibold tracking-tight text-white"
        style={{ fontFamily: "'Clash Display', sans-serif" }}
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
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 backdrop-blur-md">
      <span className="relative flex h-1.5 w-1.5">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
          style={{ background: "#34D399" }}
        />
        <span
          className="relative inline-flex h-1.5 w-1.5 rounded-full"
          style={{ background: "#34D399" }}
        />
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
        {label}
      </span>
    </div>
  );
}

export default function ShadowCorePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef, { once: true, amount: 0.3 });

  useEffect(() => setMounted(true), []);

  // Partículas só no cliente (evita mismatch de hidratação)
  const particles = useMemo(
    () =>
      Array.from({ length: 26 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 2.5,
        delay: Math.random() * 5,
        duration: 6 + Math.random() * 8,
      })),
    [],
  );

  return (
    <>
      <Head>
        <title>ShadowPay — Shadow Core</title>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&f[]=satoshi@400,500,700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <main
        className="relative min-h-screen w-full overflow-hidden text-white"
        style={{
          fontFamily: "'Satoshi', system-ui, sans-serif",
          background: `radial-gradient(1200px 700px at 50% -10%, ${COLORS.bg1} 0%, ${COLORS.bg0} 55%, #02030A 100%)`,
        }}
      >
        {/* Glows cinematográficos de fundo */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-18%] h-[640px] w-[640px] -translate-x-1/2 rounded-full blur-[120px]"
          style={{ background: `radial-gradient(circle, ${COLORS.violet}55, transparent 60%)` }}
          animate={{ opacity: [0.45, 0.7, 0.45], scale: [1, 1.08, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute bottom-[-20%] right-[-10%] h-[520px] w-[520px] rounded-full blur-[120px]"
          style={{ background: `radial-gradient(circle, ${COLORS.blue}40, transparent 60%)` }}
          animate={{ opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Grid sutil */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(900px 600px at 50% 30%, #000 30%, transparent 75%)",
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
                background: "rgba(255,255,255,0.55)",
                boxShadow: "0 0 6px rgba(139,92,246,0.8)",
              }}
              animate={{ y: [0, -22, 0], opacity: [0, 0.8, 0] }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

        {/* Top bar — presença do Shadow */}
        <div className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2.5">
            <ShadowMark size={26} />
            <span
              className="text-sm font-semibold tracking-[0.05em]"
              style={{ fontFamily: "'Clash Display', sans-serif" }}
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
          {/* Orb / Shadow Core */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative mb-10 flex items-center justify-center"
          >
            <motion.div
              className="absolute h-44 w-44 rounded-full blur-3xl"
              style={{ background: `radial-gradient(circle, ${COLORS.plasma}, transparent 65%)` }}
              animate={{ opacity: [0.5, 0.95, 0.5], scale: [0.95, 1.12, 0.95] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <div
              className="relative flex h-28 w-28 items-center justify-center rounded-full border border-white/15"
              style={{
                background:
                  "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.18), rgba(255,255,255,0.02) 55%)",
                boxShadow:
                  "inset 0 0 30px rgba(139,92,246,0.4), 0 0 60px -10px rgba(139,92,246,0.6)",
              }}
            >
              <ShadowMark size={44} />
            </div>
          </motion.div>

          {/* Status linha */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/45"
          >
            <Radio className="h-3.5 w-3.5" style={{ color: COLORS.violet }} />
            Shadow Core Online
          </motion.div>

          {/* Wordmark */}
          <motion.h1
            initial={{ opacity: 0, y: 26, filter: "blur(14px)" }}
            animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl text-balance text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl"
            style={{ fontFamily: "'Clash Display', sans-serif" }}
          >
            Infraestrutura
            <br />
            <span
              style={{
                background: `linear-gradient(120deg, #fff 10%, ${COLORS.violet} 55%, ${COLORS.blue} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Financeira de Elite
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/55 md:text-lg"
          >
            Pagamentos PIX processados em tempo real, com a precisão e a estética
            de um sistema operacional financeiro. Construído para escala.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.75 }}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
          >
            <MagneticButton onClick={() => router.push("/auth/jwt/login")}>
              Entrar no sistema
              <ArrowRight className="h-4 w-4" />
            </MagneticButton>
            <button
              onClick={() => router.push("/v1/dashboard")}
              className="rounded-full border border-white/12 bg-white/[0.03] px-6 py-3 text-sm font-medium text-white/70 backdrop-blur-md transition-colors hover:bg-white/[0.07] hover:text-white"
            >
              Ver dashboard
            </button>
          </motion.div>

          {/* Status pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-2.5"
          >
            <StatusPill label="Processing Active" />
            <StatusPill label="Monitoring Systems" />
            <StatusPill label="Routing Optimal" />
          </motion.div>

          {/* Métricas (cockpit) */}
          <div className="mt-14 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard
              icon={<Zap className="h-3.5 w-3.5" />}
              label="Volume Processado"
              value={2480350.75}
              prefix="R$ "
              decimals={2}
              delay={0.95}
              start={inView}
            />
            <MetricCard
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
              label="Taxa de Aprovação"
              value={98.7}
              suffix="%"
              decimals={1}
              delay={1.05}
              start={inView}
            />
            <MetricCard
              icon={<Activity className="h-3.5 w-3.5" />}
              label="Transações Hoje"
              value={12840}
              delay={1.15}
              start={inView}
            />
          </div>

          {/* Feature row */}
          <div className="mt-16 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
            <FeatureItem
              icon={<Cpu className="h-5 w-5" />}
              title="Roteamento Inteligente"
              text="Cada transação roteada pela infraestrutura ideal, em tempo real."
              delay={1.2}
              start={inView}
            />
            <FeatureItem
              icon={<Fingerprint className="h-5 w-5" />}
              title="Segurança de Núcleo"
              text="KYC, 2FA e trilha de auditoria imutável em cada operação."
              delay={1.3}
              start={inView}
            />
            <FeatureItem
              icon={<Radio className="h-5 w-5" />}
              title="Shadow Presence"
              text="Monitoramento vivo da sua operação, 24/7, sempre online."
              delay={1.4}
              start={inView}
            />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 1, delay: 1.6 }}
            className="mt-16 text-[11px] uppercase tracking-[0.3em] text-white/25"
          >
            Built for modern scale
          </motion.p>
        </div>
      </main>
    </>
  );
}

/* Botão magnético com glow */
function MagneticButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        setPos({
          x: (e.clientX - (r.left + r.width / 2)) * 0.25,
          y: (e.clientY - (r.top + r.height / 2)) * 0.35,
        });
      }}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: "spring", stiffness: 250, damping: 18 }}
      className="group relative flex items-center gap-2 overflow-hidden rounded-full px-7 py-3 text-sm font-semibold text-white"
      style={{
        background: `linear-gradient(120deg, ${COLORS.violet}, ${COLORS.indigo})`,
        boxShadow: "0 16px 40px -12px rgba(139,92,246,0.7)",
      }}
    >
      <span
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
        aria-hidden
      />
      {children}
    </motion.button>
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
      initial={{ opacity: 0, y: 20 }}
      animate={start ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 text-left backdrop-blur-md"
    >
      <div
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"
        style={{ background: "rgba(139,92,246,0.12)", color: COLORS.violet }}
      >
        {icon}
      </div>
      <h3 className="mb-1 text-sm font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-white/45">{text}</p>
    </motion.div>
  );
}

/* Símbolo do Shadow — orb/olho minimalista */
function ShadowMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#A855F7" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21" stroke="url(#sg)" strokeWidth="2" opacity="0.6" />
      <circle cx="24" cy="24" r="8" fill="url(#sg)" />
      <circle cx="24" cy="24" r="13" stroke="url(#sg)" strokeWidth="1.5" opacity="0.35" />
    </svg>
  );
}
