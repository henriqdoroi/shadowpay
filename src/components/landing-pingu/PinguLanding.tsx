import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  motion, useScroll, useTransform, useMotionValue, useMotionValueEvent, AnimatePresence, type MotionValue,
} from "framer-motion";
import {
  ArrowRight, ArrowUpRight, Check, Headphones, Menu, X, Target, MessageCircle, Webhook, Key, Plug, BarChart3,
  Zap, Trophy, Plus, Lock, LockOpen, ShieldCheck, QrCode, ChevronDown, Bell,
} from "lucide-react";
import DashboardPanel from "./DashboardPanel";
import dynamic from "next/dynamic";
const HeroPhone3D = dynamic(() => import("@/components/three/HeroPhone3D"), { ssr: false });
import { PINGU_CSS } from "./pinguCss";
import { SHADOW } from "@/components/landing/Simulator";

const REGISTER = "/auth/jwt/register";
const LOGIN = "/auth/jwt/login";
const NINJA = "/shadow-ninja.png"; // logo oficial sem fundo
const ICON = "/shadow-ninja-icon.png"; // mesmo logo, recortado

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const brl = (v: number, c = 2) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: c, maximumFractionDigits: c });
const pctTxt = (v: number) => v.toFixed(2).replace(".", ",") + "%";

function useMobile(q = "(max-width: 760px)") {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = matchMedia(q);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [q]);
  return m;
}

/** Progresso 0→1 da rolagem dentro de uma cena presa (start start → end end).
 *  Calculado do scrollY: o useScroll({target}) do framer 12 vira ScrollTimeline
 *  nativa para opacity/filter e erra os valores dentro do position:sticky. */
function useSceneProgress(ref: React.RefObject<HTMLElement | null>) {
  const { scrollY } = useScroll();
  const box = useRef({ top: 0, len: 1 });
  useEffect(() => {
    const m = () => {
      const el = ref.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      box.current = { top, len: Math.max(1, el.offsetHeight - window.innerHeight) };
    };
    m();
    const ro = new ResizeObserver(m);
    if (ref.current) ro.observe(ref.current);
    ro.observe(document.body);
    window.addEventListener("resize", m);
    return () => { ro.disconnect(); window.removeEventListener("resize", m); };
  }, [ref]);
  return useTransform(scrollY, (y) => clamp((y - box.current.top) / box.current.len, 0, 1));
}

function Tag({ n, children }: { n: string; children: React.ReactNode }) {
  return <span className="sx-tag"><b>{n}</b>{children}</span>;
}

