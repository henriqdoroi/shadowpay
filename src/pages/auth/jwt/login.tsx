"use client";

/**
 * /auth/jwt/login — split screen:
 *   LEFT  · iPhone "product mockup" (estilo Stripe, sobre canvas claro)
 *           com notificações de VENDA caindo na lock screen (iOS).
 *   RIGHT · formulário bank-grade em tema WHITE com a craft da Stripe
 *           (tipografia editorial, hairlines, CTA sólido, sombra navy).
 *
 * Baseado no conceito enviado pelo usuário, portado pro stack real
 * (Next + TS + Tailwind) e com a lógica de auth + push 100% mantida.
 */

import Head from "next/head";
import { useState, useEffect, useCallback } from "react";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  ArrowRight,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";

/* Paleta ShadowPay (violeta) + tokens ink/hairline/canvas estilo Stripe */
const T = {
  ink: "#0F172A",
  inkSecondary: "#334155",
  inkMute: "#64748B",
  inkFaint: "#94A3B8",
  primary: "#7C3AED",
  primaryPress: "#6D28D9",
  canvas: "#FFFFFF",
  canvasSoft: "#F6F9FC",
  hairline: "#E3E8EE",
  hairlineInput: "#DCE3EC",
};

const FONT =
  "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif";

const SALE_VALUES = [
  "R$ 297,00",
  "R$ 1.490,00",
  "R$ 540,00",
  "R$ 89,00",
  "R$ 890,00",
  "R$ 149,90",
  "R$ 2.300,00",
  "R$ 67,00",
  "R$ 459,90",
];

type Notif = { id: string; val: string; t: string; fresh: boolean };

/* ── ícone do app: pantera branca no squircle violeta ── */
function AppIcon({ size = 38 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.265,
        flexShrink: 0,
        background: "linear-gradient(150deg,#9B6BFF,#7C3AED 55%,#5B21B6)",
        boxShadow:
          "inset 0 1px 1px rgba(255,255,255,.5), 0 1px 3px rgba(0,0,0,.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src="/shadow-panther.png"
        alt=""
        style={{
          width: size * 0.64,
          height: size * 0.64,
          objectFit: "contain",
          filter: "brightness(0) invert(1)",
          opacity: 0.97,
        }}
      />
    </div>
  );
}

