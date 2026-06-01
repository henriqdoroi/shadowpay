"use client";

/**
 * /auth/jwt/login — split:
 *   LEFT  · palco escuro: intro (silhueta da pantera → logo real) e depois
 *           o iPhone 17 Pro Max (mockup real, com sombra) recebendo
 *           NOTIFICAÇÕES de venda no estilo iOS agrupado (logo ShadowPay
 *           roxa no quadrado branco · "Venda Aprovada!" · "Valor: R$ X").
 *   RIGHT · formulário white (craft Stripe).
 * Lógica de auth + push 100% mantida.
 */

import Head from "next/head";
import { useState, useEffect, useCallback } from "react";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Lock, ChevronDown, X } from "lucide-react";

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

const SALE_VALUES = [
  "189,90", "90,00", "297,00", "1.490,00", "540,00",
  "149,90", "890,00", "67,00", "2.300,00", "459,90",
];

type Notif = { id: string; val: string; t: string; fresh: boolean };

/* pantera branca no squircle violeta (ícone do app / brand) */
function AppIcon({ size = 38 }: { size?: number }) {
  return (
    <img
      src="/logoshadowpay.png"
      alt="ShadowPay"
      style={{ width: size, height: size, objectFit: "contain", flexShrink: 0 }}
    />
  );
}

/* ícone do app na notificação — ninja no quadrado branco (estilo iOS) */
function PurpleIcon({ size = 42 }: { size?: number }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: size * 0.225, flexShrink: 0,
        background: "#fff", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <img src="/logoshadowpay.png" alt="" style={{ width: size * 0.86, height: size * 0.86, objectFit: "contain" }} />
    </div>
  );
}

/* uma notificação (estilo imagem 2) */
function SaleCard({ sale }: { sale: Notif }) {
  return (
    <div className={"sp-ncard" + (sale.fresh ? " sp-fresh" : "")}>
      <PurpleIcon size={29} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "-0.015em", whiteSpace: "nowrap" }}>Venda Aprovada!</span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,.58)", flexShrink: 0, whiteSpace: "nowrap" }}>{sale.t}</span>
        </div>
        <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.9)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          Valor: <span style={{ fontWeight: 600, fontFeatureSettings: '"tnum" 1' }}>R$ {sale.val}</span>
        </div>
      </div>
    </div>
  );
}