function Up({ children, d = 0, className = "" }: { children: React.ReactNode; d?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7, delay: d, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}

function Logo() {
  return (
    <Link href="/" className="sx-logo" aria-label="ShadowPay">
      <img src={ICON} alt="" width={34} height={34} />
      <span>Shadow<i>Pay</i></span>
    </Link>
  );
}

/* ── NAV: barra cheia com sublinhado deslizante ──────────────────────── */

const LINKS = [
  ["topo", "Início"], ["integracoes", "Integrações"], ["painel", "Painel"], ["porque", "Recursos"], ["premiacoes", "Premiações"], ["faq", "Dúvidas"],
] as const;

function Nav() {
  const [active, setActive] = useState("topo");
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => {
      setSolid(window.scrollY > 20);
      const y = window.scrollY + window.innerHeight * 0.35;
      let cur = "topo", best = -1;
      for (const [id] of LINKS) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= y && el.offsetTop > best) { best = el.offsetTop; cur = id; }
      }
      setActive(cur);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={"sx-nav" + (solid || open ? " solid" : "")}>
      <div className="sx-wrap sx-nav-in">
        <Logo />
        <nav className="sx-links">
          {LINKS.map(([id, t]) => (
            <a key={id} href={`#${id}`} className={active === id ? "on" : ""}>
              {t}
              {active === id && <motion.i layoutId="sx-underline" className="sx-ul" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
            </a>
          ))}
        </nav>
        <div className="sx-acts">
          <Link href={LOGIN} className="sx-txt">Entrar</Link>
          <Link href={REGISTER} className="sx-btn sm">Criar conta</Link>
        </div>
        <button className="sx-burger" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav className="sx-mnav" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div>
              {LINKS.map(([id, t]) => <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>{t}</a>)}
              <div className="sx-mnav-cta">
                <Link href={LOGIN} className="sx-btn ghost">Entrar</Link>
                <Link href={REGISTER} className="sx-btn">Criar conta</Link>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ── HERO: dividido, ninja oficial + feed de vendas ao vivo ──────────── */

function Hero() {
  const { scrollY } = useScroll();
  const ninjaY = useTransform(scrollY, (v) => clamp(v, 0, 900) * 0.18);
  const r = SHADOW.pix;
  return (
    <section id="topo" className="sx-hero">
      <div className="sx-fog f1" aria-hidden /><div className="sx-fog f2" aria-hidden /><div className="sx-slashbg" aria-hidden />
      <div className="sx-wrap sx-hero-in">
        <div className="sx-hero-txt">
          <motion.span className="sx-chip" initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <Zap size={13} /> Gateway Pix · confirmação em segundos
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}>
            Pagamentos que trabalham <span>nas sombras.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.18 }}>
            Enquanto você escala, a ShadowPay aprova o Pix, confere cada venda com o banco e deixa o saldo pronto pra
            sacar — sem barulho, sem travar no pico.
          </motion.p>
          <motion.div className="sx-cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.26 }}>
            <Link href={REGISTER} className="sx-btn lg">Criar conta grátis <ArrowRight size={17} /></Link>
            <a href="#taxas" className="sx-btn ghost lg">Ver taxas</a>
          </motion.div>
          <motion.dl className="sx-stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.4 }}>
            <div><dt>{pctTxt(r.taxa)}</dt><dd>taxa Pix por venda</dd></div>
            <div><dt>D+0</dt><dd>saldo na hora</dd></div>
            <div><dt>24/7</dt><dd>saque via Pix</dd></div>
          </motion.dl>
        </div>
        <motion.div className="sx-hero-art" style={{ y: ninjaY }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
          <div className="sx-halo" />
          {/* iPhone 18 Pro Max + ninja em 3D (WebGL) */}
          <div className="sx-hero-3d"><HeroPhone3D /></div>
        </motion.div>
      </div>
      <a href="#integracoes" className="sx-scroll" aria-label="Rolar"><ChevronDown size={18} /></a>
    </section>
  );
}

/* ── INTEGRAÇÕES: plataformas em órbita ao redor do ninja ────────────── */

type PlatT = { t: string; img?: string; icon?: React.ElementType; c: string };
const PLATS: PlatT[] = [
  { t: "UTMify", img: "/utmifylogo.png", c: "#f59e0b" },
  { t: "Meta CAPI", icon: Target, c: "#3b82f6" },
  { t: "Webhooks", icon: Webhook, c: "#38bdf8" },
  { t: "WhatsApp", icon: MessageCircle, c: "#22c55e" },
  { t: "Xtracky", img: "/xtrackylogo.png", c: "#f97316" },
  { t: "TikTok Pixel", icon: Target, c: "#ff2d55" },
  { t: "API REST", icon: Key, c: "#c4b5fd" },
  { t: "Pix", img: "/pix-icon.svg", c: "#32bcad" },
];

function OrbitChip({ p, k, mobile }: { p: MotionValue<number>; k: number; mobile: boolean }) {
  const inner = k % 2 === 0;
  const n = PLATS.length / 2;
  const base = (Math.floor(k / 2) / n) * Math.PI * 2 + (inner ? 0 : Math.PI / n);
  const dir = inner ? 1 : -1;
  const rx = mobile ? (inner ? 30 : 40) : (inner ? 27 : 44);
  const ry = mobile ? (inner ? 22 : 36) : (inner ? 24 : 40);
  const theta = useTransform(p, (v) => base + dir * v * Math.PI * 1.1);
  const left = useTransform(theta, (t) => `${50 + Math.cos(t) * rx}%`);
  const top = useTransform(theta, (t) => `${50 + Math.sin(t) * ry}%`);
  const a = 0.04 + k * 0.035;
  const reveal = useTransform(p, [a, a + 0.08], [0, 1]);
  const opacity = useTransform([reveal, theta] as MotionValue<number>[], ([r, t]) => (r as number) * (0.5 + 0.5 * ((Math.sin(t as number) + 1) / 2)));
  const scale = useTransform(theta, (t) => 0.82 + 0.18 * ((Math.sin(t) + 1) / 2));
  const zIndex = useTransform(theta, (t) => (Math.sin(t) > 0 ? 4 : 1));
  const pl = PLATS[k]!;
  return (
    <motion.div className="sx-orb-chip" style={{ left, top, opacity, scale, zIndex }}>
      <span className="ic" style={{ background: pl.c + "24", color: pl.c }}>
        {pl.img ? <img src={pl.img} alt="" /> : pl.icon ? <pl.icon size={17} /> : null}
      </span>
      <span className="t">{pl.t}</span>
    </motion.div>
  );
}

