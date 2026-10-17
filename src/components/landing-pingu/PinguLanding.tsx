import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Outfit, Geist_Mono } from "next/font/google";
import {
  motion, useScroll, useTransform, useMotionValue, useMotionValueEvent, useSpring, AnimatePresence,
  type MotionValue,
} from "framer-motion";
import {
  ArrowRight, ArrowDown, Check, Headphones, LogIn, Menu, X, Target, MessageCircle, Webhook, Key,
  Plug, BarChart3, Zap, Trophy, Plus, Lock, ShieldCheck, QrCode,
} from "lucide-react";
import { NinjaDefs, NinjaFace, NinjaSculpture } from "./NinjaMark";
import DashboardPanel from "./DashboardPanel";
import { PINGU_CSS } from "./pinguCss";
import { SHADOW } from "@/components/landing/Simulator";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--spp-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--spp-mono", display: "swap" });

const REGISTER = "/auth/jwt/register";
const LOGIN = "/auth/jwt/login";

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const brl = (v: number, c = 2) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: c, maximumFractionDigits: c });

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

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="spp-eb"><i />{children}<i /></span>;
}

function Up({ children, d = 0, className = "" }: { children: React.ReactNode; d?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 26, filter: "blur(8px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7, delay: d, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

function Logo() {
  return (
    <Link href="/" className="spp-logo" aria-label="ShadowPay">
      <svg viewBox="0 0 200 200" width="26" height="26"><NinjaFace /></svg>
      <span>Shadow<b>Pay</b></span>
    </Link>
  );
}

/* ── NAV ─────────────────────────────────────────────────────────────── */

const LINKS = [
  ["topo", "Início"], ["integracoes", "Integrações"], ["premiacoes", "Premiações"], ["porque", "Por que nos escolher"], ["faq", "FAQ"],
] as const;

function Nav() {
  const [active, setActive] = useState("topo");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const els = LINKS.map(([id]) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const on = () => {
      const y = window.scrollY + window.innerHeight * 0.35;
      let cur = "topo", best = -1;
      for (const el of els) if (el.offsetTop <= y && el.offsetTop > best) { best = el.offsetTop; cur = el.id; }
      setActive(cur);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className="spp-top">
      <div className="spp-pill">
        <Logo />
        <nav className="spp-links">
          {LINKS.map(([id, t]) => (
            <a key={id} href={`#${id}`} className={active === id ? "on" : ""}>{t}</a>
          ))}
        </nav>
        <div className="spp-acts">
          <Link href={LOGIN} className="spp-btn ghost sm"><LogIn size={14} /> Fazer login</Link>
          <Link href={REGISTER} className="spp-btn sm">Abrir conta <span className="spp-arr"><ArrowRight size={13} /></span></Link>
        </div>
        <button className="spp-burger" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div className="spp-mnav" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {LINKS.map(([id, t]) => <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>{t}</a>)}
            <Link href={LOGIN} className="spp-btn ghost">Fazer login</Link>
            <Link href={REGISTER} className="spp-btn">Abrir conta</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ── HERO ────────────────────────────────────────────────────────────── */

function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [150, 650], [0, -120]);
  const op = useTransform(scrollY, [150, 600], [1, 0]);
  return (
    <section id="topo" className="spp-hero">
      <svg className="spp-streaks" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <linearGradient id="stk" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#c4b5fd" stopOpacity="0" />
            <stop offset=".5" stopColor="#a78bfa" stopOpacity=".55" />
            <stop offset="1" stopColor="#7c3aed" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M${700 + i * 60} -40 C ${1500 - i * 40} ${180 + i * 50}, ${1100 - i * 70} ${560 + i * 30}, ${-60 + i * 30} ${980 - i * 20}`}
            stroke="url(#stk)" strokeWidth={1.2} fill="none" className="spp-streak" style={{ animationDelay: `${-i * 1.6}s` }} />
        ))}
        <circle cx="460" cy="620" r="380" fill="none" stroke="rgba(167,139,250,.12)" />
      </svg>
      <motion.div className="spp-hero-in" style={{ y, opacity: op }}>
        <motion.span className="spp-badge" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <i /> Segurança, estabilidade e controle em cada transação
        </motion.span>
        <motion.h1 initial={{ opacity: 0, y: 20, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.8, delay: 0.08 }}>
          Silencioso no pico.<br />Letal na <em>conversão.</em>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.18 }}>
          Pix aprovado na hora, saque 24/7 e uma estrutura que segura o volume enquanto o mercado trava. Feita para
          operações que não podem parar.
        </motion.p>
        <motion.div className="spp-cta" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.26 }}>
          <Link href={REGISTER} className="spp-btn lg">Criar minha conta <span className="spp-arr"><ArrowRight size={15} /></span></Link>
          <a href="#contato" className="spp-btn ghost lg">Falar com especialista <span className="spp-arr g"><Headphones size={14} /></span></a>
        </motion.div>
        <motion.ul className="spp-checks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.4 }}>
          <li><Check size={14} /> Sem taxa de setup</li>
          <li><Check size={14} /> Pix confirmado na hora</li>
          <li><Check size={14} /> Saque via Pix 24/7</li>
        </motion.ul>
        <a href="#integracoes" className="spp-down" aria-label="Rolar"><ArrowDown size={16} /></a>
      </motion.div>
    </section>
  );
}

/* ── CENA 2: integrações (escultura 3D + plataformas ligadas ao centro) ── */

type PlatT = { t: string; img?: string; icon?: React.ElementType; c: string };
const PLATS: PlatT[] = [
  { t: "UTMify", img: "/utmifylogo.png", c: "#f59e0b" },
  { t: "Xtracky", img: "/xtrackylogo.png", c: "#f97316" },
  { t: "Meta CAPI", icon: Target, c: "#3b82f6" },
  { t: "TikTok Pixel", icon: Target, c: "#ff2d55" },
  { t: "WhatsApp", icon: MessageCircle, c: "#22c55e" },
  { t: "Webhooks", icon: Webhook, c: "#38bdf8" },
  { t: "API REST", icon: Key, c: "#c4b5fd" },
];

function Plat({ p, k, x, y, hub, W, H }: { p: MotionValue<number>; k: number; x: number; y: number; hub: { x: number; y: number }; W: number; H: number }) {
  const a = 0.1 + k * 0.06;
  const op = useTransform(p, [a, a + 0.09], [0, 1]);
  const sc = useTransform(p, [a, a + 0.09], [0.7, 1]);
  const blur = useTransform(p, [a, a + 0.09], ["blur(10px)", "blur(0px)"]);
  const draw = useTransform(p, [a + 0.06, a + 0.14], [100, 0]);
  const flowOp = useTransform(draw, [10, 0], [0, 1]);
  const pl = PLATS[k]!;
  const ang = Math.atan2(y - hub.y, x - hub.x);
  const mx = (x + hub.x) / 2 + Math.sin(ang) * 40;
  const my = (y + hub.y) / 2 - Math.cos(ang) * 40;
  const d = `M${x} ${y} Q${mx} ${my} ${hub.x} ${hub.y}`;
  return (
    <>
      <svg className="spp-lines" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
        <motion.path d={d} pathLength={100} className="base" style={{ strokeDashoffset: draw }} />
        <motion.path d={d} pathLength={100} className="flow" style={{ opacity: flowOp, animationDuration: `${1.7 + k * 0.17}s` }} />
      </svg>
      <motion.div className="spp-plat hov" style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, opacity: op, scale: sc, filter: blur }}>
        <span className="ic" style={{ background: pl.c + "22", color: pl.c }}>
          {pl.img ? <img src={pl.img} alt="" /> : pl.icon ? <pl.icon size={18} /> : null}
        </span>
        {pl.t}
      </motion.div>
    </>
  );
}

function Integrations() {
  const ref = useRef<HTMLElement>(null);
  const mobile = useMobile();
  const p = useSceneProgress(ref);
  const rotY = useTransform(p, [0, 1], [-50, 50]);
  const rotX = useTransform(p, [0, 1], [12, -6]);
  const sc = useTransform(p, [0, 0.14], [0.6, 1]);
  const s3dOp = useTransform(p, [0, 0.12], [0, 1]);
  const ringRot = useTransform(p, [0, 1], [0, 90]);
  const footOp = useTransform(p, [0.6, 0.7], [0, 1]);

  const W = mobile ? 360 : 1100, H = mobile ? 560 : 560;
  const hub = { x: W / 2, y: H / 2 };
  const pos = PLATS.map((_, k) => {
    if (mobile) {
      const half = Math.ceil(PLATS.length / 2), right = k < half, row = right ? k : PLATS.length - 1 - k;
      return { x: right ? W - 72 : 72, y: 70 + row * ((H - 140) / (half - 1)) };
    }
    const a = -Math.PI / 2 + ((k + 0.5) / PLATS.length) * Math.PI * 2;
    return { x: hub.x + Math.cos(a) * 440, y: hub.y + Math.sin(a) * 215 };
  });

  return (
    <section id="integracoes" ref={ref} className="spp-scene spp-integ">
      <div className="spp-sticky">
        <div className="spp-integ-head">
          <Up><Eyebrow>INTEGRAÇÕES</Eyebrow></Up>
          <Up d={0.05}><h2 className="spp-h2">Integrações poderosas</h2></Up>
          <Up d={0.1}><p className="spp-sub">Conecte sua estrutura e potencialize suas vendas com as integrações nativas da Shadow.</p></Up>
        </div>
        <div className="spp-stage" style={{ aspectRatio: `${W} / ${H}` }}>
          <motion.div className="spp-ring" style={{ rotate: ringRot, opacity: s3dOp }} />
          <motion.div className="spp-s3d" style={{ opacity: s3dOp }}>
            <motion.div className="spp-sculpt" style={{ rotateY: rotY, rotateX: rotX, scale: sc }}>
              <div className="spp-float"><NinjaSculpture /></div>
            </motion.div>
          </motion.div>
          {pos.map((q, k) => <Plat key={k} p={p} k={k} x={q.x} y={q.y} hub={hub} W={W} H={H} />)}
        </div>
        <motion.p className="spp-mono-foot" style={{ opacity: footOp }}>NOVAS INTEGRAÇÕES CHEGANDO SEMPRE</motion.p>
      </div>
    </section>
  );
}

/* ── CENA 3: zoom dentro do visor do ninja → dashboard ───────────────── */

const DASH_FEATS = [
  [Plug, "Integrações facilitadas", "Pixel, UTMify, Xtracky e webhooks em poucos cliques."],
  [BarChart3, "Relatórios detalhados", "Conversão, aprovação e desempenho por período."],
  [Zap, "Saque na hora", "Saldo disponível e saque via Pix direto do painel."],
  [Trophy, "Metas e premiações", "Acompanhe seu progresso até o próximo prêmio."],
] as const;

function Dive() {
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
      const view = win.clientHeight - padY;
      maxScroll.set(Math.max(0, panel.offsetHeight * f - view));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (winRef.current) ro.observe(winRef.current);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [maxScroll]);

  const capOp = useTransform(p, [0, 0.1, 0.18], [1, 1, 0]);
  const capY = useTransform(p, [0.08, 0.2], [0, -40]);
  const zoom = useTransform(p, (v) => Math.pow(60, clamp((v - 0.1) / 0.3, 0, 1) ** 2));
  const ninjaX = useTransform(p, [0.1, 0.3], ["0%", "-25%"]);
  const ninjaOp = useTransform(p, [0.36, 0.42], [1, 0]);
  const winOp = useTransform(p, [0.38, 0.46], [0, 1]);
  const winSc = useTransform(p, [0.38, 0.48], [0.9, 1]);
  const scrollIn = useTransform(p, (v) => -clamp((v - 0.5) / 0.42, 0, 1) * maxScroll.get());

  return (
    <section id="olhar" ref={ref} className="spp-scene spp-dive">
      <div className="spp-sticky">
        <motion.div className="spp-dive-cap" style={{ opacity: capOp, y: capY }}>
          <Eyebrow>DADOS EM TEMPO REAL</Eyebrow>
          <h2 className="spp-h2 l">Um dashboard que<br />mostra tudo que <em>importa</em></h2>
          <p className="spp-sub l">Vendas, aprovação, saldo e metas numa visão panorâmica. Você acompanha cada oferta em tempo real e decide com dados.</p>
          <div className="spp-dfeats">
            {DASH_FEATS.map(([I, t, d]) => (
              <div key={t} className="spp-dfeat hov"><span><I size={15} /></span><div><b>{t}</b><small>{d}</small></div></div>
            ))}
          </div>
          <Link href={REGISTER} className="spp-btn">Abrir meu dashboard <span className="spp-arr"><ArrowRight size={13} /></span></Link>
        </motion.div>

        <motion.div className="spp-dive-ninja" style={{ x: ninjaX, opacity: ninjaOp }}>
          <motion.svg viewBox="0 0 200 200" style={{ scale: zoom, transformOrigin: "55% 49%" }}><NinjaFace /></motion.svg>
        </motion.div>

        <motion.div className="spp-browser" style={{ opacity: winOp, scale: winSc }}>
          <div className="spp-bar"><i /><i /><i /><span><Lock size={10} /> app.shadowpay.com.br</span></div>
          <div className="spp-view" ref={winRef}>
            <motion.div style={{ y: scrollIn }}>
              <div ref={panelRef} style={{ width: 1100, transform: `scale(${fit})`, transformOrigin: "0 0" }}>
                <DashboardPanel />
              </div>
            </motion.div>
          </div>
          <Link href={REGISTER} className="spp-gerente"><Headphones size={14} /> Chamar gerente</Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ── POR QUE: bento ──────────────────────────────────────────────────── */

const SWATCHES = ["#7c3aed", "#0192ed", "#16a34a", "#e11d48"];

function CheckoutBuilder() {
  const [color, setColor] = useState(SWATCHES[0]!);
  const [radius, setRadius] = useState(10);
  const [steps, setSteps] = useState(true);
  return (
    <div className="spp-ckb">
      <div className="spp-ckb-ed">
        <div className="spp-ckb-h"><b>Checkout Builder</b><span className="spp-on">Ativo</span></div>
        <small className="lbl">Aparência e estilo</small>
        <div className="spp-ckb-row"><span>Cor primária</span>
          <div className="sw">{SWATCHES.map((c) => <button key={c} style={{ background: c }} className={c === color ? "on" : ""} onClick={() => setColor(c)} aria-label={c} />)}</div>
        </div>
        <div className="spp-ckb-row"><span>Arredondamento</span><b>{radius}px</b></div>
        <input type="range" min={0} max={22} value={radius} onChange={(e) => setRadius(+e.target.value)} className="spp-range" style={{ ["--p" as string]: (radius / 22) * 100 + "%" }} />
        <label className="spp-ckb-row tg"><span>Numerar etapas</span><input type="checkbox" checked={steps} onChange={(e) => setSteps(e.target.checked)} /><i /></label>
        <small className="lbl">Blocos</small>
        {["Contador de oferta", "Depoimentos", "Order bump", "Selos e termos"].map((b) => <div key={b} className="spp-ckb-blk">{b}<Plus size={13} /></div>)}
      </div>
      <div className="spp-ckb-pv" style={{ ["--ck" as string]: color, ["--r" as string]: radius + "px" }}>
        <div className="tm">Oferta termina em <b>09:59</b></div>
        <div className="pr"><span className="th" /><div><b>Mentoria Escala</b><small>Turma de outubro · vagas limitadas</small></div><b>R$ 497</b></div>
        <div className="st">{steps && <i>1</i>}Dados pessoais</div>
        <div className="in">Nome completo</div><div className="in">seu@email.com</div>
        <div className="st">{steps && <i>2</i>}Pagamento</div>
        <div className="px"><QrCode size={14} /> Pix <small>aprovação na hora</small></div>
        <div className="ob"><Check size={12} /> Planilha de Escala <b>+ R$ 47</b></div>
        <div className="pay">Pagar R$ 497,00 com Pix</div>
        <small className="sec"><ShieldCheck size={11} /> Compra 100% segura</small>
      </div>
    </div>
  );
}

const CHAT: { me: boolean; t: string }[] = [
  { me: true, t: "Meu Pix não caiu." },
  { me: false, t: "Já conferi aqui: o Pix foi confirmado às 14:32 e o saldo está disponível no seu painel. ✅" },
  { me: true, t: "Show, já vou sacar!" },
];

function SupportChat() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((v) => (v >= CHAT.length + 2 ? 0 : v + 1)), 1600);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="spp-chat">
      <div className="spp-chat-h"><svg viewBox="0 0 200 200" width="28" height="28"><NinjaFace /></svg><div><b>Suporte ShadowPay</b><small><i /> online agora</small></div></div>
      <div className="spp-chat-tags"><span className="on">PIX PENDENTE</span><span>PAGAMENTO</span><span>OPERAÇÃO</span></div>
      <div className="spp-chat-body">
        <AnimatePresence>
          {CHAT.slice(0, Math.min(n, CHAT.length)).map((m, k) => (
            <motion.div key={k} className={"msg" + (m.me ? " me" : "")} initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}>{m.t}</motion.div>
          ))}
        </AnimatePresence>
        {n < CHAT.length && CHAT[n] && !CHAT[n]!.me && <div className="typing"><i /><i /><i /></div>}
      </div>
    </div>
  );
}

function Coins() {
  return (
    <div className="spp-coins" aria-hidden>
      <div className="orbit">
        {Array.from({ length: 7 }).map((_, k) => (
          <span key={k} style={{ transform: `rotate(${(k / 7) * 360}deg) translateY(-92px) rotate(${-(k / 7) * 360}deg)` }}>
            <svg viewBox="0 0 200 200"><NinjaFace eyeGlow={false} /></svg>
          </span>
        ))}
      </div>
      <div className="core"><Zap size={22} /></div>
    </div>
  );
}

function FeeSim() {
  const [valor, setValor] = useState(197);
  const [qtd, setQtd] = useState(500);
  const r = SHADOW.pix;
  const fee = valor * (r.taxa / 100) + r.fixo;
  const liq = valor - fee;
  const pct = (liq / valor) * 100;
  return (
    <div className="spp-fee">
      <div className="spp-fee-f"><div className="row"><span>Valor da venda</span><b>{brl(valor)}</b></div>
        <input type="range" min={10} max={2000} value={valor} onChange={(e) => setValor(+e.target.value)} className="spp-range" style={{ ["--p" as string]: ((valor - 10) / 1990) * 100 + "%" }} />
        <div className="row sm"><span>R$ 10</span><span>R$ 2.000</span></div></div>
      <div className="spp-fee-f"><div className="row"><span>Vendas no mês</span><b>{qtd.toLocaleString("pt-BR")}</b></div>
        <input type="range" min={10} max={5000} step={10} value={qtd} onChange={(e) => setQtd(+e.target.value)} className="spp-range" style={{ ["--p" as string]: ((qtd - 10) / 4990) * 100 + "%" }} />
        <div className="row sm"><span>10</span><span>5.000 vendas</span></div></div>
      <div className="spp-fee-line"><span>Taxa Pix ({r.taxa.toFixed(2).replace(".", ",")}%{r.fixo ? ` + ${brl(r.fixo)}` : ""})</span><b className="neg">− {brl(fee)}</b></div>
      <div className="spp-fee-res">
        <div><small>Você recebe por venda</small><b>{brl(liq)}</b></div>
        <div className="mo"><small>No mês você recebe</small><b>{brl(liq * qtd)}</b></div>
      </div>
      <div className="spp-fee-bar"><i style={{ width: pct + "%" }} /></div>
      <div className="row sm"><span>{pct.toFixed(1).replace(".", ",")}% fica com você</span><span>taxa</span></div>
    </div>
  );
}

function Why() {
  const r = SHADOW.pix;
  return (
    <section id="porque" className="spp-why">
      <div className="spp-wrap">
        <Up><span className="spp-badge sm"><i /> Por que escolher a ShadowPay?</span></Up>
        <Up d={0.05}><h2 className="spp-h2">Performance, confiança e liberdade<br />para o seu negócio <em>ir mais longe.</em></h2></Up>
        <Up d={0.1}><p className="spp-sub">Mais do que processar pagamentos: uma plataforma segura, escalável e ágil, com um time sempre por perto e liberdade para você operar do jeito que precisar.</p></Up>
        <div className="spp-bento">
          <Up className="b-ck"><article className="spp-card hov">
            <span className="spp-mono">CHECKOUT</span>
            <h3>Checkout de alta conversão, configurado em minutos.</h3>
            <p>Identidade visual, etapas, contador e order bump num editor visual. Publicação imediata, sem código.</p>
            <CheckoutBuilder />
          </article></Up>
          <Up className="b-sp" d={0.08}><article className="spp-card hov">
            <span className="spp-mono">SUPORTE</span>
            <h3>Suporte contínuo, onde e quando você precisar.</h3>
            <p>Atendimento humano e acompanhamento ativo da operação, do Pix às integrações.</p>
            <SupportChat />
          </article></Up>
          <Up className="b-sq"><article className="spp-card hov">
            <span className="spp-mono">SAQUE</span>
            <h3>Liquidação via Pix, 24/7, com controle total.</h3>
            <div className="spp-tags"><span>Saque a qualquer hora</span><span>2FA obrigatório</span><span>Chave Pix sua</span></div>
            <Coins />
          </article></Up>
          <Up className="b-tx" d={0.08}><article className="spp-card hov">
            <span className="spp-mono">TAXA PIX</span>
            <h3><em>{r.taxa.toFixed(2).replace(".", ",")}%</em>{r.fixo ? ` + ${brl(r.fixo)}` : ""} por transação.</h3>
            <p>Custo previsível por venda. Simule seu volume e projete a receita líquida da operação.</p>
            <a href="#contato" className="spp-link">Alto volume? Negocie condições <ArrowRight size={13} /></a>
            <FeeSim />
          </article></Up>
        </div>
      </div>
    </section>
  );
}

/* ── CENA 4: premiações (placas 3D) ──────────────────────────────────── */

const TIERS = [
  { k: "100K", v: "R$ 100 mil", premio: "AirPods 4ª geração", c: "#a78bfa", f: "none" },
  { k: "500K", v: "R$ 500 mil", premio: "iPad", c: "#e5e7eb", f: "grayscale(1) brightness(1.5)" },
  { k: "1M", v: "R$ 1 milhão", premio: "iPhone 18 Pro Max", c: "#fbbf24", f: "grayscale(1) sepia(1) saturate(5) hue-rotate(-8deg) brightness(1.1)" },
  { k: "2M", v: "R$ 2 milhões", premio: "Fix de R$ 10.000", c: "#f43f5e", f: "hue-rotate(80deg) saturate(1.6)" },
];

function Plaque({ pos, k, tiltX, tiltY }: { pos: MotionValue<number>; k: number; tiltX: MotionValue<number>; tiltY: MotionValue<number> }) {
  const t = TIERS[k]!;
  const x = useTransform(pos, (v) => `${(k - v) * 62}%`);
  const z = useTransform(pos, (v) => -Math.abs(k - v) * 220);
  const ry = useTransform(pos, (v) => -(k - v) * 26);
  const op = useTransform(pos, (v) => clamp(1.25 - Math.abs(k - v) * 0.45, 0, 1));
  const blur = useTransform(pos, (v) => `blur(${clamp(Math.abs(k - v) - 0.3, 0, 1) * 3}px) brightness(${1 - clamp(Math.abs(k - v), 0, 1) * 0.5})`);
  const rx2 = useTransform([tiltX, pos] as MotionValue<number>[], ([a, v]) => (Math.abs(k - (v as number)) < 0.5 ? (a as number) : 0));
  const ry2 = useTransform([tiltY, ry] as MotionValue<number>[], ([a, b]) => (b as number) + (Math.abs(b as number) < 13 ? (a as number) : 0));
  return (
    <motion.div className="spp-plq" style={{ x, z, rotateY: ry2, rotateX: rx2, opacity: op, filter: blur, zIndex: 10 - k }}>
      <div className="frame">
        <div className="art" style={{ ["--tc" as string]: t.c }}>
          <span className="brand"><svg viewBox="0 0 200 200" width="14" height="14"><NinjaFace /></svg> ShadowPay</span>
          <img src="/logoshadowpay1.png" alt="" style={{ filter: t.f }} />
          <small>Parabéns por alcançar</small>
          <b>{t.k}</b>
          <small>em vendas na ShadowPay</small>
          <span className="glare" />
        </div>
      </div>
    </motion.div>
  );
}

function Awards() {
  const ref = useRef<HTMLElement>(null);
  const p = useSceneProgress(ref);
  const pos = useTransform(p, [0.06, 0.9], [0, TIERS.length - 1], { clamp: true });
  const [idx, setIdx] = useState(0);
  useMotionValueEvent(pos, "change", (v) => setIdx(Math.round(v)));
  const fill = useTransform(pos, (v) => `${(v / (TIERS.length - 1)) * 100}%`);
  const tx = useMotionValue(0), ty = useMotionValue(0);
  const tiltX = useSpring(tx, { stiffness: 120, damping: 14 }), tiltY = useSpring(ty, { stiffness: 120, damping: 14 });
  const t = TIERS[idx] ?? TIERS[0]!;
  return (
    <section id="premiacoes" ref={ref} className="spp-scene spp-awards">
      <div className="spp-sticky">
        <div className="spp-aw-glow" style={{ background: `radial-gradient(closest-side, ${t.c}33, transparent)` }} />
        <div className="spp-wrap spp-aw-in">
          <div className="spp-aw-txt">
            <Eyebrow>PREMIAÇÕES</Eyebrow>
            <h2 className="spp-h2 l">Você fatura,<br />a Shadow reconhece.</h2>
            <p className="spp-sub l">Cada marco em vendas vira um prêmio de verdade, entregue na sua casa. Campanha de 01/10 a 31/12/2026.</p>
            <div className="spp-aw-info">
              <span className="spp-mono">MARCO 0{idx + 1} DE 0{TIERS.length} · EM VENDAS</span>
              <AnimatePresence mode="wait">
                <motion.div key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
                  <b className="v">{t.v}</b>
                  <span className="chip"><i style={{ background: t.c }} /> {t.premio}</span>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="spp-tl">
              <div className="trk"><motion.i style={{ width: fill }} /></div>
              {TIERS.map((x, k) => <span key={x.k} className={k <= idx ? "on" : ""} style={{ left: `${(k / (TIERS.length - 1)) * 100}%` }}><em>{x.k}</em></span>)}
            </div>
          </div>
          <div className="spp-aw-stage"
            onPointerMove={(e) => {
              if (e.pointerType !== "mouse") return;
              const r = e.currentTarget.getBoundingClientRect();
              ty.set(((e.clientX - r.left) / r.width - 0.5) * 16);
              tx.set(-((e.clientY - r.top) / r.height - 0.5) * 12);
            }}
            onPointerLeave={() => { tx.set(0); ty.set(0); }}>
            {TIERS.map((_, k) => <Plaque key={k} pos={pos} k={k} tiltX={tiltX} tiltY={tiltY} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── CTA alto volume + FAQ + rodapé ──────────────────────────────────── */

function BigCta() {
  return (
    <section id="contato" className="spp-wrap spp-ct">
      <Up>
        <div className="spp-ct-card hov">
          <div className="l">
            <span className="spp-badge sm"><i /> Junte-se à Shadow</span>
            <h2>Fatura mais de R$ 100k por mês?</h2>
            <p>Fale com nosso time e conheça condições e vantagens exclusivas para operações de alto volume.</p>
            <Link href={REGISTER} className="spp-btn lg">Comece agora <span className="spp-arr"><ArrowRight size={15} /></span></Link>
          </div>
          <div className="r" aria-hidden><svg viewBox="0 0 200 200"><NinjaFace /></svg></div>
        </div>
      </Up>
    </section>
  );
}

const FAQ = [
  ["Para qual tipo de negócio a ShadowPay é indicada?", "Para quem vende online e precisa de estabilidade: infoprodutores, lojas virtuais e operações de alto volume que não podem parar no pico de vendas."],
  ["Como funciona o saque?", "Você saca via Pix para a sua chave, 24 horas por dia, direto pelo painel. Todo saque exige autenticação em dois fatores (2FA) para proteger o seu dinheiro."],
  ["Em quanto tempo o dinheiro fica disponível?", "Assim que o Pix é aprovado, em segundos, o saldo aparece no painel e já pode ser sacado. Cada venda também é conferida automaticamente com o banco."],
  ["As taxas são fixas ou podem ser negociadas?", "A taxa do Pix é cobrada por venda aprovada, sem mensalidade nem taxa de setup. Para operações com volume alto, um gerente monta uma proposta sob medida."],
  ["Como funciona o suporte da ShadowPay?", "Atendimento humano de verdade, com um gerente acompanhando a sua operação de perto e respondendo quando você precisa."],
  ["A integração com a plataforma é complexa?", "Não. Você conecta Pixel da Meta e TikTok (API de Conversões), UTMify, Xtracky e WhatsApp em poucos cliques, e ainda tem API e webhooks para integrações próprias."],
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="spp-wrap spp-faq">
      <Up className="spp-faq-l">
        <span className="spp-q">?</span>
        <Eyebrow>FAQ</Eyebrow>
        <h2 className="spp-h2 l">Dúvidas frequentes</h2>
        <p className="spp-sub l">Tire suas dúvidas sobre a ShadowPay.</p>
      </Up>
      <div className="spp-faq-r">
        {FAQ.map(([q, a], k) => {
          const on = open === k;
          return (
            <div key={q} className={"spp-fi" + (on ? " on" : "")}>
              <button onClick={() => setOpen(on ? null : k)} aria-expanded={on}>
                <span className="n">{String(k + 1).padStart(3, "0")}</span>{q}<Plus size={16} className="pl" />
              </button>
              <AnimatePresence initial={false}>
                {on && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }}>
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
    <footer className="spp-foot">
      <div className="spp-wrap">
        <div className="g">
          <div className="b"><Logo /><p>Gateway de pagamentos Pix com checkout próprio, saque 24/7 e suporte especializado.</p></div>
          <div><h4>NAVEGAÇÃO</h4>{LINKS.map(([id, t]) => <a key={id} href={`#${id}`}>{t}</a>)}</div>
          <div><h4>RECURSOS</h4><Link href={LOGIN}>Fazer login</Link><Link href={REGISTER}>Abrir conta</Link></div>
          <div><h4>LEGAL</h4><Link href="/termos">Termos de uso</Link><Link href="/privacidade">Privacidade</Link></div>
        </div>
        <div className="bt"><span>© {new Date().getFullYear()} ShadowPay. Todos os direitos reservados.</span><span>Pagamentos via Pix · Saque 24/7</span></div>
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
    <div className={`spp ${outfit.variable} ${mono.variable}`}>
      <Head>
        <title>ShadowPay | Gateway de Pagamentos</title>
        <meta name="description" content="Pix aprovado na hora, saque 24/7, checkout de alta conversão e integrações nativas. Gateway de pagamentos para operações que não podem parar." />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: PINGU_CSS }} />
      <NinjaDefs />
      <div className="spp-amb" aria-hidden />
      <div className="spp-grain" aria-hidden />
      <Nav />
      <main>
        <Hero />
        <Integrations />
        <Dive />
        <Why />
        <Awards />
        <BigCta />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
