import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/* iPhone 18 Pro Max (moldura recortada em /login/iphone-frame.png) com a tela
 * de bloqueio recebendo notificações de venda da ShadowPay. Usado no login e
 * no hero da landing. A largura vem do pai (o celular ocupa 100% dele). */

const ICON = "/shadow-ninja-icon.png";
const FRAME = "/login/iphone-frame.png";

const SALES = [
  ["Mentoria Escala", 997], ["Consultoria VIP", 1490], ["Kit Premium", 289.9], ["Curso Lançamento", 297],
  ["Comunidade Elite", 197], ["Acesso Vitalício", 890], ["Workshop Tráfego", 540], ["Assinatura Pro", 79.9],
] as const;
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function PhoneSales({ active = true, every = 1900, max = 4 }: { active?: boolean; every?: number; max?: number }) {
  const [list, setList] = useState<{ id: number; name: string; value: number }[]>([]);
  const [now, setNow] = useState<Date | null>(null);
  const [w, setW] = useState(300);
  const seq = useRef(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => { setNow(new Date()); }, []);
  // tamanhos internos proporcionais à largura real do celular
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth || 300));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (!active) { setList([]); return; }
    const push = () => {
      const s = SALES[seq.current % SALES.length]!;
      const id = ++seq.current; // fora do updater: no StrictMode ele roda depois e repetiria o id
      setList((p) => [{ id, name: s[0], value: s[1] }, ...p.filter((x) => x.id !== id)].slice(0, max));
    };
    push();
    const iv = setInterval(push, every);
    return () => clearInterval(iv);
  }, [active, every, max]);

  const hh = now ? now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "21:47";
  const dd = now ? now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }) : "";

  return (
    <div className="ps" ref={box} style={{ ["--pw" as string]: `${w}px` }}>
      <style dangerouslySetInnerHTML={{ __html: PS_CSS }} />
      <div className="ps-screen">
        <div className="ps-wall" />
        <div className="ps-status"><span>{hh}</span><span className="r">5G ▮▮▮ ▭</span></div>
        <div className="ps-clock"><small>{dd}</small><b>{hh}</b></div>
        <div className="ps-notifs">
            {list.map((n, i) => (
              <motion.div
                key={n.id}
                layout
                className="ps-notif"
                initial={{ y: -46, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: i >= max - 1 ? 0.4 : 1 - i * 0.1, scale: 1 - i * 0.03 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
              >
                <span className="ic"><img src={ICON} alt="" /></span>
                <div className="tx">
                  <div className="top"><b>ShadowPay</b><span>{i === 0 ? "agora" : `${i * 2} min atrás`}</span></div>
                  <strong>Venda aprovada!</strong>
                  <small>Pix · {brl(n.value)} — {n.name}</small>
                </div>
              </motion.div>
            ))}
        </div>
        <div className="ps-home" />
      </div>
      <img src={FRAME} alt="iPhone 18 Pro Max" className="ps-frame" />
    </div>
  );
}

const PS_CSS = `
.ps{position:relative;width:100%;font-family:var(--font-inter),Inter,ui-sans-serif,system-ui,sans-serif;color:#fff}
.ps-frame{position:relative;z-index:2;display:block;width:100%;height:auto;pointer-events:none}
.ps-screen{position:absolute;z-index:1;left:4.91%;right:4.91%;top:1.98%;bottom:2.13%;border-radius:calc(var(--pw) * .115);overflow:hidden;background:#0b0716}
.ps-wall{position:absolute;inset:0;background:
  radial-gradient(120% 60% at 20% 10%,rgba(167,139,250,.55),transparent 60%),
  radial-gradient(100% 60% at 90% 80%,rgba(91,33,182,.7),transparent 60%),
  linear-gradient(180deg,#2a1458,#0b0716 70%)}
.ps-status{position:absolute;left:0;right:0;top:3.2%;display:flex;justify-content:space-between;padding:0 11%;font-size:calc(var(--pw) * .042);font-weight:600}
.ps-status .r{letter-spacing:.06em;font-size:calc(var(--pw) * .032)}
.ps-clock{position:absolute;left:0;right:0;top:9%;text-align:center}
.ps-clock small{display:block;font-size:calc(var(--pw) * .048);font-weight:600;color:rgba(255,255,255,.85);text-transform:capitalize}
.ps-clock b{display:block;font-size:calc(var(--pw) * .25);font-weight:700;letter-spacing:-.02em;line-height:1;color:rgba(255,255,255,.92)}
.ps-notifs{position:absolute;left:5%;right:5%;top:35%;display:flex;flex-direction:column;gap:calc(var(--pw) * .02)}
.ps-notif{display:flex;align-items:center;gap:calc(var(--pw) * .03);padding:calc(var(--pw) * .032) calc(var(--pw) * .035);border-radius:calc(var(--pw) * .07);
  background:linear-gradient(180deg,rgba(255,255,255,.2),rgba(255,255,255,.1));backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);
  border:.5px solid rgba(255,255,255,.25);box-shadow:inset 0 .5px 0 rgba(255,255,255,.45),0 10px 24px -12px rgba(0,0,0,.6);transform-origin:top center}
.ps-notif .ic{width:calc(var(--pw) * .115);aspect-ratio:1;flex-shrink:0;border-radius:24%;display:grid;place-items:center;background:linear-gradient(150deg,#2a1755,#130b26);box-shadow:inset 0 .5px 0 rgba(255,255,255,.3)}
.ps-notif .ic img{width:84%;height:84%;object-fit:contain}
.ps-notif .tx{flex:1;min-width:0;line-height:1.22}
.ps-notif .top{display:flex;justify-content:space-between;font-size:calc(var(--pw) * .034);color:rgba(255,255,255,.65)}
.ps-notif .top b{font-weight:600;color:rgba(255,255,255,.78)}
.ps-notif strong{display:block;font-size:calc(var(--pw) * .042);font-weight:700}
.ps-notif small{display:block;font-size:calc(var(--pw) * .037);color:rgba(255,255,255,.88);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ps-home{position:absolute;left:50%;bottom:1.6%;width:36%;height:calc(var(--pw) * .013);translate:-50% 0;border-radius:99px;background:rgba(255,255,255,.85)}
`;