/* ── notificação iOS (material escuro) ── */
function LSNotif({ sale }: { sale: Notif }) {
  return (
    <div className={"sp-ls-notif" + (sale.fresh ? " sp-fresh" : "")}>
      <AppIcon size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.01em",
            }}
          >
            ShadowPay
          </span>
          <span
            style={{ fontSize: 11, color: "rgba(235,235,245,.55)", flexShrink: 0 }}
          >
            {sale.t}
          </span>
        </div>
        <div
          style={{
            fontSize: 13,
            color: "rgba(235,235,245,.92)",
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Venda aprovada ·{" "}
          <span style={{ fontWeight: 600, fontFeatureSettings: '"tnum" 1' }}>
            {sale.val}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── lock screen: wallpaper + relógio + notificações caindo ── */
function LockScreen({ notifs }: { notifs: Notif[] }) {
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        background:
          "radial-gradient(115% 70% at 50% 4%, #241a48 0%, #100b25 42%, #050410 100%)",
      }}
    >
      <img
        src="/shadow-panther.png"
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: "60%",
          width: 190,
          transform: "translate(-50%,-50%)",
          opacity: 0.06,
          filter: "grayscale(.3) brightness(1.7)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(70% 40% at 50% 100%, rgba(124,58,237,.22), transparent 72%)",
        }}
      />

      {/* lock + data + relógio */}
      <div style={{ position: "relative", textAlign: "center", marginTop: 58 }}>
        <svg width="14" height="17" viewBox="0 0 15 18" style={{ opacity: 0.9, marginBottom: 8 }}>
          <rect x="1.5" y="7.5" width="12" height="9.5" rx="2.6" fill="rgba(255,255,255,.92)" />
          <path d="M4 7.5V5a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="rgba(255,255,255,.92)" strokeWidth="1.7" />
        </svg>
        <div style={{ fontFamily: "-apple-system, system-ui", fontSize: 14.5, fontWeight: 500, color: "rgba(255,255,255,.9)" }}>
          sexta-feira, 30 de maio
        </div>
        <div
          style={{
            fontFamily: "-apple-system, system-ui",
            fontSize: 70,
            fontWeight: 600,
            color: "#fff",
            lineHeight: 1.0,
            letterSpacing: "-1px",
            marginTop: 2,
            textShadow: "0 2px 26px rgba(0,0,0,.35)",
          }}
        >
          9:41
        </div>
      </div>

      {/* pilha de notificações (mais nova no topo) */}
      <div
        style={{
          position: "absolute",
          left: 11,
          right: 11,
          bottom: 28,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {notifs.map((n, idx) => (
          <div
            key={n.id}
            style={{
              opacity: idx >= 3 ? 0.5 : 1,
              transform: idx >= 3 ? "scale(.96)" : "none",
              transformOrigin: "center bottom",
            }}
          >
            <LSNotif sale={n} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── frame realista do iPhone ── */
function IPhone({ notifs, w = 290, h = 626 }: { notifs: Notif[]; w?: number; h?: number }) {
  return (
    <div style={{ position: "relative" }}>
      <div className="sp-iphone" style={{ width: w, height: h }}>
        <div className="sp-iphone-screen">
          <LockScreen notifs={notifs} />
          <div className="sp-di">
            <span className="sp-di-cam" />
          </div>
          <div className="sp-gloss" />
          <div
            style={{
              position: "absolute",
              bottom: 9,
              left: "50%",
              transform: "translateX(-50%)",
              width: 108,
              height: 4.5,
              borderRadius: 99,
              background: "rgba(255,255,255,.55)",
              zIndex: 41,
            }}
          />
        </div>
        {/* botões laterais */}
        <span className="sp-ipbtn" style={{ left: -3, top: "21%", width: 3, height: 26, borderRadius: "3px 0 0 3px" }} />
        <span className="sp-ipbtn" style={{ left: -3, top: "30%", width: 3, height: 46, borderRadius: "3px 0 0 3px" }} />
        <span className="sp-ipbtn" style={{ left: -3, top: "41%", width: 3, height: 46, borderRadius: "3px 0 0 3px" }} />
        <span className="sp-ipbtn" style={{ right: -3, top: "33%", width: 3, height: 70, borderRadius: "0 3px 3px 0" }} />
      </div>
      <div className="sp-phone-shadow" />
    </div>
  );
}

export default function Login() {
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState<"intro" | "phone">("intro");
  const router = useRouter();
  const { login, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) router.push("/v1/dashboard");
  }, [isAuthenticated, router]);

  // intro cinematográfica (silhueta → logo real) → depois o iPhone
  useEffect(() => {
    setPhase("intro");
    setNotifs([]);
    const t = setTimeout(() => setPhase("phone"), 3300);
    return () => clearTimeout(t);
  }, [runId]);

  // notificações de venda caindo a cada ~2.6s (só na fase do iPhone)
  useEffect(() => {
    if (phase !== "phone") return;
    setNotifs([]);
    let i = 0;
    const age = (t: string) =>
      t === "agora"
        ? "1 min atrás"
        : t === "1 min atrás"
        ? "2 min atrás"
        : t === "2 min atrás"
        ? "4 min atrás"
        : "8 min atrás";
    const drop = () => {
      const val = SALE_VALUES[i % SALE_VALUES.length];
      const id = Date.now() + "-" + i;
      setNotifs((prev) =>
        [
          { val, t: "agora", id, fresh: true } as Notif,
          ...prev.map((p) => ({ ...p, fresh: false, t: age(p.t) })),
        ].slice(0, 4)
      );
      i++;
    };
    const first = setTimeout(drop, 700);
    const iv = setInterval(drop, 2600);
    return () => {
      clearTimeout(first);
      clearInterval(iv);
    };
  }, [runId]);

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
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
    },
    [email, password, login, router]
  );

  const lbl: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 500,
    color: T.inkSecondary,
    marginBottom: 7,
  };

  return (
    <>
      <Head>
        <title>ShadowPay — Acesso</title>
      </Head>

      <style>{CSS}</style>

      <div
        className="grid min-h-screen w-full lg:grid-cols-[1.05fr_1fr]"
        style={{ fontFamily: FONT, background: T.canvas, color: T.ink }}
      >
        {/* ===== ESQUERDA — showcase cinematográfico (palco escuro) ===== */}
        <section
          onClick={() => setRunId((r) => r + 1)}
          title="Reproduzir novamente"
          className="relative hidden cursor-pointer flex-col items-center justify-center overflow-hidden lg:flex"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 0%, #241a48 0%, #15102f 46%, #0a0818 100%)",
          }}
        >
          {/* brilho violeta no rodapé + grão */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 38% at 50% 100%, rgba(124,58,237,0.22), transparent 72%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.9) 0.5px, transparent 0.5px)",
              backgroundSize: "4px 4px",
            }}
          />

          {/* INTRO — silhueta da pantera se formando → logo real */}
          {phase === "intro" && (
            <div className="sp-intro">
              <div className="sp-draw-wrap">
                <span className="sp-draw-sil" />
                <span className="sp-draw-scan" />
                <span className="sp-draw-real" />
              </div>
            </div>
          )}

          {/* PHONE — iPhone com notificações de venda caindo */}
          {phase === "phone" && (
            <div className="relative flex flex-col items-center">
              <div className="sp-headline-in relative mb-8 max-w-[400px] px-8 text-center">
                <h2
                  style={{
                    fontFamily: FONT,
                    fontSize: 28,
                    fontWeight: 300,
                    lineHeight: 1.14,
                    letterSpacing: "-0.8px",
                    color: "#fff",
                  }}
                >
                  Cada venda aprovada,{" "}
                  <span style={{ fontWeight: 600, color: "#C4B5FD" }}>
                    no seu bolso na hora.
                  </span>
                </h2>
                <p className="mt-2.5 text-[13.5px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Notificações em tempo real direto no seu celular.
                </p>
              </div>

              <div className="sp-phone-enter relative">
                <div className="sp-bob">
                  <IPhone notifs={notifs} />
                </div>
              </div>
            </div>
          )}

          {/* marca no canto */}
          <div className="absolute left-7 top-7 flex items-center gap-2.5">
            <AppIcon size={30} />
            <span className="text-[14px] font-semibold tracking-tight text-white/90">
              ShadowPay
            </span>
          </div>
        </section>

        {/* ===== DIREITA — formulário bank-grade (white) ===== */}
        <div className="relative flex items-center justify-center px-5 py-10 sm:px-10">
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 h-40 w-full"
            style={{
              background:
                "radial-gradient(60% 100% at 85% 0%, rgba(124,58,237,0.06), transparent 70%)",
            }}
          />
          <div className="relative w-full max-w-[372px]">
            {/* Brand lockup */}
            <div className="mb-9 flex items-center gap-3">
              <AppIcon size={36} />
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: T.ink,
                }}
              >
                ShadowPay
              </span>
              <span
                className="ml-auto rounded-full px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.14em]"
                style={{
                  color: T.inkMute,
                  border: `1px solid ${T.hairline}`,
                }}
              >
                Instituição de pagamento
              </span>
            </div>

            <h1
              style={{
                fontFamily: FONT,
                fontSize: 27,
                fontWeight: 600,
                letterSpacing: "-0.6px",
                color: T.ink,
                margin: 0,
              }}
            >
              Acesse sua conta
            </h1>
            <p className="mb-7 mt-1.5 text-[14px]" style={{ color: T.inkMute }}>
              Entre para gerenciar pagamentos, saques e relatórios da sua
              operação.
            </p>

            <form onSubmit={handleLogin}>
              <label style={lbl}>E-mail ou CNPJ</label>
              <input
                className="sp-field"
                type="text"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                style={{ marginBottom: 16 }}
              />

              <label style={lbl}>Senha</label>
              <div style={{ position: "relative", marginBottom: 14 }}>
                <input
                  className="sp-field"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  style={{ paddingRight: 46 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-1.5 top-1.5 flex h-[38px] w-[38px] items-center justify-center rounded-lg text-slate-400 transition-colors hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>

              <div className="mb-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setRemember((r) => !r)}
                  className="flex items-center gap-2.5"
                >
                  <span
                    className="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] transition-colors"
                    style={{
                      border: `1px solid ${remember ? T.primary : T.hairlineInput}`,
                      background: remember ? T.primary : "transparent",
                    }}
                  >
                    {remember && <Check className="h-3 w-3 text-white" />}
                  </span>
                  <span className="text-[13px]" style={{ color: T.inkSecondary }}>
                    Manter conectado
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-[13px] font-semibold transition-opacity hover:opacity-70"
                  style={{ color: T.primary }}
                >
                  Esqueci minha senha
                </button>
              </div>

              {/* CTA único — sólido, pílula, sem gradiente nem glow */}
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="group inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-full text-[14.5px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-45"
                style={{
                  background: isLoading ? T.primaryPress : T.primary,
                  boxShadow: "0 1px 2px rgba(13,37,61,0.12)",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) e.currentTarget.style.background = T.primaryPress;
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) e.currentTarget.style.background = T.primary;
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Verificando…
                  </>
                ) : (
                  <>
                    Acessar conta
                    <ArrowRight className="h-[17px] w-[17px] transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* divisor */}
            <div className="my-6 flex items-center gap-3.5">
              <div className="h-px flex-1" style={{ background: T.hairline }} />
              <span className="text-[11px]" style={{ color: T.inkFaint }}>
                ou
              </span>
              <div className="h-px flex-1" style={{ background: T.hairline }} />
            </div>

            <p className="text-center text-[13.5px]" style={{ color: T.inkMute }}>
              Ainda não tem conta?{" "}
              <Link
                href="/auth/jwt/register"
                className="font-bold transition-opacity hover:opacity-70"
                style={{ color: T.primary }}
              >
                Abra a sua gratuitamente
              </Link>
            </p>

            {/* rodapé de confiança */}
            <div
              className="mt-9 pt-5"
              style={{ borderTop: `1px solid ${T.hairline}` }}
            >
              <div
                className="flex items-center gap-2 text-[11.5px]"
                style={{ color: T.inkMute }}
              >
                <ShieldCheck className="h-3.5 w-3.5" style={{ color: T.primary }} />
                Ambiente protegido · criptografia de ponta a ponta · 2FA
              </div>
              <p
                className="mt-3 text-[10.5px] leading-relaxed"
                style={{ color: T.inkFaint, fontFeatureSettings: '"tnum" 1' }}
              >
                © {new Date().getFullYear()} ShadowPay Pagamentos · Brasil
                (Português)
              </p>
            </div>
          </div>
        </div>

        <ForgotPasswordModal
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
        />
      </div>
    </>
  );
}

