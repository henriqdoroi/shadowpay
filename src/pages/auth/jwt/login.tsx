"use client";

/**
 * /auth/jwt/login — split no estilo do login da Átomo Pay:
 *   LEFT  · palco escuro da ShadowPay: ninja oficial + "chuva" de vendas
 *           (notificações iOS caindo em 3 profundidades) e, a cada poucas
 *           vendas, uma notificação em primeiro plano que cai com gravidade
 *           e pousa quicando na pilha. Contador de aprovadas sobe junto.
 *   RIGHT · painel escuro fixo (~480px) com o formulário (campos outlined
 *           com rótulo flutuante, lembrar de mim, recuperar senha).
 * Lógica de auth mantida (login, redirect, recuperar senha).
 */

import Head from "next/head";
import { useState, useEffect, useCallback, useRef } from "react";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Zap } from "lucide-react";

const ICON = "/shadow-ninja-icon.png"; // logo oficial sem fundo (recortada)
const NINJA = "/shadow-ninja.png";
const REMEMBER_KEY = "sp_remember_email";

const PRODUCTS = [
  ["Mentoria Escala", 997], ["Kit Premium", 289.9], ["Curso Lançamento", 297], ["Assinatura Pro", 79.9],
  ["Ebook Método", 47], ["Consultoria VIP", 1490], ["Comunidade Elite", 197], ["Planilha de Escala", 67],
  ["Workshop Tráfego", 540], ["Treinamento X", 459.9], ["Desafio 21 dias", 149.9], ["Acesso Vitalício", 890],
] as const;

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Sale = { id: number; name: string; value: number };
type Drop = Sale & { x: number; z: number; rot: number; dur: number };

let SEQ = 0;
function nextSale(): Sale {
  const p = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)]!;
  return { id: ++SEQ, name: p[0], value: p[1] };
}

/* Ícone do app no estilo iOS: squircle violeta com o ninja oficial. */
function AppIcon({ size }: { size: number }) {
  return (
    <span className="lg-appicon" style={{ width: size, height: size, borderRadius: size * 0.24 }}>
      <img src={ICON} alt="" />
    </span>
  );
}

/* Notificação de venda (vidro iOS). */
function SaleNotif({ s, when = "agora" }: { s: Sale; when?: string }) {
  return (
    <div className="lg-notif">
      <AppIcon size={38} />
      <div className="lg-notif-body">
        <div className="lg-notif-top"><b>ShadowPay</b><span>{when}</span></div>
        <strong>Venda aprovada!</strong>
        <small>Pix · {brl(s.value)} — {s.name}</small>
      </div>
    </div>
  );
}