/* iPhone (mockup real, com sombra) + grupo de notificações por cima */
function PhoneShowcase({ notifs }: { notifs: Notif[] }) {
  return (
    <div className="sp-showcase">
      <img src="/iphone-hand.png" alt="iPhone ShadowPay" className="sp-phone-img" />
      <div className="sp-notif-overlay">
        <div className="sp-notif-header">
          <span className="sp-notif-app">ShadowPay</span>
          <div className="sp-notif-actions">
            <span className="sp-notif-less"><ChevronDown size={11} strokeWidth={2.5} /> Mostrar menos</span>
            <span className="sp-notif-x"><X size={11} strokeWidth={2.8} /></span>
          </div>
        </div>
        <div className="sp-notif-cards">
          {notifs.map((n, idx) => (
            <div key={n.id} style={{ opacity: idx >= 2 ? 0.78 : 1, transformOrigin: "center top" }}>
              <SaleCard sale={n} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState<"intro" | "phone">("intro");
  const router = useRouter();
  const { login, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) router.push("/v1/dashboard");
  }, [isAuthenticated, router]);

  // 1) intro: silhueta → logo (~3.2s). 2) a logo some e o celular entra.
  useEffect(() => {
    setPhase("intro");
    setNotifs([]);
    const t = setTimeout(() => setPhase("phone"), 3200);
    return () => clearTimeout(t);
  }, [runId]);

  // Quando o celular entra: espera ele subir (~1.2s) e começa as vendas.
  useEffect(() => {
    if (phase !== "phone") return;
    setNotifs([]);
    let i = 0;
    const age = (t: string) => (t === "Agora" ? "1 min" : t === "1 min" ? "3 min" : t === "3 min" ? "5 min" : "8 min");
    const drop = () => {
      const val = SALE_VALUES[i % SALE_VALUES.length];
      setNotifs((prev) => [{ val, t: "Agora", id: Date.now() + "-" + i, fresh: true } as Notif, ...prev.map((p) => ({ ...p, fresh: false, t: age(p.t) }))].slice(0, 3));
      i++;
    };
    const first = setTimeout(drop, 1300);
    const iv = setInterval(drop, 2600);
    return () => { clearTimeout(first); clearInterval(iv); };
  }, [phase]);

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const out = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) out[i] = rawData.charCodeAt(i);
    return out;
  }

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const result = await login(email, password);
        if (result.success) {
          toast.success("Login realizado com sucesso!");
          if ("Notification" in window && Notification.permission === "default") {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") toast("Notificações não ativadas.");
          }
          if ("serviceWorker" in navigator && "PushManager" in window && Notification.permission === "granted") {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array("BGSIIaq7ymGsCu-qDrD32FrzTJtd5KgEU5tbjhuQEWF2JVMc72XGLMJYzSK9Snb2W2Swlun9pB9O2Mrt9l7KC3A"),
            });
            await fetch("/api/webhooks/notifications/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription }) });
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
      <style>{CSS}</style>

      <div className="grid min-h-screen w-full lg:grid-cols-[1.05fr_1fr]" style={{ fontFamily: FONT, background: T.canvas, color: T.ink }}>
        {/* ===== ESQUERDA — palco escuro ===== */}
        <section
          onClick={() => setRunId((r) => r + 1)}
          title="Reproduzir novamente"
          className="relative hidden cursor-pointer flex-col items-center justify-center overflow-hidden lg:flex"
          style={{ background: "radial-gradient(125% 85% at 50% -5%, #2a1d52 0%, #16112f 46%, #0a0816 100%)" }}
        >
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(55% 40% at 50% 100%, rgba(124,58,237,.20), transparent 72%)" }} />
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.045]" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.9) .5px, transparent .5px)", backgroundSize: "4px 4px" }} />

          <div className="absolute left-8 top-8 flex items-center gap-2.5">
            <AppIcon size={30} />
            <span className="text-[14px] font-semibold tracking-tight text-white/90">ShadowPay</span>
          </div>

          {/* INTRO: silhueta da pantera → logo cromada real */}
          {phase === "intro" && (
            <div className="sp-intro">
              <div className="sp-draw-wrap">
                <span className="sp-draw-sil" />
                <span className="sp-draw-scan" />
                <img src="/logoshadowpay.png" alt="" className="sp-draw-real" />
              </div>
            </div>
          )}

          {/* PHONE: a logo some e o celular SOBE com fade-in → caem as vendas */}
          {phase === "phone" && (
            <div className="relative flex flex-col items-center">
              <div className="sp-headline-in relative mb-4 max-w-[420px] px-8 text-center">
                <h2 style={{ fontFamily: FONT, fontSize: 26, fontWeight: 300, lineHeight: 1.15, letterSpacing: "-0.7px", color: "#fff" }}>
                  Cada venda aprovada,{" "}
                  <span style={{ fontWeight: 600, color: "#C4B5FD" }}>no seu bolso na hora.</span>
                </h2>
              </div>
              <div className="sp-rise">
                <div className="sp-bob"><PhoneShowcase notifs={notifs} /></div>
              </div>
            </div>
          )}
        </section>

        {/* ===== DIREITA — formulário white ===== */}
        <div className="flex items-center justify-center px-5 py-10 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-[380px]">
            <div className="mb-8 flex items-center gap-2.5 lg:hidden">
              <AppIcon size={38} />
              <span className="text-[16px] font-semibold tracking-tight" style={{ color: T.ink }}>ShadowPay</span>
            </div>

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

        <ForgotPasswordModal isOpen={isForgotPasswordOpen} onClose={() => setIsForgotPasswordOpen(false)} />
      </div>
    </>
  );
}