/* ===================== CSS (iPhone + animações) ===================== */
const CSS = `
.sp-iphone {
  position: relative;
  border-radius: 52px;
  padding: 9px;
  background: linear-gradient(135deg,#48484a 0%,#2c2c2e 28%,#1c1c1e 68%,#3a3a3c 100%);
  box-shadow:
    0 0 0 2px rgba(255,255,255,0.05) inset,
    0 46px 80px -38px rgba(22,13,46,0.55),
    0 24px 48px -28px rgba(124,58,237,0.30);
}
.sp-iphone-screen {
  position: relative;
  height: 100%;
  width: 100%;
  border-radius: 44px;
  overflow: hidden;
  background: #000;
}
.sp-di {
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  width: 90px; height: 29px; border-radius: 999px; background: #000; z-index: 40;
  display: flex; align-items: center; justify-content: flex-end; padding-right: 11px;
}
.sp-di-cam {
  width: 9px; height: 9px; border-radius: 999px;
  background: radial-gradient(circle at 35% 30%, #2a2a4a, #050510);
  box-shadow: 0 0 0 1px rgba(255,255,255,0.05);
}
.sp-gloss {
  position: absolute; inset: 0; border-radius: 44px; pointer-events: none; z-index: 42;
  background: linear-gradient(130deg, rgba(255,255,255,0.10) 0%, transparent 26%);
}
.sp-ipbtn {
  position: absolute; background: linear-gradient(180deg,#3a3a3c,#1c1c1e);
}
.sp-phone-shadow {
  position: absolute; bottom: -26px; left: 50%; transform: translateX(-50%);
  width: 62%; height: 38px; border-radius: 50%;
  background: rgba(22,13,46,0.28); filter: blur(26px); z-index: -1;
}
.sp-ls-notif {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 12px; border-radius: 18px;
  background: rgba(38,38,44,0.60);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  border: 0.5px solid rgba(255,255,255,0.09);
}
@keyframes sp-ls-in {
  0% { opacity: 0; transform: translateY(-14px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.sp-fresh { animation: sp-ls-in 0.5s cubic-bezier(0.22,1,0.36,1); }
@keyframes sp-float {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-9px); }
}
.sp-bob { animation: sp-float 5.5s ease-in-out infinite; }
@keyframes sp-phone-enter {
  0% { opacity: 0; transform: translateY(38px) scale(0.93); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.sp-phone-enter { animation: sp-phone-enter 0.9s cubic-bezier(0.22,1,0.36,1) both; }
.sp-field {
  height: 46px; width: 100%; border-radius: 10px; padding: 0 14px;
  background: ${"#FFFFFF"}; border: 1px solid ${"#DCE3EC"}; color: ${"#0F172A"};
  font-size: 14px; outline: none;
  transition: border-color .15s, box-shadow .15s;
}
.sp-field::placeholder { color: #94A3B8; }
.sp-field:focus { border-color: #7C3AED; box-shadow: 0 0 0 3px rgba(124,58,237,0.12); }
.sp-field:disabled { opacity: 0.6; }

/* ===== Intro cinematográfica (silhueta → logo real) ===== */
.sp-intro {
  position: absolute; inset: 0; z-index: 5;
  display: flex; align-items: center; justify-content: center;
}
.sp-draw-wrap {
  position: relative; width: 170px; height: 215px;
  animation: sp-wrap-out 0.55s ease 2.78s forwards;
}
/* silhueta da pantera (violeta) revelada de baixo pra cima */
.sp-draw-sil {
  position: absolute; inset: 0;
  background: linear-gradient(160deg,#A78BFA,#7C3AED 52%,#5B21B6);
  -webkit-mask: url(/shadow-panther.png) center / contain no-repeat;
          mask: url(/shadow-panther.png) center / contain no-repeat;
  clip-path: inset(0 0 100% 0);
  filter: drop-shadow(0 0 14px rgba(124,58,237,0.55));
  animation: sp-reveal 1.7s cubic-bezier(.45,0,.15,1) forwards;
}
@keyframes sp-reveal {
  0%   { clip-path: inset(0 0 100% 0); }
  100% { clip-path: inset(0 0 0 0); }
}
/* linha de scan subindo durante a formação */
.sp-draw-scan {
  position: absolute; left: -14%; right: -14%; height: 3px; bottom: 0; opacity: 0;
  border-radius: 3px;
  background: linear-gradient(90deg, transparent, #C4B5FD 32%, #fff 50%, #C4B5FD 68%, transparent);
  box-shadow: 0 0 20px 6px rgba(167,139,250,0.55);
  animation: sp-scan 1.7s cubic-bezier(.45,0,.15,1) forwards;
}
@keyframes sp-scan {
  0%   { bottom: 0; opacity: 0; }
  7%   { opacity: 1; }
  88%  { opacity: 1; }
  100% { bottom: 100%; opacity: 0; }
}
/* logo cromada REAL aparece com glow */
.sp-draw-real {
  position: absolute; inset: 0; opacity: 0;
  background: url(/shadow-panther.png) center / contain no-repeat;
  animation: sp-real 1.4s ease 1.5s forwards;
}
@keyframes sp-real {
  0%   { opacity: 0; transform: scale(0.92); filter: drop-shadow(0 0 0 rgba(124,58,237,0)); }
  45%  { opacity: 1; transform: scale(1.03); filter: drop-shadow(0 12px 34px rgba(124,58,237,0.6)) drop-shadow(0 0 18px rgba(196,181,253,0.5)); }
  72%  { transform: scale(1); }
  100% { opacity: 1; transform: scale(1); filter: drop-shadow(0 8px 24px rgba(124,58,237,0.4)); }
}
@keyframes sp-wrap-out {
  to { opacity: 0; transform: scale(1.08); filter: blur(3px); }
}
.sp-headline-in { animation: sp-fade-up 0.7s ease 0.15s both; }
@keyframes sp-fade-up {
  0%   { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}
`;