/* Palco da esquerda: chuva de vendas + pilha + ninja + contador. */
function SalesStage() {
  const [rain, setRain] = useState<Drop[]>([]);
  const [stack, setStack] = useState<Sale[]>([]);
  const [count, setCount] = useState(1284);
  const [total, setTotal] = useState(184327.9);
  const [bump, setBump] = useState(0);
  const tick = useRef(0);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const loop = () => {
      if (!alive) return;
      const s = nextSale();
      tick.current++;
      setCount((c) => c + 1);
      setTotal((t) => t + s.value);
      setBump((b) => b + 1);
      if (tick.current % 3 === 0) {
        // venda em primeiro plano: cai e pousa na pilha
        setStack((prev) => [s, ...prev].slice(0, 3));
      } else {
        // chuva ao fundo, em profundidades diferentes
        const z = [0.55, 0.72, 0.88][Math.floor(Math.random() * 3)]!;
        const d: Drop = { ...s, x: Math.random(), z, rot: (Math.random() - 0.5) * 14, dur: 7.5 - z * 3.2 + Math.random() * 1.5 };
        setRain((prev) => [...prev.slice(-12), d]);
      }
      timer = setTimeout(loop, 650 + Math.random() * 650);
    };
    timer = setTimeout(loop, 500);
    return () => { alive = false; clearTimeout(timer); };
  }, []);

  return (
    <div className="lg-stage" aria-hidden>
      <div className="lg-glow" />
      <div className="lg-grid" />

      {/* chuva (atrás do ninja) */}
      <div className="lg-rain">
        {rain.map((d) => (
          <motion.div
            key={d.id}
            className="lg-drop"
            style={{
              // x ∈ [0,1] → o cartão inteiro sempre cabe na largura do palco
              left: `calc((100% - var(--dw)) * ${d.x.toFixed(3)} + var(--dw) / 2)`, zIndex: Math.round(d.z * 10), opacity: d.z,
              ["--d" as string]: `${d.dur}s`, ["--b" as string]: `${((1 - d.z) * 5).toFixed(1)}px`,
            }}
            initial={{ y: "-25vh", rotate: d.rot, scale: d.z }}
            animate={{ y: "115vh", rotate: -d.rot * 0.6, scale: d.z }}
            transition={{ duration: d.dur, ease: [0.45, 0, 0.85, 0.6] }}
            onAnimationComplete={() => setRain((prev) => prev.filter((x) => x.id !== d.id))}
          >
            <SaleNotif s={d} />
          </motion.div>
        ))}
      </div>

      {/* ninja + contador */}
      <div className="lg-center">
        <motion.div className="lg-ninja-wrap" key={bump} initial={{ scale: 1 }} animate={{ scale: [1, 1.035, 1] }} transition={{ duration: 0.45, ease: "easeOut" }}>
          <div className="lg-halo" />
          <img src={NINJA} alt="" className="lg-ninja" />
        </motion.div>
        <div className="lg-counter">
          <span className="lg-live"><i /> ao vivo</span>
          <div>
            <small>Vendas aprovadas hoje</small>
            <b>{count.toLocaleString("pt-BR")}</b>
          </div>
          <div>
            <small>Faturamento</small>
            <b className="v">{brl(total)}</b>
          </div>
        </div>
      </div>

      {/* pilha da frente: cada venda cai com gravidade e quica ao pousar */}
      <div className="lg-stack">
        <AnimatePresence initial={false}>
          {stack.map((s, i) => (
            <motion.div
              key={s.id}
              layout
              className="lg-stack-item"
              initial={{ y: "-85vh", rotate: (s.id % 2 ? 1 : -1) * 9, opacity: 1 }}
              animate={{ y: 0, rotate: 0, opacity: 1 - i * 0.22, scale: 1 - i * 0.04 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
              transition={{ type: "spring", stiffness: 120, damping: 11, mass: 0.9 }}
              style={{ zIndex: 10 - i }}
            >
              <SaleNotif s={s} when={i === 0 ? "agora" : `${i * 2} min`} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Login() {
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const router = useRouter();
  const { login, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) router.push("/v1/dashboard");
  }, [isAuthenticated, router]);

  // "Lembrar de mim": guarda só o e-mail neste aparelho
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) { setEmail(saved); setRemember(true); }
    } catch { /* storage bloqueado */ }
  }, []);

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        try {
          if (remember) localStorage.setItem(REMEMBER_KEY, email);
          else localStorage.removeItem(REMEMBER_KEY);
        } catch { /* storage bloqueado */ }
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
    [email, password, remember, login, router]
  );

  return (
    <>
      <Head>
        <title>ShadowPay — Acesso</title>
      </Head>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="lg-root">
        <section className="lg-left">
          <Link href="/" className="lg-brand"><img src={ICON} alt="" /><span>Shadow<i>Pay</i></span></Link>
          <SalesStage />
        </section>

        <aside className="lg-panel">
          <motion.div className="lg-form-wrap" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
            <Link href="/" className="lg-brand lg-brand-m"><img src={ICON} alt="" /><span>Shadow<i>Pay</i></span></Link>

            <h1>Seja bem-vindo(a) à ShadowPay!</h1>
            <p className="lg-sub">Faça login na sua conta e acompanhe suas vendas em tempo real.</p>

            <form onSubmit={handleLogin} className="lg-form">
              <div className="lg-field">
                <input id="email" type="email" placeholder=" " autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
                <label htmlFor="email">E-mail</label>
              </div>
              <div className="lg-field">
                <input id="password" type={showPass ? "text" : "password"} placeholder=" " autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
                <label htmlFor="password">Senha</label>
                <button type="button" className="lg-eye" onClick={() => setShowPass((v) => !v)} aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}>
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="lg-row">
                <label className="lg-check">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <span />
                  Lembrar de mim
                </label>
                <button type="button" className="lg-link" onClick={() => setIsForgotPasswordOpen(true)} disabled={isLoading}>Recuperar senha</button>
              </div>

              <button type="submit" className="lg-submit" disabled={isLoading || !email || !password}>
                {isLoading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Conectando…</>) : "Entrar"}
              </button>
            </form>

            <p className="lg-new">Novo por aqui? <Link href="/auth/jwt/register">Abrir conta</Link></p>

            <p className="lg-secure"><Lock size={12} /> Conexão segura · dados criptografados</p>
            <p className="lg-secure"><Zap size={12} /> Pix confirmado em segundos · saque 24/7</p>
          </motion.div>
        </aside>

        <ForgotPasswordModal isOpen={isForgotPasswordOpen} onClose={() => setIsForgotPasswordOpen(false)} />
      </div>
    </>
  );
}