function Integrations() {
  const ref = useRef<HTMLElement>(null);
  const mobile = useMobile();
  const p = useSceneProgress(ref);
  const tilt = useTransform(p, [0, 1], [-14, 14]);
  const ninjaScale = useTransform(p, [0, 0.15], [0.7, 1]);
  const ninjaOp = useTransform(p, [0, 0.1], [0, 1]);
  const count = useTransform(p, (v) => Math.round(clamp((v - 0.04) / 0.32, 0, 1) * PLATS.length));
  const [shown, setShown] = useState(0);
  useMotionValueEvent(count, "change", (v) => setShown(v));
  return (
    <section id="integracoes" ref={ref} className="sx-scene sx-integ">
      <div className="sx-sticky">
        <div className="sx-wrap sx-integ-grid">
          <div className="sx-integ-txt">
            <Tag n="01">Integrações</Tag>
            <h2 className="sx-h2">Tudo que você já usa, <span>orbitando</span> a sua operação.</h2>
            <p className="sx-sub">Rastreio, mensagens e o seu próprio sistema conectados direto no servidor da Shadow — cada venda chega certa, com UTM, mesmo com bloqueador no navegador.</p>
            <div className="sx-counter"><b>{String(shown).padStart(2, "0")}</b><span>/ {String(PLATS.length).padStart(2, "0")} integrações nativas</span></div>
          </div>
          <div className="sx-orbit">
            <svg className="sx-orbit-rings" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <ellipse cx="50" cy="50" rx={mobile ? 30 : 27} ry={mobile ? 22 : 24} />
              <ellipse cx="50" cy="50" rx={mobile ? 40 : 44} ry={mobile ? 36 : 40} />
            </svg>
            <motion.div className="sx-orbit-core" style={{ rotateY: tilt, scale: ninjaScale, opacity: ninjaOp }}>
              <img src={NINJA} alt="" />
            </motion.div>
            {PLATS.map((_, k) => <OrbitChip key={k} p={p} k={k} mobile={mobile} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── PAINEL: corte de katana revela o dashboard ──────────────────────── */

const DASH_FEATS = [
  [Plug, "Integrações em 1 clique", "Pixel, UTMify, Xtracky e webhooks."],
  [BarChart3, "Relatórios por período", "Conversão, aprovação e ticket médio."],
  [Zap, "Saque direto do painel", "Saldo disponível e saque via Pix."],
  [Trophy, "Metas e premiações", "Seu progresso até o próximo prêmio."],
] as const;

function Panel() {
  const ref = useRef<HTMLElement>(null);
  const winRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const p = useSceneProgress(ref);
  const [fit, setFit] = useState(1);
  const maxScroll = useMotionValue(0);

  useEffect(() => {
    const measure = () => {
      const win = winRef.current, panel = panelRef.current;
      if (!win || !panel) return;
      const cs = getComputedStyle(win);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const f = (win.clientWidth - padX) / 1100;
      setFit(f);
      maxScroll.set(Math.max(0, panel.offsetHeight * f - (win.clientHeight - padY)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (winRef.current) ro.observe(winRef.current);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [maxScroll]);

  const capOp = useTransform(p, [0, 0.12, 0.2], [1, 1, 0]);
  const capX = useTransform(p, [0.1, 0.22], [0, -60]);
  const ninjaOp = useTransform(p, [0.1, 0.2], [1, 0]);
  const ninjaRot = useTransform(p, [0, 0.2], [0, -12]);
  const slash = useTransform(p, [0.12, 0.2], [0, 1]);
  const slashOp = useTransform(p, [0.12, 0.14, 0.26, 0.3], [0, 1, 1, 0]);
  // faixa diagonal que se abre a partir do corte
  const clip = useTransform(p, (v) => {
    const k = clamp((v - 0.18) / 0.16, 0, 1) * 80;
    return `polygon(${58 - k}% 0%, ${58 + k + 4}% 0%, ${42 + k + 4}% 100%, ${42 - k}% 100%)`;
  });
  const winOp = useTransform(p, [0.17, 0.2], [0, 1]);
  const scrollIn = useTransform(p, (v) => -clamp((v - 0.42) / 0.5, 0, 1) * maxScroll.get());

  return (
    <section id="painel" ref={ref} className="sx-scene sx-panel">
      <div className="sx-sticky">
        <motion.div className="sx-panel-cap" style={{ opacity: capOp, x: capX }}>
          <Tag n="02">Painel</Tag>
          <h2 className="sx-h2">Um golpe de vista e você <span>sabe tudo.</span></h2>
          <p className="sx-sub">Vendas, aprovação, saldo e metas num só lugar, atualizados em tempo real. Role pra abrir o painel.</p>
          <ul className="sx-feats">
            {DASH_FEATS.map(([I, t, d]) => (
              <li key={t}><span><I size={15} /></span><div><b>{t}</b><small>{d}</small></div></li>
            ))}
          </ul>
        </motion.div>
        <motion.img src={NINJA} alt="" className="sx-panel-ninja" style={{ opacity: ninjaOp, rotate: ninjaRot }} />
        <motion.div className="sx-katana" style={{ scaleX: slash, opacity: slashOp }} aria-hidden />

        <motion.div className="sx-window" style={{ clipPath: clip, opacity: winOp }}>
          <div className="sx-winbar"><span className="dots"><i /><i /><i /></span><span className="url"><Lock size={10} /> app.shadowpay.com.br</span></div>
          <div className="sx-view" ref={winRef}>
            <motion.div style={{ y: scrollIn }}>
              <div ref={panelRef} style={{ width: 1100, transform: `scale(${fit})`, transformOrigin: "0 0" }}>
                <DashboardPanel />
              </div>
            </motion.div>
          </div>
          <Link href={REGISTER} className="sx-float-cta"><ArrowUpRight size={15} /> Abrir meu painel</Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ── RECURSOS (bento) ────────────────────────────────────────────────── */

const SWATCHES = ["#7c3aed", "#0ea5e9", "#16a34a", "#e11d48"];

function CheckoutBuilder() {
  const [color, setColor] = useState(SWATCHES[0]!);
  const [radius, setRadius] = useState(12);
  const [steps, setSteps] = useState(true);
  return (
    <div className="sx-ckb">
      <div className="sx-ckb-ed">
        <div className="sx-ckb-h"><b>Editor do checkout</b><span className="live">● publicado</span></div>
        <div className="row"><span>Cor da marca</span>
          <div className="sw">{SWATCHES.map((c) => <button key={c} style={{ background: c }} className={c === color ? "on" : ""} onClick={() => setColor(c)} aria-label={c} />)}</div>
        </div>
        <div className="row"><span>Cantos</span><b>{radius}px</b></div>
        <input type="range" min={0} max={22} value={radius} onChange={(e) => setRadius(+e.target.value)} className="sx-range" style={{ ["--p" as string]: (radius / 22) * 100 + "%" }} />
        <label className="row tg"><span>Etapas numeradas</span><input type="checkbox" checked={steps} onChange={(e) => setSteps(e.target.checked)} /><i /></label>
        <div className="blks">{["Cronômetro", "Depoimentos", "Order bump", "Selos"].map((b) => <span key={b}><Plus size={11} />{b}</span>)}</div>
      </div>
      <div className="sx-ckb-pv" style={{ ["--ck" as string]: color, ["--r" as string]: radius + "px" }}>
        <div className="tm">Oferta acaba em <b>09:59</b></div>
        <div className="pr"><span className="th" /><div><b>Mentoria Escala</b><small>Turma de outubro</small></div><b>R$ 497</b></div>
        <div className="st">{steps && <i>1</i>}Seus dados</div>
        <div className="in">Nome completo</div>
        <div className="st">{steps && <i>2</i>}Pagamento</div>
        <div className="px"><QrCode size={14} /> Pix <small>aprova na hora</small></div>
        <div className="ob"><Check size={12} /> Planilha de Escala <b>+ R$ 47</b></div>
        <div className="pay">Pagar com Pix</div>
        <small className="sec"><ShieldCheck size={11} /> Pagamento protegido</small>
      </div>
    </div>
  );
}

const CHAT: { me: boolean; t: string }[] = [
  { me: true, t: "Meu Pix não caiu." },
  { me: false, t: "Conferi aqui: confirmado às 14:32 e o saldo já está disponível no seu painel. ✅" },
  { me: true, t: "Show, já vou sacar!" },
];

function SupportChat() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((v) => (v >= CHAT.length + 2 ? 0 : v + 1)), 1600);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="sx-chat">
      <div className="sx-chat-h"><img src={ICON} alt="" /><div><b>Time Shadow</b><small><i /> respondendo agora</small></div><Headphones size={16} className="hp" /></div>
      <div className="sx-chat-body">
        <AnimatePresence>
          {CHAT.slice(0, Math.min(n, CHAT.length)).map((m, k) => (
            <motion.div key={k} className={"msg" + (m.me ? " me" : "")} initial={{ opacity: 0, x: m.me ? 16 : -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>{m.t}</motion.div>
          ))}
        </AnimatePresence>
        {n < CHAT.length && CHAT[n] && !CHAT[n]!.me && <div className="typing"><i /><i /><i /></div>}
      </div>
    </div>
  );
}

function WithdrawFlow() {
  const steps = ["Venda aprovada", "Saldo disponível", "Código 2FA", "Pix enviado"];
  const [s, setS] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setS((v) => (v + 1) % (steps.length + 1)), 1100);
    return () => clearInterval(t);
  }, [steps.length]);
  return (
    <ol className="sx-flow">
      {steps.map((t, k) => (
        <li key={t} className={k < s ? "done" : k === s ? "now" : ""}>
          <span>{k < s ? <Check size={13} /> : k + 1}</span>{t}
        </li>
      ))}
    </ol>
  );
}

function FeeSim() {
  const [valor, setValor] = useState(197);
  const [qtd, setQtd] = useState(500);
  const r = SHADOW.pix;
  const fee = valor * (r.taxa / 100) + r.fixo;
  const liq = valor - fee;
  return (
    <div className="sx-fee">
      <label><span>Ticket médio <b>{brl(valor)}</b></span>
        <input type="range" min={10} max={2000} value={valor} onChange={(e) => setValor(+e.target.value)} className="sx-range" style={{ ["--p" as string]: ((valor - 10) / 1990) * 100 + "%" }} /></label>
      <label><span>Vendas por mês <b>{qtd.toLocaleString("pt-BR")}</b></span>
        <input type="range" min={10} max={5000} step={10} value={qtd} onChange={(e) => setQtd(+e.target.value)} className="sx-range" style={{ ["--p" as string]: ((qtd - 10) / 4990) * 100 + "%" }} /></label>
      <div className="out">
        <div><small>Taxa por venda</small><b className="neg">{brl(fee)}</b></div>
        <div><small>Fica com você</small><b>{brl(liq)}</b></div>
        <div className="big"><small>No mês</small><b>{brl(liq * qtd)}</b></div>
      </div>
    </div>
  );
}

function Features() {
  const r = SHADOW.pix;
  return (
    <section id="porque" className="sx-sec">
      <div className="sx-wrap">
        <Up><Tag n="03">Recursos</Tag></Up>
        <Up d={0.05}><h2 className="sx-h2 c">Feito pra quem não pode <span>perder venda.</span></h2></Up>
        <div className="sx-bento">
          <Up className="b1"><article className="sx-card hov">
            <header><em>Checkout</em><h3>Seu checkout, sua marca, no ar em minutos.</h3></header>
            <CheckoutBuilder />
          </article></Up>
          <Up className="b2" d={0.06}><article className="sx-card hov">
            <header><em>Suporte</em><h3>Gente de verdade do outro lado.</h3></header>
            <SupportChat />
          </article></Up>
          <Up className="b3"><article className="sx-card hov">
            <header><em>Saque</em><h3>Do Pix aprovado ao saque, protegido por 2FA.</h3></header>
            <WithdrawFlow />
          </article></Up>
          <Up className="b4" d={0.06}><article className="sx-card hov" id="taxas">
            <header><em>Taxa Pix</em><h3><span className="hl">{pctTxt(r.taxa)}</span>{r.fixo ? ` + ${brl(r.fixo)}` : ""} por venda aprovada.</h3></header>
            <FeeSim />
            <a href="#contato" className="sx-more">Volume alto? Condição sob medida <ArrowRight size={13} /></a>
          </article></Up>
        </div>
      </div>
    </section>
  );
}

/* ── PREMIAÇÕES: contador de faturamento que desbloqueia prêmios ─────── */

// recortes de /dashboard-banner.webp (arte oficial da campanha)
const PRIZES = [
  { at: 100_000, k: "100K", premio: "AirPods 4ª geração", x: 30.1 },
  { at: 500_000, k: "500K", premio: "iPad", x: 43.7 },
  { at: 1_000_000, k: "1M", premio: "iPhone 18 Pro Max", x: 57.5 },
  { at: 2_000_000, k: "2M", premio: "Fix de R$ 10.000", x: 71.3 },
];
const MAX = 2_200_000;

function Awards() {
  const ref = useRef<HTMLElement>(null);
  const p = useSceneProgress(ref);
  const val = useTransform(p, (v) => clamp((v - 0.05) / 0.85, 0, 1) * MAX);
  const [money, setMoney] = useState(0);
  useMotionValueEvent(val, "change", (v) => setMoney(Math.round(v / 1000) * 1000));
  const fill = useTransform(val, (v) => `${(v / MAX) * 100}%`);
  const next = PRIZES.find((x) => money < x.at);
  return (
    <section id="premiacoes" ref={ref} className="sx-scene sx-awards">
      <div className="sx-sticky">
        <div className="sx-wrap sx-aw">
          <div className="sx-aw-l">
            <Tag n="04">Premiações</Tag>
            <h2 className="sx-h2">Fature. <span>Desbloqueie.</span></h2>
            <p className="sx-sub">Cada marco de faturamento libera um prêmio de verdade. Campanha de 01/10 a 31/12/2026.</p>
            <div className="sx-meter">
              <small>Faturamento simulado</small>
              <b>{brl(money, 0)}</b>
              <div className="trk"><motion.i style={{ width: fill }} />
                {PRIZES.map((x) => <span key={x.k} className={money >= x.at ? "on" : ""} style={{ left: `${(x.at / MAX) * 100}%` }}><em>{x.k}</em></span>)}
              </div>
              <p className="nx">{next ? <>Próximo: <b>{next.premio}</b> em {brl(next.at - money, 0)}</> : <>Todos os prêmios desbloqueados 🏆</>}</p>
            </div>
          </div>
          <div className="sx-aw-grid">
            {PRIZES.map((x) => {
              const on = money >= x.at;
              return (
                <div key={x.k} className={"sx-prize" + (on ? " on" : "")}>
                  <span className="art" style={{ backgroundPosition: `${x.x}% 35.9%` }} />
                  <span className="lock">{on ? <LockOpen size={16} /> : <Lock size={16} />}</span>
                  <div className="cap"><b>{x.k}</b><small>{on ? "Desbloqueado" : x.premio}</small></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── CTA + FAQ + rodapé ──────────────────────────────────────────────── */

function BigCta() {
  return (
    <section id="contato" className="sx-wrap sx-cta-sec">
      <Up>
        <div className="sx-cta-card">
          <img src={NINJA} alt="" className="nj" />
          <div>
            <h2>Fatura mais de <span>R$ 100 mil</span> por mês?</h2>
            <p>Gerente dedicado, taxa sob medida e prioridade no atendimento para operações de alto volume.</p>
          </div>
          <Link href={REGISTER} className="sx-btn lg light">Quero condições especiais <ArrowRight size={17} /></Link>
        </div>
      </Up>
    </section>
  );
}

const FAQ = [
  ["Para quem é a ShadowPay?", "Infoprodutores, lojas virtuais e operações de alto volume que vendem online e não podem parar no pico de vendas."],
  ["Como funciona o saque?", "Você saca via Pix para a sua chave, 24 horas por dia, direto do painel. Todo saque pede o código de autenticação em dois fatores (2FA)."],
  ["Em quanto tempo o dinheiro fica disponível?", "Assim que o Pix é aprovado — em segundos — o saldo aparece no painel e já pode ser sacado. Cada venda também é conferida automaticamente com o banco."],
  ["Tem mensalidade ou taxa de setup?", "Não. Você paga só uma taxa por venda aprovada. Para volume alto, um gerente monta uma proposta sob medida."],
  ["Como é o suporte?", "Atendimento humano, com um gerente acompanhando a sua operação de perto e respondendo quando você precisa."],
  ["Consigo integrar com o que já uso?", "Sim: Pixel da Meta e TikTok (API de Conversões), UTMify, Xtracky e WhatsApp em poucos cliques, além de API e webhooks para integrações próprias."],
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="sx-wrap sx-faq">
      <Up><Tag n="05">Dúvidas</Tag></Up>
      <Up d={0.05}><h2 className="sx-h2 c">Perguntas <span>frequentes</span></h2></Up>
      <div className="sx-faq-grid">
        {FAQ.map(([q, a], k) => {
          const on = open === k;
          return (
            <div key={q} className={"sx-fq" + (on ? " on" : "")}>
              <button onClick={() => setOpen(on ? null : k)} aria-expanded={on}>{q}<ChevronDown size={17} /></button>
              <AnimatePresence initial={false}>
                {on && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                    <p>{a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="sx-foot">
      <div className="sx-wrap">
        <div className="g">
          <div className="b"><Logo /><p>Gateway de pagamentos Pix com checkout próprio, saque 24/7 e suporte de verdade.</p></div>
          <div><h4>Navegação</h4>{LINKS.map(([id, t]) => <a key={id} href={`#${id}`}>{t}</a>)}</div>
          <div><h4>Conta</h4><Link href={LOGIN}>Entrar</Link><Link href={REGISTER}>Criar conta</Link></div>
          <div><h4>Legal</h4><Link href="/termos">Termos de uso</Link><Link href="/privacidade">Privacidade</Link></div>
        </div>
        <div className="bt"><span>© {new Date().getFullYear()} ShadowPay. Todos os direitos reservados.</span><span><Bell size={12} /> Pagamentos via Pix · Saque 24/7</span></div>
      </div>
    </footer>
  );
}

export default function PinguLanding() {
  // brilho que segue o cursor nos cartões .hov
  useEffect(() => {
    const on = (e: PointerEvent) => {
      const h = (e.target as HTMLElement)?.closest?.(".hov") as HTMLElement | null;
      if (!h) return;
      const r = h.getBoundingClientRect();
      h.style.setProperty("--x", e.clientX - r.left + "px");
      h.style.setProperty("--y", e.clientY - r.top + "px");
    };
    document.addEventListener("pointermove", on, { passive: true });
    return () => document.removeEventListener("pointermove", on);
  }, []);
  return (
    <div className="sx">
      <Head>
        <title>ShadowPay | Gateway de Pagamentos Pix</title>
        <meta name="description" content="Pix aprovado na hora, saque 24/7, checkout de alta conversão e integrações nativas. A ShadowPay trabalha nas sombras enquanto você escala." />
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=clash-display@500,600&f[]=satoshi@400,500,700&display=swap" />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: PINGU_CSS }} />
      <div className="sx-grain" aria-hidden />
      <Nav />
      <main>
        <Hero />
        <Integrations />
        <Panel />
        <Features />
        <Awards />
        <BigCta />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
