import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Menu, X, Zap, ShieldCheck, Target, BarChart3, Webhook, Key, MessageCircle,
  LayoutDashboard, Package, ShoppingBag, Wallet, Plug, Check, ChevronDown,
  ChevronLeft, ChevronRight, Bell, Smartphone, Layers, Rocket, Headphones, CreditCard,
  QrCode, Lock, TrendingUp, Globe2, Download,
} from "lucide-react";
import Simulator from "./Simulator";
import { LANDING_CSS } from "./landingCss";
import { canPromptInstall, onInstallChange, promptInstall } from "@/lib/install";

const REGISTER = "/auth/jwt/register";
const LOGIN = "/auth/jwt/login";

/* ── helpers ─────────────────────────────────────────────────────────── */

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Logo() {
  return (
    <Link href="/" className="spl-logo" aria-label="ShadowPay — início">
      <span className="spl-logo-icon"><img src="/logoshadowpay.png" alt="" /></span>
      <span className="spl-logo-text">Shadow<em>Pay</em></span>
    </Link>
  );
}

/* ── NAV ─────────────────────────────────────────────────────────────── */

const NAV = [
  { href: "#recursos", label: "Recursos" },
  { href: "#checkout", label: "Checkout" },
  { href: "#premiacoes", label: "Premiações" },
  { href: "#taxas", label: "Taxas" },
  { href: "#faq", label: "Dúvidas" },
];

function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={"spl-nav" + (scrolled || open ? " is-solid" : "")}>
      <div className="spl-wrap spl-nav-in">
        <Logo />
        <nav className="spl-nav-links" aria-label="Seções">
          {NAV.map((n) => <a key={n.href} href={n.href}>{n.label}</a>)}
        </nav>
        <div className="spl-nav-cta">
          <Link href={LOGIN} className="spl-btn spl-btn-ghost spl-btn-sm">Entrar</Link>
          <Link href={REGISTER} className="spl-btn spl-btn-primary spl-btn-sm">Criar conta</Link>
        </div>
        <button className="spl-burger" onClick={() => setOpen((o) => !o)} aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            className="spl-mnav"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {NAV.map((n) => <a key={n.href} href={n.href} onClick={() => setOpen(false)}>{n.label}</a>)}
            <div className="spl-mnav-cta">
              <Link href={LOGIN} className="spl-btn spl-btn-light">Efetuar login</Link>
              <Link href={REGISTER} className="spl-btn spl-btn-primary">Criar conta</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ── HERO + mockup do dashboard ──────────────────────────────────────── */

const CHART = [12, 18, 14, 26, 22, 34, 28, 40, 31, 47, 39, 55, 46, 62, 58, 71];

function MiniChart() {
  const w = 520, h = 170;
  const max = Math.max(...CHART);
  const pts = CHART.map((v, i) => [(i / (CHART.length - 1)) * w, h - (v / max) * (h - 16) - 6] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="spl-chart" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="splArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#8b5cf6" stopOpacity=".55" />
          <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => <line key={g} x1="0" x2={w} y1={h * g} y2={h * g} stroke="rgba(255,255,255,.05)" />)}
      <path d={`${line} L${w},${h} L0,${h} Z`} fill="url(#splArea)" />
      <path d={line} fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinejoin="round" className="spl-chart-line" />
      <circle cx={pts[pts.length - 1]![0] - 2} cy={pts[pts.length - 1]![1]} r="5" fill="#c4b5fd" className="spl-chart-dot" />
    </svg>
  );
}

