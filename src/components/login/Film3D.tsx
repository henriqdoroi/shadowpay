import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, animate, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import { RotateCcw } from "lucide-react";
import PhoneSales from "@/components/PhoneSales";

/**
 * Filme 3D do login (lado direito). Câmera em perspectiva real (CSS 3D):
 *  1. tracking shot em Dubai: câmera orbita/avança, pista 3D correndo até o
 *     horizonte, postes passando em primeiro plano, Porsche 911 GT3 RS com o
 *     ninja oficial ao volante (sempre virado pra câmera), HUD de faturamento;
 *  2. o carro arranca → clarão → câmera sobe e a cidade desfoca;
 *  3. logo ShadowPay EXTRUDADA em 3D gira e sobe;
 *  4. iPhone 18 Pro Max com espessura entra girando e recebe vendas.
 * O mouse move a câmera e inclina o iPhone.
 */

const ICON = "/shadow-ninja-icon.png";
const NINJA = "/shadow-ninja.png";
const ART = { city: "/login/dubai.jpg", car: "/login/porsche.png", phone: "/login/iphone-frame.png" };

const AT = { exit: 4800, logo: 6000, phone: 6900, sales: 8200 };
type Phase = "load" | "drive" | "exit" | "logo" | "phone" | "sales";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Hud({ running }: { running: boolean }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t0 = performance.now();
    let raf = 0;
    const loop = (t: number) => {
      const p = Math.min(1, (t - t0) / 4400);
      setV(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);
  return (
    <div className="f3-hud">
      <div><small>km/h</small><b>{Math.round(v * 287)}</b></div>
      <i />
      <div><small>Faturado hoje</small><b className="g">{brl(Math.round(v * 248390))}</b></div>
    </div>
  );
}

/* logo extrudada: N camadas da logo empilhadas em Z */
function Logo3D({ ry }: { ry: MotionValue<number> }) {
  const layers = 14;
  return (
    <motion.div className="f3-logo3d" style={{ rotateY: ry }}>
      {Array.from({ length: layers }).map((_, i) => {
        const k = layers - 1 - i; // de trás pra frente
        const front = k === 0;
        return (
          <img key={k} src={ICON} alt="" style={{
            transform: `translateZ(${-k * 2.2}px)`,
            filter: front ? "drop-shadow(0 0 24px rgba(167,139,250,.65))" : `brightness(${0.35 - k * 0.012}) saturate(1.4)`,
          }} />
        );
      })}
    </motion.div>
  );
}

export default function Film3D() {
  const [phase, setPhase] = useState<Phase>("load");
  const [run, setRun] = useState(0);
  const stage = useRef<HTMLDivElement>(null);

  // câmera: órbita (ry), inclinação (rx) e avanço (cz) + mouse
  const ry = useMotionValue(-14), rx = useMotionValue(7), cz = useMotionValue(-160);
  const mx = useSpring(0, { stiffness: 50, damping: 18 }), my = useSpring(0, { stiffness: 50, damping: 18 });
  const camRY = useTransform([ry, mx] as MotionValue<number>[], ([a, b]) => (a as number) + (b as number) * 6);
  const camRX = useTransform([rx, my] as MotionValue<number>[], ([a, b]) => (a as number) - (b as number) * 4);
  const carRY = useTransform(camRY, (v) => -v * 0.9); // o carro "olha" pra câmera
  const logoRY = useMotionValue(-70);
  const phoneRY = useTransform([mx] as MotionValue<number>[], ([a]) => -16 + (a as number) * 14);
  const phoneRX = useTransform([my] as MotionValue<number>[], ([a]) => 6 + (a as number) * -8);

  // pré-carrega as artes
  useEffect(() => {
    let alive = true;
    Promise.all([ART.city, ART.car, ART.phone, NINJA, ICON].map((src) => {
      const im = new Image();
      im.src = src;
      return im.decode().catch(() => undefined);
    })).then(() => { if (alive) setPhase("drive"); });
    return () => { alive = false; };
  }, []);

  // linha do tempo
  useEffect(() => {
    if (phase === "load") return;
    setPhase("drive");
    ry.set(-14); rx.set(7); cz.set(-160); logoRY.set(-70);
    const anims = [
      animate(ry, 12, { duration: 5.2, ease: "linear" }),
      animate(cz, 60, { duration: 5.2, ease: [0.2, 0, 0.4, 1] }),
    ];
    const ts = [
      setTimeout(() => setPhase("exit"), AT.exit),
      setTimeout(() => {
        setPhase("logo");
        anims.push(animate(ry, 0, { duration: 1.4, ease: [0.16, 1, 0.3, 1] }));
        anims.push(animate(rx, -6, { duration: 1.4, ease: [0.16, 1, 0.3, 1] }));
        anims.push(animate(cz, -220, { duration: 1.6, ease: [0.16, 1, 0.3, 1] }));
        anims.push(animate(logoRY, [-70, 380, 360], { duration: 1.8, ease: [0.16, 1, 0.3, 1], times: [0, 0.75, 1] }));
      }, AT.logo),
      setTimeout(() => setPhase("phone"), AT.phone),
      setTimeout(() => setPhase("sales"), AT.sales),
    ];
    return () => { ts.forEach(clearTimeout); anims.forEach((a) => a.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, phase === "load"]);

  // mouse → câmera / iPhone
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const on = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
      my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
    };
    const off = () => { mx.set(0); my.set(0); };
    el.addEventListener("pointermove", on);
    el.addEventListener("pointerleave", off);
    return () => { el.removeEventListener("pointermove", on); el.removeEventListener("pointerleave", off); };
  }, [mx, my]);

  const driving = phase === "drive" || phase === "exit";
  const after = phase === "logo" || phase === "phone" || phase === "sales";
  const phoneIn = phase === "phone" || phase === "sales";

  return (
    <div className={"f3" + (phase === "load" ? " is-load" : "")} ref={stage}>
      <style dangerouslySetInnerHTML={{ __html: F3_CSS }} />

      {/* ===== mundo 3D (câmera) ===== */}
      <div className="f3-view">
        <motion.div className="f3-cam" style={{ rotateY: camRY, rotateX: camRX, z: cz }}>
          {/* cidade lá no fundo */}
          <motion.div
            className="f3-city"
            style={{ backgroundImage: `url(${ART.city})` }}
            animate={after ? { filter: "blur(8px) brightness(.32) saturate(1.2)" } : { filter: "blur(0px) brightness(1) saturate(1.1)" }}
            transition={{ duration: after ? 1.4 : 0.6 }}
          />
          {/* pista 3D */}
          <motion.div className="f3-road" animate={{ opacity: after ? 0 : 1 }} transition={{ duration: 0.8 }}>
            <div className="f3-asphalt" />
            <div className="f3-lanes" />
            <div className="f3-edge l" /><div className="f3-edge r" />
          </motion.div>
          {/* postes de luz passando (em Z, primeiro plano) */}
          {driving && (
            <div className="f3-poles">{[0, 1, 2].map((k) => <i key={k} style={{ animationDelay: `${k * 0.7}s` }} />)}</div>
          )}
          {/* carro */}
          <AnimatePresence>
            {driving && (
              <motion.div
                className="f3-car"
                style={{ rotateY: carRY }}
                initial={{ x: "-140%" }}
                animate={phase === "exit" ? { x: "170%", z: 160 } : { x: "0%", z: 0 }}
                exit={{ opacity: 0 }}
                transition={phase === "exit" ? { duration: 0.8, ease: [0.55, 0, 0.9, 0.4] } : { duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="f3-car-bob">
                  <img src={NINJA} alt="" className="f3-driver" />
                  <img src={ART.car} alt="Porsche 911 GT3 RS" className="f3-car-img" />
                  <span className="f3-wheel w1" /><span className="f3-wheel w2" />
                  <span className="f3-beam" />
                  <span className="f3-tail" />
                </div>
                <span className="f3-shadow" />
                {phase === "exit" && <span className="f3-trail" />}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <div className="f3-vignette" />

      {/* ===== HUD / legenda ===== */}
      <motion.div className="f3-tag" animate={{ opacity: driving ? 1 : 0 }}>DUBAI · SHEIKH ZAYED RD · 21:47</motion.div>
      <motion.div className="f3-hud-wrap" animate={{ opacity: driving ? 1 : 0, y: driving ? 0 : 10 }}>
        <Hud running={phase !== "load"} />
      </motion.div>

      {phase === "logo" && <motion.div className="f3-flash" initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 1.1 }} />}

      {/* ===== logo 3D + iPhone 3D ===== */}
      <div className="f3-front">
        <motion.div
          className="f3-logo"
          initial={false}
          animate={after ? { opacity: 1, y: 0 } : { opacity: 0, y: 80 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <Logo3D ry={logoRY} />
          <span className="f3-word">Shadow<i>Pay</i></span>
          <small>Cada venda aprovada, no seu bolso na hora.</small>
        </motion.div>

        <motion.div
          className="f3-phone"
          initial={false}
          animate={phoneIn ? { y: "0%", opacity: 1, rotateZ: 0 } : { y: "75%", opacity: 0, rotateZ: 8 }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
        >
          <motion.div className="f3-phone-3d" style={{ rotateY: phoneRY, rotateX: phoneRX }}>
            <span className="f3-phone-edge" />
            <PhoneSales active={phase === "sales"} />
            <span className="f3-glare" />
          </motion.div>
        </motion.div>
      </div>

      {after && (
        <button className="f3-replay" onClick={() => setRun((r) => r + 1)} title="Reproduzir de novo">
          <RotateCcw size={14} /> Reproduzir
        </button>
      )}
    </div>
  );
}

const F3_CSS = `
.f3{position:absolute;inset:0;overflow:hidden;background:#05030b;color:#fff;font-family:var(--font-inter),Inter,ui-sans-serif,system-ui,sans-serif}
.f3.is-load>*{opacity:0}
.f3-view{position:absolute;inset:0;perspective:1100px;perspective-origin:50% 42%}
.f3-cam{position:absolute;inset:0;transform-style:preserve-3d}
.f3-city{position:absolute;left:-55%;right:-55%;top:-30%;bottom:-6%;background-size:cover;background-position:42% 62%;transform:translateZ(-700px) scale(1.65)}

/* pista em perspectiva */
.f3-road{position:absolute;left:-120%;right:-120%;bottom:-2%;height:260%;transform-origin:50% 100%;transform:rotateX(86deg);transform-style:preserve-3d;
  -webkit-mask:linear-gradient(0deg,#000 55%,transparent 92%);mask:linear-gradient(0deg,#000 55%,transparent 92%)}
.f3-asphalt{position:absolute;inset:0;background:
  radial-gradient(60% 30% at 50% 100%,rgba(124,58,237,.25),transparent 70%),
  repeating-linear-gradient(90deg,rgba(255,255,255,.012) 0 2px,transparent 2px 9px),
  linear-gradient(0deg,#0d0a16,#120e1f)}
.f3-lanes{position:absolute;inset:0;background:
  repeating-linear-gradient(0deg,transparent 0 90px,rgba(255,255,255,.75) 90px 170px,transparent 170px 260px) 50% 0/14px 100% no-repeat,
  repeating-linear-gradient(0deg,transparent 0 90px,rgba(255,255,255,.35) 90px 170px,transparent 170px 260px) 38% 0/10px 100% no-repeat,
  repeating-linear-gradient(0deg,transparent 0 90px,rgba(255,255,255,.35) 90px 170px,transparent 170px 260px) 62% 0/10px 100% no-repeat;
  animation:f3Lanes .32s linear infinite}
@keyframes f3Lanes{to{background-position:50% 260px,38% 260px,62% 260px}}
.f3-edge{position:absolute;top:0;bottom:0;width:8px;background:linear-gradient(0deg,#a78bfa,#7c3aed);box-shadow:0 0 30px 6px rgba(139,92,246,.6)}
.f3-edge.l{left:30%}.f3-edge.r{right:30%}

/* postes em primeiro plano, atravessando em Z */
.f3-poles{position:absolute;inset:0;transform-style:preserve-3d;pointer-events:none}
.f3-poles i{position:absolute;top:14%;left:50%;width:34px;height:34px;margin-left:-17px;border-radius:50%;
  background:radial-gradient(circle,#fff8e6 0%,rgba(255,200,120,.9) 30%,rgba(255,150,60,0) 70%);box-shadow:0 0 70px 28px rgba(255,170,80,.35);
  animation:f3Pole 2.1s linear infinite}
@keyframes f3Pole{from{transform:translate3d(520px,0,-900px);opacity:0}15%{opacity:1}to{transform:translate3d(-900px,40px,420px);opacity:1}}

/* carro */
.f3-car{position:absolute;left:8%;width:84%;bottom:11%;transform-style:preserve-3d}
.f3-car-bob{position:relative;animation:f3Bob .45s ease-in-out infinite alternate}
@keyframes f3Bob{to{transform:translateY(-2px) rotate(-.15deg)}}
.f3-car-img{position:relative;display:block;width:100%;height:auto;z-index:2;filter:drop-shadow(0 22px 20px rgba(0,0,0,.6))}
.f3-driver{position:absolute;z-index:1;left:42.5%;top:-4%;width:15%;transform:scaleX(-1) rotate(4deg);filter:brightness(.92) saturate(1.1)}
.f3-wheel{position:absolute;z-index:3;width:17.4%;aspect-ratio:1;translate:-50% -50%;border-radius:50%;pointer-events:none;mix-blend-mode:screen;opacity:.55;
  background:repeating-conic-gradient(from 0deg,rgba(255,255,255,0) 0 14deg,rgba(255,255,255,.22) 14deg 18deg);
  -webkit-mask:radial-gradient(circle,transparent 18%,#000 22%,#000 60%,transparent 63%);mask:radial-gradient(circle,transparent 18%,#000 22%,#000 60%,transparent 63%);
  filter:blur(1.5px);animation:f3Spin .12s linear infinite}
.f3-wheel.w1{left:21.9%;top:69.8%}.f3-wheel.w2{left:78.8%;top:71.4%}
@keyframes f3Spin{to{transform:rotate(360deg)}}
.f3-beam{position:absolute;z-index:1;right:-40%;top:50%;width:50%;height:30%;border-radius:50%;
  background:radial-gradient(ellipse at 0% 50%,rgba(255,255,255,.6),rgba(220,210,255,.14) 45%,transparent 70%);filter:blur(6px)}
.f3-tail{position:absolute;z-index:3;left:3%;top:36%;width:9%;height:6%;border-radius:4px;background:rgba(255,40,60,.85);filter:blur(5px);mix-blend-mode:screen;animation:f3Tail 1.2s ease-in-out infinite}
@keyframes f3Tail{50%{opacity:.6}}
.f3-shadow{position:absolute;left:4%;right:2%;bottom:-4%;height:10%;border-radius:50%;background:radial-gradient(ellipse,rgba(0,0,0,.8),transparent 70%);z-index:1}
.f3-trail{position:absolute;right:96%;top:30%;width:150%;height:44%;background:linear-gradient(90deg,transparent,rgba(196,181,253,.25) 60%,rgba(255,255,255,.55));filter:blur(14px);border-radius:50%}

.f3-vignette{position:absolute;inset:0;pointer-events:none;background:
  radial-gradient(120% 90% at 50% 40%,transparent 45%,rgba(5,3,11,.75) 100%),
  linear-gradient(180deg,rgba(5,3,11,.55) 0%,transparent 18%,transparent 78%,rgba(5,3,11,.7) 100%)}

/* HUD */
.f3-tag{position:absolute;left:32px;top:28px;z-index:8;font-family:var(--font-jetbrains),ui-monospace,monospace;font-size:11px;letter-spacing:.22em;color:rgba(255,255,255,.75)}
.f3-hud-wrap{position:absolute;left:32px;bottom:30px;z-index:8}
.f3-hud{display:flex;align-items:center;gap:18px;padding:12px 18px;border-radius:14px;background:rgba(10,7,20,.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.12)}
.f3-hud i{width:1px;height:30px;background:rgba(255,255,255,.15)}
.f3-hud small{display:block;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.6)}
.f3-hud b{display:block;font-size:22px;font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.f3-hud b.g{color:#4ade80}
.f3-flash{position:absolute;inset:0;z-index:9;pointer-events:none;background:radial-gradient(circle at 60% 60%,#fff,#c4b5fd 30%,rgba(124,58,237,.4) 60%,transparent 80%)}

/* logo 3D + iPhone 3D */
.f3-front{position:absolute;inset:0;z-index:7;perspective:900px;pointer-events:none}
.f3-logo{position:absolute;left:0;right:0;top:7%;display:flex;flex-direction:column;align-items:center;text-align:center}
.f3-logo3d{position:relative;width:clamp(78px,8.5vw,112px);aspect-ratio:1;transform-style:preserve-3d}
.f3-logo3d img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;backface-visibility:visible}
.f3-word{margin-top:8px;font-size:clamp(30px,3.3vw,44px);font-weight:700;letter-spacing:-.03em;
  text-shadow:0 1px 0 #c4b5fd,0 2px 0 #a78bfa,0 3px 0 #8b5cf6,0 4px 0 #7c3aed,0 5px 0 #6d28d9,0 6px 0 #5b21b6,0 14px 24px rgba(0,0,0,.6),0 0 40px rgba(139,92,246,.6)}
.f3-word i{font-style:italic;font-weight:500;color:#ddd6fe;margin-left:1px}
.f3-logo small{margin-top:8px;font-size:14px;color:rgba(255,255,255,.72)}
.f3-phone{position:absolute;left:50%;bottom:-18%;width:clamp(250px,23vw,330px);margin-left:calc(clamp(250px,23vw,330px) / -2);transform-style:preserve-3d}
/* sem filter aqui: filter achata o preserve-3d (a espessura sumiria) */
.f3-phone-3d{position:relative;transform-style:preserve-3d}
.f3-phone-3d .ps{filter:drop-shadow(0 40px 60px rgba(0,0,0,.65)) drop-shadow(0 0 50px rgba(124,58,237,.35))}
.f3-phone-edge{position:absolute;left:1.2%;right:1.2%;top:.6%;bottom:.6%;border-radius:13% / 6.2%;transform:translateZ(-16px);
  background:linear-gradient(90deg,#120d1f,#4a3f6b 12%,#1b1530 50%,#4a3f6b 88%,#120d1f)}
.f3-glare{position:absolute;left:5%;right:5%;top:2%;bottom:2%;border-radius:11% / 5.5%;pointer-events:none;z-index:3;
  background:linear-gradient(115deg,rgba(255,255,255,.14) 0%,rgba(255,255,255,0) 28%,rgba(255,255,255,0) 70%,rgba(255,255,255,.06) 100%)}

.f3-replay{position:absolute;right:20px;bottom:20px;z-index:10;display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.18);
  background:rgba(10,7,20,.5);color:rgba(255,255,255,.85);font-size:12px;cursor:pointer;backdrop-filter:blur(10px)}
.f3-replay:hover{background:rgba(255,255,255,.12)}
@media (max-height:760px){.f3-logo{top:5%}.f3-logo small{display:none}.f3-phone{bottom:-28%}}
@media (prefers-reduced-motion:reduce){.f3 *{animation:none!important}}
`;