/* ===================== CSS ===================== */
const CSS = `
/* ---- showcase: iPhone (mockup) + sombra ---- */
.sp-showcase { position: relative; width: 486px; max-width: 88vw; }
.sp-phone-img { display: block; width: 100%; height: auto; filter: drop-shadow(0 34px 50px rgba(6,3,20,.5)); }

/* grupo de notificações sobre a tela */
.sp-notif-overlay { position: absolute; left: 29.5%; width: 41%; top: 33%; z-index: 3; display: flex; flex-direction: column; gap: 5px; }
.sp-notif-header { display: flex; align-items: center; justify-content: space-between; padding: 0 4px 1px; }
.sp-notif-app { font-size: 13.5px; font-weight: 700; color: #fff; letter-spacing: -0.02em; text-shadow: 0 1px 6px rgba(0,0,0,.4); }
.sp-notif-actions { display: flex; align-items: center; gap: 4px; }
.sp-notif-less { display: inline-flex; align-items: center; gap: 2px; font-size: 9px; font-weight: 500; color: #fff; border-radius: 999px; padding: 3px 7px 3px 5px; white-space: nowrap;
  background: rgba(255,255,255,.16); border: .5px solid rgba(255,255,255,.28); box-shadow: inset 0 .5px 0 rgba(255,255,255,.4); backdrop-filter: blur(16px) saturate(150%); -webkit-backdrop-filter: blur(16px) saturate(150%); }
.sp-notif-x { display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; color: #fff;
  background: rgba(255,255,255,.16); border: .5px solid rgba(255,255,255,.28); box-shadow: inset 0 .5px 0 rgba(255,255,255,.4); backdrop-filter: blur(16px) saturate(150%); -webkit-backdrop-filter: blur(16px) saturate(150%); }
.sp-notif-cards { display: flex; flex-direction: column; gap: 6px; }
/* ---- liquid glass (iOS) ---- */
.sp-ncard {
  display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: 18px;
  background: linear-gradient(180deg, rgba(255,255,255,.17), rgba(255,255,255,.07));
  backdrop-filter: blur(38px) saturate(185%); -webkit-backdrop-filter: blur(38px) saturate(185%);
  border: .5px solid rgba(255,255,255,.22);
  box-shadow: inset 0 .6px 0 rgba(255,255,255,.45), inset 0 0 0 .5px rgba(255,255,255,.04), 0 10px 26px -12px rgba(0,0,0,.5);
}
@keyframes sp-ncard-in { 0%{opacity:0; transform:translateY(-18px) scale(.95);} 100%{opacity:1; transform:translateY(0) scale(1);} }
.sp-ncard.sp-fresh { animation: sp-ncard-in .5s cubic-bezier(.22,1,.36,1); }

/* float */
@keyframes sp-float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-9px);} }
.sp-bob { animation: sp-float 6s ease-in-out infinite; }
@keyframes sp-phone-enter { 0%{opacity:0; transform:translateY(40px) scale(.94);} 100%{opacity:1; transform:translateY(0) scale(1);} }
.sp-phone-enter { animation: sp-phone-enter .95s cubic-bezier(.22,1,.36,1) both; }
/* celular SOBE com fade-in de baixo (depois da logo sumir) */
@keyframes sp-rise { 0%{opacity:0; transform:translateY(95px) scale(.97);} 100%{opacity:1; transform:translateY(0) scale(1);} }
.sp-rise { animation: sp-rise 1.1s cubic-bezier(.22,1,.36,1) both; }
.sp-headline-in { animation: sp-fade-up .7s ease .12s both; }
@keyframes sp-fade-up { 0%{opacity:0; transform:translateY(10px);} 100%{opacity:1; transform:translateY(0);} }

/* ---- intro: silhueta → logo real ---- */
.sp-intro { position:absolute; inset:0; z-index:5; display:flex; align-items:center; justify-content:center; }
.sp-draw-wrap { position:relative; width:210px; height:232px; animation: sp-wrap-out .55s ease 2.7s forwards; }
.sp-draw-sil { position:absolute; inset:0; background: linear-gradient(160deg,#A78BFA,#7C3AED 52%,#5B21B6);
  -webkit-mask: url(/logoshadowpay.png) center / contain no-repeat; mask: url(/logoshadowpay.png) center / contain no-repeat;
  clip-path: inset(100% 0 0 0); filter: drop-shadow(0 0 16px rgba(124,58,237,.6));
  animation: sp-reveal 1.6s cubic-bezier(.45,0,.15,1) forwards; }
@keyframes sp-reveal { 0%{clip-path: inset(100% 0 0 0);} 100%{clip-path: inset(0 0 0 0);} }
.sp-draw-scan { position:absolute; left:-16%; right:-16%; height:3px; bottom:0; opacity:0; border-radius:3px;
  background: linear-gradient(90deg, transparent, #C4B5FD 30%, #fff 50%, #C4B5FD 70%, transparent);
  box-shadow: 0 0 22px 7px rgba(167,139,250,.55); animation: sp-scan 1.6s cubic-bezier(.45,0,.15,1) forwards; }
@keyframes sp-scan { 0%{bottom:0; opacity:0;} 8%{opacity:1;} 86%{opacity:1;} 100%{bottom:100%; opacity:0;} }
.sp-draw-real { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; opacity:0; animation: sp-real 1.4s ease 1.45s forwards; }
@keyframes sp-real {
  0%{opacity:0; transform:scale(.93); filter: drop-shadow(0 0 0 rgba(124,58,237,0));}
  45%{opacity:1; transform:scale(1.04); filter: drop-shadow(0 14px 36px rgba(124,58,237,.6)) drop-shadow(0 0 20px rgba(196,181,253,.55));}
  72%{transform:scale(1);}
  100%{opacity:1; transform:scale(1); filter: drop-shadow(0 10px 26px rgba(124,58,237,.42));} }
@keyframes sp-wrap-out { to { opacity:0; transform:scale(1.08); filter: blur(3px); } }
`;