function DashboardMock() {
  const tabs = [
    { i: LayoutDashboard, t: "Dashboard", on: true }, { i: Package, t: "Produtos" }, { i: ShoppingBag, t: "Vendas" },
    { i: Wallet, t: "Financeiro" }, { i: Plug, t: "Integrações" },
  ];
  return (
    <div className="spl-dash" aria-hidden>
      <div className="spl-dash-top">
        <span className="spl-dash-brand"><img src="/logoshadowpay.png" alt="" /> ShadowPay</span>
        <div className="spl-dash-tabs">
          {tabs.map(({ i: I, t, on }) => <span key={t} className={on ? "is-on" : ""}><I size={12} /> {t}</span>)}
        </div>
      </div>
      <div className="spl-dash-body">
        <div className="spl-dash-card spl-dash-chart">
          <div className="spl-dash-h"><span>Visão geral</span><em>Últimos 30 dias</em></div>
          <div className="spl-dash-big">R$ 184.327,90 <small>+38,4%</small></div>
          <MiniChart />
        </div>
        <div className="spl-dash-kpis">
          {[
            { k: "Disponível", v: "R$ 42.180,55", c: "#a78bfa", i: Wallet, btn: true },
            { k: "Vendas pagas", v: "1.284", c: "#34d399", i: Check },
            { k: "Conversão Pix", v: "87,6%", c: "#60a5fa", i: QrCode },
            { k: "Ticket médio", v: "R$ 143,56", c: "#fbbf24", i: TrendingUp },
          ].map(({ k, v, c, i: I, btn }) => (
            <div key={k} className="spl-dash-kpi">
              <span className="spl-dash-ic" style={{ color: c, background: c + "1f" }}><I size={13} /></span>
              <div><b>{v}</b><small>{k}</small></div>
              {btn && <span className="spl-dash-sacar">Sacar</span>}
            </div>
          ))}
        </div>
        <div className="spl-dash-card spl-dash-prize">
          <span className="spl-dash-h"><span>Sua próxima premiação</span></span>
          <div className="spl-dash-prize-img" />
          <b>R$ 184.327,90</b>
          <div className="spl-dash-prog"><i style={{ width: "37%" }} /></div>
          <small>37% até o troféu de 500K</small>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const rotate = useTransform(scrollYProgress, [0, 0.45], [24, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.45], [0.92, 1]);
  return (
    <section className="spl-hero" ref={ref}>
      <div className="spl-hero-grid" aria-hidden />
      <div className="spl-hero-arc" aria-hidden />
      <div className="spl-wrap spl-hero-in">
        <motion.span className="spl-pill" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Zap size={13} /> Pix confirmado na hora, saque 24/7
        </motion.span>
        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }}>
          <span className="spl-h1-a">Venda mais, receba na hora e</span>
          <span className="spl-h1-b">escale sem travar</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.16 }}>
          A plataforma de pagamentos para produtores e afiliados dominarem o digital com estrutura de verdade.
        </motion.p>
        <motion.div className="spl-hero-cta" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.24 }}>
          <Link href={REGISTER} className="spl-btn spl-btn-primary spl-btn-lg">Criar conta</Link>
          <Link href={LOGIN} className="spl-btn spl-btn-light spl-btn-lg">Efetuar login</Link>
        </motion.div>
      </div>
      <div className="spl-wrap spl-dash-stage">
        <motion.div style={{ rotateX: rotate, scale }} className="spl-dash-tilt">
          <DashboardMock />
        </motion.div>
      </div>
    </section>
  );
}

/* ── integrações (marquee) ───────────────────────────────────────────── */

const INTEGRACOES: { t: string; i?: React.ElementType; img?: string; c: string }[] = [
  { t: "Pix", img: "/pix-icon.svg", c: "#32BCAD" },
  { t: "Meta Pixel + CAPI", i: Target, c: "#3b82f6" },
  { t: "TikTok Pixel", i: Target, c: "#ff2d55" },
  { t: "UTMify", img: "/utmifylogo.png", c: "#f59e0b" },
  { t: "Xtracky", img: "/xtrackylogo.png", c: "#d97706" },
  { t: "WhatsApp", i: MessageCircle, c: "#22c55e" },
  { t: "Webhooks", i: Webhook, c: "#0ea5e9" },
  { t: "API REST", i: Key, c: "#a78bfa" },
];