/* ===================== CSS ===================== */
const CSS = `
.lg-root{position:relative;display:flex;min-height:100vh;width:100%;background:#000;color:#ece9f6;font-family:var(--font-inter),Inter,ui-sans-serif,system-ui,sans-serif;overflow:hidden}
.lg-root *{box-sizing:border-box}
.lg-brand{position:absolute;left:44px;top:34px;z-index:20;display:flex;align-items:center;gap:9px;font-size:21px;font-weight:700;letter-spacing:-.02em;color:#ece9f6;text-decoration:none}
.lg-brand img{width:34px;height:34px;object-fit:contain;filter:drop-shadow(0 0 10px rgba(139,92,246,.6))}
.lg-brand i{font-style:italic;font-weight:500;color:#a78bfa}
.lg-brand-m{display:none}

/* ---- esquerda ---- */
.lg-left{position:relative;flex:1;min-width:0;overflow:hidden}
.lg-stage{position:absolute;inset:0;background:radial-gradient(70% 60% at 50% 45%,#1b1036 0%,#0b0716 55%,#000 100%)}
.lg-glow{position:absolute;left:50%;top:46%;width:760px;height:760px;translate:-50% -50%;border-radius:50%;background:radial-gradient(circle,rgba(124,58,237,.28),transparent 62%);filter:blur(20px);animation:lgBreath 6s ease-in-out infinite}
@keyframes lgBreath{50%{transform:scale(1.08);opacity:.75}}
.lg-grid{position:absolute;inset:0;opacity:.5;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:56px 56px;
  mask-image:radial-gradient(60% 55% at 50% 45%,#000,transparent);-webkit-mask-image:radial-gradient(60% 55% at 50% 45%,#000,transparent)}
.lg-rain{position:absolute;inset:0;pointer-events:none}
.lg-rain{--dw:300px;z-index:1}
.lg-live{white-space:nowrap}
.lg-drop{position:absolute;top:0;width:var(--dw);margin-left:calc(var(--dw) / -2);will-change:transform}
.lg-drop>.lg-notif{animation:lgDropFade var(--d,6s) linear both;filter:blur(var(--b,0px));
  backdrop-filter:none;-webkit-backdrop-filter:none;background:linear-gradient(180deg,rgba(58,46,92,.92),rgba(30,24,52,.92))}
@keyframes lgDropFade{0%{opacity:0}8%{opacity:1}80%{opacity:1}100%{opacity:0}}

/* notificação iOS (vidro) */
.lg-notif{display:flex;align-items:center;gap:11px;padding:11px 13px;border-radius:22px;width:100%;
  background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.07));
  backdrop-filter:blur(30px) saturate(180%);-webkit-backdrop-filter:blur(30px) saturate(180%);
  border:.5px solid rgba(255,255,255,.22);
  box-shadow:inset 0 .6px 0 rgba(255,255,255,.45),0 18px 40px -16px rgba(0,0,0,.75)}
.lg-appicon{display:grid;place-items:center;flex-shrink:0;background:linear-gradient(150deg,#2a1755,#130b26);box-shadow:inset 0 .5px 0 rgba(255,255,255,.3),0 2px 6px rgba(0,0,0,.4);overflow:hidden}
.lg-appicon img{width:86%;height:86%;object-fit:contain}
.lg-notif-body{flex:1;min-width:0;line-height:1.25}
.lg-notif-top{display:flex;justify-content:space-between;font-size:11.5px;color:rgba(255,255,255,.62)}
.lg-notif-top b{font-weight:600;color:rgba(255,255,255,.75);letter-spacing:.01em}
.lg-notif strong{display:block;font-size:14px;font-weight:700;color:#fff;margin-top:1px}
.lg-notif small{display:block;font-size:12.5px;color:rgba(255,255,255,.86);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* centro */
.lg-center{position:absolute;left:50%;top:44%;translate:-50% -50%;display:flex;flex-direction:column;align-items:center;gap:6px;z-index:12;pointer-events:none}
.lg-ninja-wrap{position:relative;width:min(300px,32vw);aspect-ratio:1}
.lg-halo{position:absolute;inset:14%;border-radius:50%;background:radial-gradient(circle,rgba(167,139,250,.55),transparent 66%);filter:blur(14px)}
.lg-ninja{position:relative;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 26px 50px rgba(0,0,0,.65));animation:lgFloat 6s ease-in-out infinite}
@keyframes lgFloat{50%{transform:translateY(-10px)}}
.lg-counter{display:flex;align-items:center;gap:22px;padding:12px 20px;border-radius:16px;background:rgba(12,9,24,.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  border:1px solid rgba(167,139,250,.22);box-shadow:0 20px 50px -20px rgba(124,58,237,.6)}
.lg-counter small{display:block;font-size:11px;color:#a19bb9}
.lg-counter b{display:block;font-size:20px;font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.lg-counter b.v{color:#4ade80}
.lg-live{display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#4ade80}
.lg-live i{width:8px;height:8px;border-radius:50%;background:#4ade80;box-shadow:0 0 0 0 rgba(74,222,128,.6);animation:lgPing 1.6s infinite}
@keyframes lgPing{70%{box-shadow:0 0 0 8px rgba(74,222,128,0)}100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}

/* pilha da frente */
.lg-stack{position:absolute;left:50%;bottom:6%;width:min(360px,80%);translate:-50% 0;z-index:15;display:flex;flex-direction:column;gap:8px}
.lg-stack-item{transform-origin:top center}
.lg-stack-item:first-child .lg-notif{box-shadow:inset 0 .6px 0 rgba(255,255,255,.5),0 0 0 1px rgba(167,139,250,.25),0 24px 50px -16px rgba(124,58,237,.65)}

/* ---- painel direito (estilo Átomo) ---- */
.lg-panel{position:relative;z-index:30;width:480px;flex-shrink:0;background:#0e0d14;display:flex;align-items:center;justify-content:center;padding:40px 36px;border-left:1px solid rgba(255,255,255,.05)}
.lg-form-wrap{width:100%;max-width:408px}
.lg-panel h1{font-size:24px;font-weight:600;letter-spacing:-.02em;color:#ece9f6;margin:0}
.lg-sub{margin:6px 0 26px;font-size:14px;color:#a19bb9;line-height:1.5}
.lg-form{display:flex;flex-direction:column;gap:20px}
.lg-field{position:relative}
.lg-field input{width:100%;height:56px;padding:18px 48px 6px 15px;border-radius:8px;border:1px solid rgba(255,255,255,.22);background:transparent;color:#fff;font-size:15px;outline:none;transition:border-color .2s,box-shadow .2s}
.lg-field input:hover{border-color:rgba(255,255,255,.4)}
.lg-field input:focus{border-color:#7c3aed;box-shadow:0 0 0 1px #7c3aed}
.lg-field input:disabled{opacity:.6}
.lg-field input:-webkit-autofill{-webkit-text-fill-color:#fff;-webkit-box-shadow:0 0 0 1000px #15131e inset;caret-color:#fff}
.lg-field label{position:absolute;left:15px;top:50%;translate:0 -50%;font-size:15px;color:#a19bb9;pointer-events:none;transition:top .18s,font-size .18s,color .18s,translate .18s}
.lg-field input:focus+label,.lg-field input:not(:placeholder-shown)+label{top:15px;font-size:11.5px}
.lg-field input:focus+label{color:#a78bfa}
.lg-eye{position:absolute;right:12px;top:50%;translate:0 -50%;display:grid;place-items:center;width:32px;height:32px;border:0;background:none;color:#a19bb9;cursor:pointer;border-radius:8px}
.lg-eye:hover{color:#fff;background:rgba(255,255,255,.06)}
.lg-row{display:flex;justify-content:space-between;align-items:center;margin-top:-6px}
.lg-check{display:flex;align-items:center;gap:10px;font-size:14.5px;color:#d6d1e6;cursor:pointer;user-select:none}
.lg-check input{display:none}
.lg-check span{width:18px;height:18px;border-radius:4px;border:2px solid rgba(255,255,255,.5);display:grid;place-items:center;transition:all .15s}
.lg-check input:checked+span{background:#7c3aed;border-color:#7c3aed}
.lg-check input:checked+span:after{content:"";width:5px;height:9px;border:solid #fff;border-width:0 2px 2px 0;rotate:45deg;margin-top:-2px}
.lg-link{border:0;background:none;color:#a78bfa;font-size:14px;cursor:pointer;padding:0}
.lg-link:hover{color:#c4b5fd}
.lg-submit{height:44px;border:0;border-radius:8px;background:#7c3aed;color:#fff;font-size:14.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;
  display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 8px 24px -10px rgba(124,58,237,.9);transition:background .2s,transform .15s,box-shadow .2s}
.lg-submit:hover:not(:disabled){background:#6d28d9;box-shadow:0 12px 30px -10px rgba(124,58,237,1)}
.lg-submit:active:not(:disabled){transform:scale(.99)}
.lg-submit:disabled{opacity:.5;cursor:not-allowed}
.lg-new{text-align:center;margin:26px 0 0;font-size:15px;color:#a19bb9}
.lg-new a{color:#a78bfa;font-weight:500;margin-left:6px;text-decoration:none}
.lg-new a:hover{color:#c4b5fd}
.lg-secure{display:flex;align-items:center;justify-content:center;gap:6px;margin:10px 0 0;font-size:11.5px;color:#6f6a88}
.lg-secure:first-of-type{margin-top:34px}

.lg-counter>div{white-space:nowrap}
/* ---- telas baixas: ninja menor, pilha com 2 cartões ---- */
@media (max-height:860px){
  .lg-center{top:36%}
  .lg-ninja-wrap{width:min(230px,28vh)}
  .lg-stack{bottom:4%;width:min(330px,76%)}
  .lg-stack-item:nth-child(n+3){display:none}
}
@media (max-height:640px){.lg-stack-item:nth-child(n+2){display:none}.lg-center{top:34%}}
/* ---- palco estreito ---- */
@media (max-width:1240px){
  .lg-counter{gap:14px;padding:10px 14px}
  .lg-counter b{font-size:17px}
  .lg-rain{--dw:260px}
}
/* ---- telas menores: palco vira fundo, painel por cima ---- */
@media (max-width:1100px){.lg-panel{width:420px}}
@media (max-width:860px){
  .lg-root{display:block;min-height:100svh}
  .lg-left{position:fixed;inset:0}
  .lg-left>.lg-brand{display:none}
  .lg-center{top:30%;opacity:.45}
  .lg-counter,.lg-stack{display:none}
  .lg-rain{--dw:240px}
  .lg-panel{width:100%;min-height:100svh;background:rgba(10,9,16,.72);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:0;padding:32px 20px}
  .lg-brand-m{display:flex;position:static;margin-bottom:34px;font-size:20px}
}
@media (prefers-reduced-motion:reduce){.lg-root *{animation:none!important}}
`;