function Integrations() {
  const row = [...INTEGRACOES, ...INTEGRACOES];
  return (
    <section className="spl-int">
      <Reveal><h2 className="spl-int-t">Integrações amplas e flexíveis</h2></Reveal>
      <div className="spl-marquee">
        <div className="spl-marquee-track">
          {row.map((x, k) => (
            <span key={k} className="spl-int-chip">
              <span className="spl-int-ic" style={{ background: x.c + "1f", color: x.c }}>
                {x.img ? <img src={x.img} alt="" /> : x.i ? <x.i size={16} /> : null}
              </span>
              {x.t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── "plataforma para quem quer escalar" + celular ───────────────────── */

function PhoneMock() {
  return (
    <div className="spl-phone-stage" aria-hidden>
      <div className="spl-phone-glow" />
      <div className="spl-phone">
        <div className="spl-phone-notch" />
        <div className="spl-phone-scr">
          <small>Faturamento hoje</small>
          <b>R$ 28.560,90</b>
          <div className="spl-phone-tabs"><span className="is-on">Hoje</span><span>7d</span><span>30d</span></div>
          <MiniChart />
          <div className="spl-phone-row"><span>Vendas</span><b>214</b></div>
          <div className="spl-phone-row"><span>Conversão</span><b>87,6%</b></div>
        </div>
      </div>
      <div className="spl-float spl-float-a"><small>Saldo</small><b>R$ 14.256,78</b><em>+12%</em></div>
      <div className="spl-float spl-float-b"><span className="spl-ring">78%</span><small>Aprovação</small></div>
      <div className="spl-float spl-float-c"><Bell size={13} /><div><b>Venda aprovada!</b><small>Pix · R$ 297,00</small></div></div>
    </div>
  );
}

function Platform() {
  return (
    <section className="spl-sec spl-dark" id="plataforma">
      <div className="spl-wrap spl-split">
        <Reveal>
          <h2 className="spl-h2 ta-l">
            Plataforma de pagamentos <span className="spl-grad">para quem quer escalar,</span> com mais performance.
          </h2>
          <p className="spl-lead ta-l">
            Com a ShadowPay você vende com alta conversão no Pix, acompanha tudo em tempo real e cresce com mais
            eficiência, sem precisar mudar sua estrutura.
          </p>
          <Link href={REGISTER} className="spl-btn spl-btn-primary spl-btn-lg">Escalar minhas vendas</Link>
        </Reveal>
        <Reveal delay={0.1}><PhoneMock /></Reveal>
      </div>
    </section>
  );
}

/* ── grid de recursos ────────────────────────────────────────────────── */

const RECURSOS = [
  { i: Zap, t: "Pix confirmado na hora", d: "Pagamento aprovado em segundos e o saldo cai na sua conta na mesma hora. Sem espera, sem D+30." },
  { i: Layers, t: "Checkout de alta conversão", d: "Builder completo: order bump, depoimentos, cronômetro, banner e cores da sua marca." },
  { i: Target, t: "Pixel + CAPI no servidor", d: "Meta e TikTok recebem cada compra direto do servidor. Rastreio que não se perde com bloqueador." },
  { i: BarChart3, t: "UTMify e Xtracky nativos", d: "Suas vendas chegam com as UTMs no seu rastreador, com reenvio automático se algo falhar." },
  { i: Lock, t: "Saque protegido com 2FA", d: "Seu dinheiro blindado: autenticação em dois fatores exigida no servidor em todo saque." },
  { i: Webhook, t: "API e Webhooks", d: "Integre com o seu sistema: chaves de API, webhooks em tempo real e IPs liberados por você." },
];

function Features() {
  return (
    <section className="spl-sec spl-dark spl-features" id="recursos">
      <div className="spl-wrap">
        <Reveal>
          <h2 className="spl-h2">Uma infraestrutura completa para quem <span className="spl-grad">escala de verdade.</span></h2>
        </Reveal>
        <div className="spl-feat-grid">
          {RECURSOS.map(({ i: I, t, d }, k) => (
            <Reveal key={t} delay={(k % 3) * 0.07}>
              <article className="spl-feat">
                <span className="spl-feat-ic"><I size={22} /></span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── seção clara: checkout + atendimento + infraestrutura ────────────── */

function CheckoutMock() {
  return (
    <div className="spl-ck-stage" aria-hidden>
      <div className="spl-ck-orb" />
      <div className="spl-ck-card">
        <div className="spl-ck-h"><b>Checkout</b><small><ShieldCheck size={11} /> Compra 100% segura</small></div>
        <small className="spl-ck-k">Total</small>
        <div className="spl-ck-total">R$ 338,82</div>
        <div className="spl-ck-methods">
          <span className="is-on"><QrCode size={13} /> Pix</span>
          <span><CreditCard size={13} /> Cartão</span>
        </div>
        <div className="spl-ck-qr"><QrCode size={56} strokeWidth={1.2} /><div><b>Pague com Pix</b><small>Aprovação imediata</small></div></div>
        <div className="spl-ck-btn">Pagar agora</div>
      </div>
      <div className="spl-ck-toast"><Check size={14} /> Pagamento aprovado</div>
    </div>
  );
}

function SupportMock() {
  return (
    <div className="spl-sup-stage" aria-hidden>
      <div className="spl-sup-card">
        <div className="spl-sup-head"><span className="spl-feat-ic sm"><Headphones size={16} /></span><div><b>Atendimento Premium</b><small>Seu gerente dedicado</small></div></div>
        {[
          { i: Rocket, t: "Atendimento prioritário", s: "Resposta rápida, sem fila" },
          { i: Headphones, t: "Suporte especializado", s: "Quem entende de lançamento" },
          { i: TrendingUp, t: "Otimização de performance", s: "Checkout e aprovação no talo" },
        ].map(({ i: I, t, s }) => (
          <div key={t} className="spl-sup-row"><span><I size={14} /></span><div><b>{t}</b><small>{s}</small></div></div>
        ))}
        <div className="spl-sup-foot"><img src="/logoshadowpay.png" alt="" /> Fale com seu gerente</div>
      </div>
    </div>
  );
}

const CHECK = (t: string) => (
  <li key={t}><Check size={15} /> {t}</li>
);

function LightBlock() {
  return (
    <section className="spl-light" id="checkout">
      <div className="spl-wrap">
        <div className="spl-split">
          <Reveal>
            <h2 className="spl-h2 ta-l is-dark"><span className="spl-grad-solid">Checkout otimizado</span> para aumentar sua conversão.</h2>
            <p className="spl-lead ta-l is-dark">
              Cada pagamento perdido é uma venda que não volta. Nosso checkout foi desenhado para aprovar mais,
              reduzir fricção na jornada de compra e entregar uma experiência de pagamento rápida no celular.
            </p>
            <ul className="spl-checks">{["Mais aprovações nas transações", "Menos fricção no pagamento", "Melhor experiência para o cliente"].map(CHECK)}</ul>
            <Link href={REGISTER} className="spl-btn spl-btn-primary spl-btn-lg">Otimizar meu checkout</Link>
          </Reveal>
          <Reveal delay={0.1}><CheckoutMock /></Reveal>
        </div>

        <div className="spl-split is-rev">
          <Reveal delay={0.1}><SupportMock /></Reveal>
          <Reveal>
            <h2 className="spl-h2 ta-l is-dark">Atendimento <span className="spl-grad-solid">Premium</span></h2>
            <p className="spl-lead ta-l is-dark">
              Operações acima de <b className="c-v">R$100K por mês</b> não podem depender de uma estrutura comum.
              Na ShadowPay você conta com estratégia, suporte especializado e uma operação preparada para alto volume.
            </p>
            <ul className="spl-checks">{["Atendimento prioritário", "Suporte especializado", "Otimização de performance"].map(CHECK)}</ul>
            <Link href={REGISTER} className="spl-btn spl-btn-primary spl-btn-lg">Falar com um gerente exclusivo</Link>
          </Reveal>
        </div>

        <Reveal><h2 className="spl-h2 is-dark spl-mt">Quem escala usa <span className="spl-grad-solid">infraestrutura forte.</span></h2></Reveal>
        <div className="spl-infra">
          {[
            { i: Globe2, t: "Presença em múltiplos segmentos.", d: "Infoprodutos, e-commerce e serviços numa operação simples, integrada e eficiente." },
            { i: QrCode, t: "Pix com confirmação automática.", d: "Reconciliação com o banco a cada minuto: nenhuma venda paga fica sem crédito." },
            { i: TrendingUp, t: "Operações escalando diariamente.", d: "Infraestrutura preparada para alto volume, estabilidade e crescimento contínuo." },
          ].map(({ i: I, t, d }, k) => (
            <Reveal key={t} delay={k * 0.08}>
              <article className="spl-infra-card">
                <div className="spl-infra-art"><span><I size={40} strokeWidth={1.4} /></span></div>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── premiações (carrossel) ──────────────────────────────────────────── */

// recortes de /dashboard-banner.webp (2000×667): cada card ~225×430
const PREMIOS = [
  { meta: "100K", premio: "AirPods 4ª geração", x: 30.1 },
  { meta: "500K", premio: "iPad", x: 43.7 },
  { meta: "1M", premio: "iPhone 18 Pro Max", x: 57.5 },
  { meta: "2M", premio: "Fix de R$ 10.000", x: 71.3 },
];

function Awards() {
  const [i, setI] = useState(2);
  const go = (d: number) => setI((v) => (v + d + PREMIOS.length) % PREMIOS.length);
  useEffect(() => {
    const t = setInterval(() => go(1), 4500);
    return () => clearInterval(t);
  }, [i]);
  return (
    <section className="spl-sec spl-dark spl-awards" id="premiacoes">
      <div className="spl-awards-glow" aria-hidden />
      <div className="spl-wrap">
        <Reveal>
          <h2 className="spl-h2">Suba de nível<br />com a <span className="spl-grad">ShadowPay</span></h2>
          <p className="spl-lead">Aqui, quem entrega resultado é reconhecido de verdade: premiações, experiências e status para quem vive o jogo.</p>
        </Reveal>
        <div className="spl-car">
          <button className="spl-car-nav l" onClick={() => go(-1)} aria-label="Anterior"><ChevronLeft size={20} /></button>
          <div className="spl-car-track">
            {PREMIOS.map((p, k) => {
              let off = k - i;
              if (off > 2) off -= PREMIOS.length;
              if (off < -2) off += PREMIOS.length;
              const abs = Math.abs(off);
              return (
                <motion.button
                  key={p.meta}
                  className="spl-award"
                  onClick={() => setI(k)}
                  animate={{ x: `${off * 78}%`, scale: abs === 0 ? 1 : 0.8, opacity: abs > 1 ? 0 : abs === 1 ? 0.45 : 1, filter: abs === 0 ? "blur(0px)" : "blur(2px)" }}
                  transition={{ type: "spring", stiffness: 220, damping: 28 }}
                  style={{ zIndex: 10 - abs }}
                  aria-label={`Premiação ${p.meta}: ${p.premio}`}
                >
                  <span className="spl-award-img" style={{ backgroundPosition: `${p.x}% 35.9%` }} />
                  <span className="spl-award-cap"><b>{p.meta}</b> {p.premio}</span>
                </motion.button>
              );
            })}
          </div>
          <button className="spl-car-nav r" onClick={() => go(1)} aria-label="Próximo"><ChevronRight size={20} /></button>
        </div>
        <div className="spl-dots">
          {PREMIOS.map((p, k) => <button key={p.meta} className={k === i ? "is-on" : ""} onClick={() => setI(k)} aria-label={p.meta} />)}
        </div>
      </div>
    </section>
  );
}

/* ── taxas ───────────────────────────────────────────────────────────── */

function Fees() {
  return (
    <section className="spl-sec spl-dark" id="taxas">
      <div className="spl-wrap">
        <Reveal>
          <h2 className="spl-h2">Taxas feitas para quem <span className="spl-grad">escala.</span></h2>
          <p className="spl-lead">Aqui, sua operação é tratada como negócio, não como teste.</p>
          <ul className="spl-ticks">{["Taxas competitivas", "Condições por volume", "Transparência total"].map(CHECK)}</ul>
        </Reveal>
        <Reveal delay={0.05}><Simulator ctaHref={REGISTER} /></Reveal>
      </div>
    </section>
  );
}

/* ── app (PWA) ───────────────────────────────────────────────────────── */

function AppSection() {
  const [canInstall, setCanInstall] = useState(false);
  useEffect(() => {
    setCanInstall(canPromptInstall());
    return onInstallChange(() => setCanInstall(canPromptInstall()));
  }, []);
  return (
    <section className="spl-sec spl-dark spl-app">
      <div className="spl-wrap spl-app-in">
        <Reveal>
          <div className="spl-app-art" aria-hidden>
            <img src="/logoshadowpay1.png" alt="" className="spl-app-ninja" />
            <div className="spl-notif n1"><img src="/logoshadowpay.png" alt="" /><div><b>Venda aprovada!</b><small>Pix · R$ 197,00</small></div></div>
            <div className="spl-notif n2"><img src="/logoshadowpay.png" alt="" /><div><b>Venda aprovada!</b><small>Pix · R$ 1.490,00</small></div></div>
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="spl-h2">App da ShadowPay</h2>
          <p className="spl-lead">
            Monitore vendas, acompanhe métricas e receba a notificação de cada venda aprovada em tempo real. Tudo no seu
            celular, sem ocupar espaço: instale direto pelo navegador.
          </p>
          <div className="spl-app-btns">
            {canInstall ? (
              <button className="spl-store" onClick={() => promptInstall()}><Download size={22} /><span><small>Instalar agora</small>App ShadowPay</span></button>
            ) : (
              <Link href={REGISTER} className="spl-store"><Smartphone size={22} /><span><small>Disponível para</small>Android e iPhone</span></Link>
            )}
            <Link href={LOGIN} className="spl-store is-ghost"><Bell size={22} /><span><small>Ative no painel</small>Notificações push</span></Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── FAQ ─────────────────────────────────────────────────────────────── */

const FAQ = [
  { q: "Quanto custa para usar a ShadowPay?", a: "Criar a conta é grátis e não tem mensalidade. Você só paga uma taxa por venda aprovada, e operações com volume alto têm condições especiais. Use o simulador acima para comparar com a sua plataforma atual." },
  { q: "Qual o prazo de recebimento na ShadowPay?", a: "No Pix o pagamento é confirmado em segundos e o valor fica disponível na hora. Você saca para sua chave Pix quando quiser, 24 horas por dia." },
  { q: "O que eu posso vender na ShadowPay?", a: "Infoprodutos (cursos, mentorias, e-books), produtos físicos e serviços. Produtos ilegais ou que violem os nossos Termos de Uso não são aceitos." },
  { q: "Como funciona o rastreio das minhas campanhas?", a: "Você conecta seu Pixel da Meta e do TikTok, UTMify ou Xtracky no painel. Cada venda é enviada direto do nosso servidor (API de Conversões), com as UTMs, sem depender do navegador do comprador." },
  { q: "Meu dinheiro está seguro?", a: "Sim. Todo saque exige autenticação em dois fatores (2FA), as chaves de API podem ser travadas por IP e cada venda é conferida automaticamente com o banco." },
  { q: "Comprei um produto e preciso de ajuda. O que fazer?", a: "Fale primeiro com o produtor pelo contato que veio no seu e-mail de compra. Se não tiver retorno, escreva para o nosso suporte informando o e-mail usado na compra." },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="spl-sec spl-dark" id="faq">
      <div className="spl-wrap spl-faq-wrap">
        <Reveal><h2 className="spl-h2">Perguntas <span className="spl-grad">Frequentes</span></h2></Reveal>
        <div className="spl-faq">
          {FAQ.map((f, k) => {
            const on = open === k;
            return (
              <div key={f.q} className={"spl-faq-item" + (on ? " is-on" : "")}>
                <button onClick={() => setOpen(on ? null : k)} aria-expanded={on}>
                  {f.q} <ChevronDown size={18} />
                </button>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                      <p>{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── CTA final + rodapé ──────────────────────────────────────────────── */

function FinalCta() {
  return (
    <section className="spl-wrap spl-final">
      <Reveal>
        <div className="spl-final-card">
          <div className="spl-final-glow" aria-hidden />
          <h2>Pronto para escalar sem travar?</h2>
          <p>Crie sua conta em minutos e comece a vender com Pix na hora.</p>
          <Link href={REGISTER} className="spl-btn spl-btn-light spl-btn-lg">Criar minha conta <ArrowRight size={16} /></Link>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="spl-foot">
      <div className="spl-wrap">
        <div className="spl-foot-grid">
          <div className="spl-foot-brand">
            <Logo />
            <p>Infraestrutura de pagamentos para quem vende no digital.</p>
          </div>
          <div><h4>Links rápidos</h4><a href="#faq">Dúvidas</a><a href="#recursos">Integrações</a><a href="#taxas">Condições e taxas</a></div>
          <div><h4>Conta</h4><Link href={REGISTER}>Criar conta</Link><Link href={LOGIN}>Entrar</Link></div>
          <div><h4>Políticas e termos</h4><Link href="/termos">Termos de uso</Link><Link href="/privacidade">Privacidade</Link></div>
        </div>
        <div className="spl-foot-bottom">
          <span>ShadowPay · Copyright ©{new Date().getFullYear()} · Todos os direitos reservados.</span>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="spl">
      <Head>
        <title>ShadowPay — Venda mais, receba na hora e escale sem travar</title>
        <meta name="description" content="Plataforma de pagamentos para produtores e afiliados: Pix confirmado na hora, checkout de alta conversão, Pixel + CAPI, UTMify e saque 24/7." />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: LANDING_CSS }} />
      <Nav />
      <main>
        <Hero />
        <Integrations />
        <Platform />
        <Features />
        <LightBlock />
        <Awards />
        <Fees />
        <AppSection />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
