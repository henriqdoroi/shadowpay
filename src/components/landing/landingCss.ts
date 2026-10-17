/* Estilos da landing pública (/). Tudo prefixado com .spl-* para não vazar
 * pro app (o painel usa Tailwind/shadcn). */
export const LANDING_CSS = `
.spl{--bg:#07060d;--bg2:#0d0b18;--card:#120f22;--line:rgba(255,255,255,.08);--tx:#f5f3ff;--mut:#a7a3bd;
  --v:#7c3aed;--v2:#8b5cf6;--v3:#a78bfa;--v4:#c4b5fd;--light:#eef0f6;
  background:var(--bg);color:var(--tx);min-height:100vh;width:100%;overflow-x:clip;
  font-family:var(--font-inter),ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.spl *{box-sizing:border-box}
:where(.spl) a{color:inherit;text-decoration:none}
:where(.spl) img{display:block;max-width:100%}
:where(.spl) button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
.spl-wrap{width:100%;max-width:1180px;margin:0 auto;padding:0 20px}
.spl [id]{scroll-margin-top:72px}
html:has(.spl){scroll-behavior:smooth}
.ta-l{text-align:left!important}.ta-r{text-align:right}
.c-v{color:var(--v2)}

/* botões */
.spl-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;font-weight:700;
  letter-spacing:.02em;text-transform:uppercase;font-size:14px;padding:14px 28px;transition:transform .2s,box-shadow .25s,background .2s;white-space:nowrap}
.spl-btn:hover{transform:translateY(-2px)}
.spl-btn-primary{background:linear-gradient(135deg,#6d28d9 0%,#8b5cf6 55%,#7c3aed 100%);color:#fff;
  box-shadow:0 10px 30px -8px rgba(124,58,237,.75),inset 0 1px 0 rgba(255,255,255,.25)}
.spl-btn-primary:hover{box-shadow:0 16px 44px -8px rgba(139,92,246,.95),inset 0 1px 0 rgba(255,255,255,.3)}
.spl-btn-light{background:#fff;color:#14111f;box-shadow:0 10px 30px -10px rgba(255,255,255,.35)}
.spl-btn-ghost{color:#fff;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.04)}
.spl-btn-ghost:hover{background:rgba(255,255,255,.1)}
.spl-btn-sm{padding:10px 18px;font-size:12.5px}
.spl-btn-lg{padding:17px 36px;font-size:15px}
.spl-btn-block{width:100%}

/* nav */
.spl-nav{position:fixed;top:0;left:0;right:0;z-index:50;transition:background .3s,border-color .3s,backdrop-filter .3s;border-bottom:1px solid transparent}
.spl-nav.is-solid{background:rgba(9,7,18,.78);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-color:var(--line)}
.spl-nav-in{display:flex;align-items:center;gap:24px;height:72px}
.spl-logo{display:flex;align-items:center;gap:10px;flex-shrink:0}
.spl-logo-icon{width:36px;height:36px;border-radius:10px;background:#fff;display:grid;place-items:center;overflow:hidden;box-shadow:0 0 22px rgba(139,92,246,.55)}
.spl-logo-icon img{width:32px;height:32px;object-fit:contain}
.spl-logo-text{font-weight:800;font-size:20px;letter-spacing:-.02em}
.spl-logo-text em{font-style:normal;font-weight:500;color:var(--v3)}
.spl-nav-links{display:flex;gap:26px;margin-left:auto;font-size:14px;color:var(--mut)}
.spl-nav-links a:hover{color:#fff}
.spl-nav-cta{display:flex;gap:10px}
.spl-burger{display:none;margin-left:auto;width:42px;height:42px;border-radius:12px;align-items:center;justify-content:center;background:rgba(255,255,255,.06)}
.spl-mnav{display:none}
@media (max-width:900px){
  .spl-nav-links,.spl-nav-cta{display:none}
  .spl-burger{display:flex}
  .spl-mnav{display:flex;flex-direction:column;gap:4px;padding:8px 20px 22px;border-top:1px solid var(--line)}
  .spl-mnav>a{padding:13px 4px;font-size:16px;color:#ddd8f0;border-bottom:1px solid rgba(255,255,255,.05)}
  .spl-mnav-cta{display:grid;gap:10px;margin-top:14px}
}

/* hero */
.spl-hero{position:relative;padding:150px 0 0;overflow:hidden;
  background:radial-gradient(120% 70% at 50% -10%,#5b21b6 0%,#2e1065 38%,var(--bg) 72%)}
.spl-hero-grid{position:absolute;inset:0;pointer-events:none;
  background-image:linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px);
  background-size:64px 64px;mask-image:radial-gradient(80% 60% at 50% 20%,#000 30%,transparent 80%);-webkit-mask-image:radial-gradient(80% 60% at 50% 20%,#000 30%,transparent 80%)}
.spl-hero-arc{position:absolute;left:50%;top:150px;width:1700px;height:900px;transform:translateX(-50%);border-radius:50%;pointer-events:none;
  border-top:2px solid rgba(233,213,255,.9);
  box-shadow:0 -30px 80px -10px rgba(196,181,253,.75),inset 0 40px 90px -20px rgba(167,139,250,.7);
  animation:splArc 6s ease-in-out infinite}
@keyframes splArc{0%,100%{opacity:.85}50%{opacity:1;filter:brightness(1.15)}}
.spl-hero-in{position:relative;text-align:center;display:flex;flex-direction:column;align-items:center;padding-top:60px}
.spl-pill{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:600;color:#e9e3ff;padding:7px 14px;border-radius:999px;
  background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(8px);margin-bottom:22px}
.spl-pill svg{color:var(--v4)}
.spl-hero h1{margin:0;display:flex;flex-direction:column;gap:4px;letter-spacing:-.025em;line-height:1.08}
.spl-h1-a{font-size:clamp(26px,3.6vw,42px);font-weight:700;color:#e9e5f7}
.spl-h1-b{font-size:clamp(38px,5.6vw,68px);font-weight:800;color:#fff;text-shadow:0 0 40px rgba(167,139,250,.45)}
.spl-hero-in>p{max-width:640px;margin:20px auto 0;color:#d6d0ea;font-size:clamp(15px,1.4vw,17.5px);line-height:1.6}
.spl-hero-cta{display:flex;gap:14px;margin-top:34px;flex-wrap:wrap;justify-content:center}
.spl-dash-stage{position:relative;margin-top:56px;perspective:1400px}
.spl-dash-tilt{transform-origin:50% 0%;will-change:transform}

/* mockup dashboard */
.spl-dash{border-radius:20px 20px 0 0;background:linear-gradient(180deg,#110d22,#0a0815);border:1px solid rgba(167,139,250,.22);border-bottom:0;
  box-shadow:0 -20px 120px -30px rgba(139,92,246,.6),0 0 0 6px rgba(255,255,255,.02);padding:14px 16px 20px;overflow:hidden}
.spl-dash-top{display:flex;align-items:center;gap:20px;padding-bottom:12px;border-bottom:1px solid var(--line);overflow:hidden}
.spl-dash-brand{display:flex;align-items:center;gap:7px;font-weight:700;font-size:13px;flex-shrink:0}
.spl-dash-brand img{width:22px;height:22px;border-radius:6px;background:#fff;object-fit:contain}
.spl-dash-tabs{display:flex;gap:6px;font-size:11.5px;color:var(--mut)}
.spl-dash-tabs span{display:flex;align-items:center;gap:5px;padding:6px 10px;border-radius:8px;white-space:nowrap}
.spl-dash-tabs span.is-on{background:rgba(124,58,237,.9);color:#fff}
.spl-dash-body{display:grid;grid-template-columns:1.7fr 1fr .9fr;gap:12px;margin-top:14px}
.spl-dash-card{background:rgba(255,255,255,.025);border:1px solid var(--line);border-radius:14px;padding:14px}
.spl-dash-h{display:flex;justify-content:space-between;font-size:12px;color:var(--mut)}
.spl-dash-h em{font-style:normal;font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid var(--line)}
.spl-dash-big{font-size:22px;font-weight:800;margin:8px 0 6px;letter-spacing:-.02em}
.spl-dash-big small{font-size:11px;color:#34d399;font-weight:600;margin-left:6px}
.spl-chart{width:100%;height:150px;display:block}
.spl-chart-line{stroke-dasharray:1400;stroke-dashoffset:1400;animation:splDraw 2.4s .4s ease forwards}
.spl-chart-dot{animation:splPulse 2s ease-in-out infinite}
@keyframes splDraw{to{stroke-dashoffset:0}}
@keyframes splPulse{0%,100%{opacity:1}50%{opacity:.35}}
.spl-dash-kpis{display:flex;flex-direction:column;gap:8px}
.spl-dash-kpi{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.025);border:1px solid var(--line);border-radius:12px;padding:10px 12px}
.spl-dash-kpi b{display:block;font-size:14px}
.spl-dash-kpi small{font-size:11px;color:var(--mut)}
.spl-dash-ic{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;flex-shrink:0}
.spl-dash-sacar{margin-left:auto;font-size:10.5px;font-weight:700;padding:5px 10px;border-radius:7px;background:var(--v);color:#fff}
.spl-dash-prize{display:flex;flex-direction:column;gap:8px}
.spl-dash-prize-img{flex:1;min-height:120px;border-radius:10px;background:url(/dashboard-banner.webp) 43.7% 35.9%/888.9% auto no-repeat;
  box-shadow:0 0 30px -6px rgba(139,92,246,.6)}
.spl-dash-prize b{font-size:15px;color:#34d399}
.spl-dash-prog{height:8px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}
.spl-dash-prog i{display:block;height:100%;background:linear-gradient(90deg,#22c55e,#4ade80);border-radius:99px}
.spl-dash-prize small{font-size:10.5px;color:var(--mut)}
@media (max-width:860px){.spl-dash-body{grid-template-columns:1fr}.spl-dash-prize,.spl-dash-kpis .spl-dash-kpi:nth-child(n+3){display:none}
  .spl-hero{padding-top:110px}.spl-hero-arc{width:900px;height:600px;top:120px}}

/* integrações */
.spl-int{padding:80px 0 30px}
.spl-int-t{text-align:center;font-size:clamp(20px,2.4vw,26px);font-weight:600;color:#ddd8ef;margin:0 0 34px;padding:0 20px}
.spl-marquee{overflow:hidden;mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);-webkit-mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)}
.spl-marquee-track{display:flex;gap:14px;width:max-content;animation:splMarq 36s linear infinite}
.spl-marquee:hover .spl-marquee-track{animation-play-state:paused}
@keyframes splMarq{to{transform:translateX(calc(-50% - 7px))}}
.spl-int-chip{display:flex;align-items:center;gap:10px;padding:12px 20px 12px 12px;border-radius:14px;font-weight:600;font-size:14.5px;
  background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02));border:1px solid var(--line);white-space:nowrap}
.spl-int-ic{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;overflow:hidden}
.spl-int-ic img{width:22px;height:22px;object-fit:contain}

/* seções genéricas */
.spl-sec{padding:110px 0;position:relative}
.spl-h2{font-size:clamp(28px,3.6vw,44px);font-weight:800;letter-spacing:-.025em;line-height:1.12;text-align:center;margin:0 0 18px}
.spl-h2.is-dark{color:#14111f}
.spl-lead{color:var(--mut);font-size:clamp(15px,1.3vw,17px);line-height:1.65;text-align:center;max-width:620px;margin:0 auto 30px}
.spl-lead.is-dark{color:#4b4760}
.spl-lead b{font-weight:700}
.spl-grad{background:linear-gradient(90deg,#a78bfa,#8b5cf6 50%,#c4b5fd);-webkit-background-clip:text;background-clip:text;color:transparent}
.spl-grad-solid{color:#7c3aed}
.spl-split{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
.spl-split .spl-lead{margin-left:0}
@media (max-width:900px){.spl-split{grid-template-columns:1fr;gap:40px}.spl-split.is-rev>:first-child{order:2}.spl-sec{padding:80px 0}}

/* celular */
.spl-phone-stage{position:relative;height:520px;display:grid;place-items:center}
.spl-phone-glow{position:absolute;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(139,92,246,.55),transparent 65%);filter:blur(10px)}
.spl-phone{position:relative;width:250px;height:500px;border-radius:42px;padding:12px;background:linear-gradient(160deg,#2a2440,#0d0a18);
  border:1px solid rgba(255,255,255,.14);box-shadow:0 40px 90px -20px rgba(0,0,0,.8),0 0 60px -10px rgba(139,92,246,.6);transform:rotate(-6deg)}
.spl-phone-notch{position:absolute;top:20px;left:50%;transform:translateX(-50%);width:80px;height:22px;border-radius:12px;background:#000;z-index:2}
.spl-phone-scr{height:100%;border-radius:32px;background:linear-gradient(180deg,#151026,#0b0816);padding:52px 16px 16px;display:flex;flex-direction:column;gap:6px;overflow:hidden}
.spl-phone-scr>small{color:var(--mut);font-size:11px}
.spl-phone-scr>b{font-size:24px;letter-spacing:-.02em}
.spl-phone-scr .spl-chart{height:110px}
.spl-phone-tabs{display:flex;gap:6px;font-size:10.5px;margin:4px 0}
.spl-phone-tabs span{padding:4px 10px;border-radius:7px;background:rgba(255,255,255,.06)}
.spl-phone-tabs span.is-on{background:var(--v)}
.spl-phone-row{display:flex;justify-content:space-between;font-size:12px;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.04);color:var(--mut)}
.spl-phone-row b{color:#fff}
.spl-float{position:absolute;padding:12px 14px;border-radius:14px;background:rgba(22,17,40,.82);backdrop-filter:blur(12px);border:1px solid rgba(167,139,250,.28);
  box-shadow:0 20px 40px -12px rgba(0,0,0,.7);animation:splFloat 5s ease-in-out infinite;font-size:12px}
.spl-float small{display:block;color:var(--mut);font-size:10.5px}
.spl-float b{font-size:15px}
.spl-float em{font-style:normal;color:#34d399;font-size:11px;margin-left:6px}
.spl-float-a{left:0;top:70px}
.spl-float-b{right:4%;top:150px;display:flex;align-items:center;gap:10px;animation-delay:-1.5s}
.spl-float-c{right:0;bottom:70px;display:flex;align-items:center;gap:10px;animation-delay:-3s}
.spl-float-c svg{color:var(--v4)}
.spl-ring{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:12px;
  background:conic-gradient(var(--v2) 0 78%,rgba(255,255,255,.1) 0);mask:radial-gradient(circle,transparent 15px,#000 16px);-webkit-mask:radial-gradient(circle,transparent 15px,#000 16px);position:relative}
@keyframes splFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@media (max-width:520px){.spl-phone-stage{height:460px;transform:scale(.9)}.spl-float-a{left:-6px}.spl-float-c{right:-6px}}

/* recursos */
.spl-features{background:radial-gradient(60% 50% at 50% 100%,rgba(91,33,182,.35),transparent 70%)}
.spl-feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:44px}
.spl-feat{height:100%;text-align:center;padding:30px 26px;border-radius:18px;background:linear-gradient(180deg,rgba(91,33,182,.22),rgba(255,255,255,.02));
  border:1px solid rgba(167,139,250,.16);transition:transform .25s,border-color .25s,box-shadow .25s}
.spl-feat:hover{transform:translateY(-4px);border-color:rgba(167,139,250,.4);box-shadow:0 24px 60px -24px rgba(139,92,246,.7)}
.spl-feat-ic{width:52px;height:52px;border-radius:50%;display:inline-grid;place-items:center;color:#fff;
  background:radial-gradient(circle at 30% 30%,#a78bfa,#6d28d9);box-shadow:0 0 30px rgba(139,92,246,.7)}
.spl-feat-ic.sm{width:36px;height:36px}
.spl-feat h3{font-size:17px;margin:16px 0 10px;font-weight:700}
.spl-feat p{margin:0;color:var(--mut);font-size:14.5px;line-height:1.6}
@media (max-width:900px){.spl-feat-grid{grid-template-columns:1fr 1fr}}
@media (max-width:580px){.spl-feat-grid{grid-template-columns:1fr}}

/* seção clara */
.spl-light{background:var(--light);color:#14111f;padding:110px 0;border-radius:36px 36px 0 0;position:relative;z-index:1}
.spl-light .spl-split+.spl-split{margin-top:120px}
.spl-mt{margin-top:120px!important}
.spl-checks,.spl-ticks{list-style:none;padding:0;margin:0 0 30px;display:grid;gap:10px;font-size:14.5px}
.spl-checks li,.spl-ticks li{display:flex;align-items:center;gap:8px}
.spl-checks svg,.spl-ticks svg{color:var(--v);flex-shrink:0}
.spl-light .spl-checks{color:#3b3750}
.spl-ticks{display:flex;justify-content:center;flex-wrap:wrap;gap:8px 22px;color:var(--mut);margin-bottom:44px}
.spl-ticks svg{color:var(--v3)}
.spl-ck-stage{position:relative;height:440px;display:grid;place-items:center}
.spl-ck-orb{position:absolute;left:4%;top:12%;width:220px;height:220px;border-radius:50%;
  background:radial-gradient(circle at 35% 30%,#fff,#c4b5fd 30%,#7c3aed 70%,#4c1d95);box-shadow:0 30px 70px -10px rgba(124,58,237,.6);animation:splFloat 6s ease-in-out infinite}
.spl-ck-card{position:relative;width:300px;padding:22px;border-radius:22px;background:rgba(255,255,255,.62);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
  border:1px solid rgba(255,255,255,.9);box-shadow:0 30px 70px -20px rgba(76,29,149,.35);margin-left:60px}
.spl-ck-h{display:flex;justify-content:space-between;align-items:center}
.spl-ck-h small{display:flex;align-items:center;gap:4px;font-size:10.5px;color:#16a34a}
.spl-ck-k{display:block;margin-top:14px;font-size:11px;color:#6b6780}
.spl-ck-total{font-size:30px;font-weight:800;letter-spacing:-.02em}
.spl-ck-methods{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0}
.spl-ck-methods span{display:flex;align-items:center;justify-content:center;gap:6px;padding:9px;border-radius:10px;border:1px solid #e3e0ee;font-size:12.5px;font-weight:600;background:#fff}
.spl-ck-methods span.is-on{border-color:var(--v);color:var(--v);background:#f5f0ff}
.spl-ck-qr{display:flex;align-items:center;gap:12px;padding:12px;border-radius:12px;background:#fff;border:1px dashed #d8d2ea;color:#14111f}
.spl-ck-qr b{display:block;font-size:13px}.spl-ck-qr small{font-size:11px;color:#6b6780}
.spl-ck-btn{margin-top:14px;text-align:center;padding:13px;border-radius:12px;font-weight:700;color:#fff;background:linear-gradient(135deg,#6d28d9,#8b5cf6);box-shadow:0 10px 24px -8px rgba(124,58,237,.7)}
.spl-ck-toast{position:absolute;right:2%;bottom:36px;display:flex;align-items:center;gap:7px;padding:11px 16px;border-radius:12px;background:#14111f;color:#fff;font-size:13px;font-weight:600;
  box-shadow:0 20px 40px -12px rgba(0,0,0,.45);animation:splFloat 5s ease-in-out infinite}
.spl-ck-toast svg{color:#4ade80}
.spl-sup-stage{display:grid;place-items:center;padding:20px 0;position:relative}
.spl-sup-stage:before{content:"";position:absolute;width:320px;height:320px;border-radius:50%;background:radial-gradient(circle,rgba(139,92,246,.35),transparent 65%)}
.spl-sup-card{position:relative;width:min(340px,100%);padding:20px;border-radius:22px;background:rgba(255,255,255,.66);backdrop-filter:blur(18px);border:1px solid #fff;box-shadow:0 30px 70px -20px rgba(76,29,149,.3);display:grid;gap:10px}
.spl-sup-head{display:flex;align-items:center;gap:10px;padding-bottom:8px}
.spl-sup-head b,.spl-sup-row b{display:block;font-size:14px}
.spl-sup-head small,.spl-sup-row small{font-size:11.5px;color:#6b6780}
.spl-sup-row{display:flex;align-items:center;gap:10px;padding:10px;border-radius:12px;background:#fff;border:1px solid #ebe8f3}
.spl-sup-row>span{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:#f1ebff;color:var(--v)}
.spl-sup-foot{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:12px;background:linear-gradient(135deg,#6d28d9,#8b5cf6);color:#fff;font-weight:700;font-size:13.5px}
.spl-sup-foot img{width:22px;height:22px;border-radius:6px;background:#fff}
.spl-infra{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:40px}
.spl-infra-card{height:100%;background:#fff;border-radius:20px;padding:18px 18px 26px;box-shadow:0 20px 50px -30px rgba(20,17,31,.35);transition:transform .25s}
.spl-infra-card:hover{transform:translateY(-4px)}
.spl-infra-art{height:190px;border-radius:14px;display:grid;place-items:center;background:radial-gradient(circle at 50% 40%,#ede4ff,#fff 70%)}
.spl-infra-art span{width:110px;height:110px;border-radius:30px;display:grid;place-items:center;color:#fff;
  background:radial-gradient(circle at 30% 25%,#c4b5fd,#7c3aed 55%,#4c1d95);box-shadow:0 24px 50px -12px rgba(124,58,237,.65),inset 0 2px 0 rgba(255,255,255,.4);transform:rotate(-8deg)}
.spl-infra-card h3{font-size:15.5px;margin:20px 6px 8px}
.spl-infra-card p{margin:0 6px;font-size:14px;color:#55516a;line-height:1.6}
@media (max-width:900px){.spl-infra{grid-template-columns:1fr}.spl-light{padding:80px 0}.spl-light .spl-split+.spl-split,.spl-mt{margin-top:80px!important}}
@media (max-width:520px){.spl-ck-card{margin-left:0;width:100%}.spl-ck-orb{width:150px;height:150px;left:-30px;top:0}}

/* premiações */
.spl-awards{overflow:hidden}
.spl-awards-glow{position:absolute;left:50%;top:55%;width:900px;height:500px;transform:translate(-50%,-50%);background:radial-gradient(closest-side,rgba(124,58,237,.55),transparent);filter:blur(30px);pointer-events:none}
.spl-car{position:relative;height:470px;margin-top:20px}
.spl-car-track{position:relative;height:100%;display:flex;justify-content:center}
.spl-award{position:absolute;top:0;width:240px;height:450px;border-radius:22px;overflow:hidden;padding:0;background:#1a1430;
  border:1px solid rgba(196,181,253,.35);box-shadow:0 30px 80px -20px rgba(124,58,237,.8)}
.spl-award-img{position:absolute;inset:0;background:url(/dashboard-banner.webp) no-repeat;background-size:888.9% auto}
.spl-award-cap{position:absolute;left:0;right:0;bottom:0;padding:40px 14px 14px;font-size:13px;color:#fff;text-align:left;background:linear-gradient(transparent,rgba(13,10,24,.92))}
.spl-award-cap b{display:block;font-size:22px}
.spl-car-nav{position:absolute;top:50%;transform:translateY(-50%);z-index:20;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;
  background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16)!important;backdrop-filter:blur(8px)}
.spl-car-nav:hover{background:rgba(255,255,255,.16)}
.spl-car-nav.l{left:calc(50% - 250px)}.spl-car-nav.r{right:calc(50% - 250px)}
.spl-dots{display:flex;justify-content:center;gap:8px;margin-top:20px}
.spl-dots button{width:8px;height:8px;border-radius:99px;background:rgba(255,255,255,.25);transition:width .25s,background .25s}
.spl-dots button.is-on{width:26px;background:var(--v3)}
@media (max-width:560px){.spl-car-nav.l{left:4px}.spl-car-nav.r{right:4px}}

/* simulador */
.spl-sim{display:grid;grid-template-columns:1fr 1.05fr;border-radius:26px;overflow:hidden;background:linear-gradient(180deg,#120e22,#0c0a17);border:1px solid rgba(167,139,250,.18);
  box-shadow:0 40px 100px -40px rgba(124,58,237,.6)}
.spl-sim-left{padding:38px;border-right:1px solid var(--line)}
.spl-sim-right{padding:30px;display:flex;flex-direction:column;gap:14px;background:rgba(255,255,255,.015)}
.spl-sim-title{font-size:clamp(24px,2.6vw,32px);font-weight:800;letter-spacing:-.02em;line-height:1.15;margin:0 0 12px}
.spl-sim-lead{color:var(--mut);font-size:14.5px;line-height:1.6;margin:0 0 28px}
.spl-sim-field{margin-bottom:24px;display:flex;flex-direction:column;gap:10px}
.spl-sim-row{display:flex;justify-content:space-between;align-items:baseline}
.spl-sim-label{font-size:13px;color:#c9c3de;font-weight:500}
.spl-sim-amount{font-size:26px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.spl-sim-scale{font-size:11.5px;color:var(--mut)}
.spl-range{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:99px;outline:none;cursor:pointer;
  background:linear-gradient(90deg,var(--v2) 0 var(--p),rgba(255,255,255,.12) var(--p) 100%)}
.spl-range::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:#fff;border:5px solid var(--v);box-shadow:0 0 0 6px rgba(139,92,246,.25)}
.spl-range::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#fff;border:5px solid var(--v);box-shadow:0 0 0 6px rgba(139,92,246,.25)}
.spl-seg{display:grid;grid-template-columns:1fr 1fr;padding:4px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid var(--line)}
.spl-seg button{padding:10px;border-radius:9px;font-size:13.5px;font-weight:600;color:var(--mut);transition:background .2s,color .2s}
.spl-seg button.is-on{background:rgba(139,92,246,.22);color:#fff;box-shadow:inset 0 0 0 1px rgba(167,139,250,.45)}
.spl-chips{display:flex;flex-wrap:wrap;gap:8px}
.spl-chip{display:flex;align-items:center;gap:8px;padding:7px 14px 7px 7px;border-radius:99px;font-size:13px;font-weight:600;background:rgba(255,255,255,.04);border:1px solid var(--line)!important;transition:all .2s}
.spl-chip:hover{background:rgba(255,255,255,.08)}
.spl-chip.is-on{background:rgba(139,92,246,.2);border-color:rgba(167,139,250,.6)!important}
.spl-sim-mark{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:11.5px;font-weight:800;border:1px solid;flex-shrink:0;overflow:hidden}
.spl-sim-mark.is-shadow{background:#fff;border-color:#fff}
.spl-sim-mark img{width:22px;height:22px;object-fit:contain}
.spl-sim-hero{padding:22px;border-radius:18px;background:linear-gradient(135deg,#6d28d9,#8b5cf6 60%,#a78bfa);box-shadow:0 20px 50px -18px rgba(139,92,246,.9)}
.spl-sim-hero.is-zero{background:rgba(255,255,255,.06);box-shadow:none}
.spl-sim-hero-k{font-size:13px;color:#ede9fe}
.spl-sim-hero-v{display:block;font-size:clamp(34px,4vw,46px);font-weight:800;letter-spacing:-.03em;margin:4px 0 6px;font-variant-numeric:tabular-nums}
.spl-sim-hero-sub{margin:0;font-size:13px;line-height:1.5;color:#f3efff}
.spl-cmp{padding:16px 4px 14px;border-bottom:1px solid var(--line);display:flex;flex-direction:column;gap:6px}
.spl-cmp-head{display:flex;align-items:center;gap:8px;font-weight:700;font-size:14.5px}
.spl-cmp-rate{font-size:12px;color:var(--mut)}
.spl-cmp-nums{display:flex;justify-content:space-between;align-items:flex-end;margin-top:4px}
.spl-cmp-nums small{display:block;font-size:11px;color:var(--mut)}
.spl-cmp-nums b{font-size:24px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.spl-cmp-nums span{font-size:15px;font-weight:600;font-variant-numeric:tabular-nums}
.spl-cmp.is-shadow .spl-cmp-nums b{color:#c4b5fd}
.spl-bar{height:8px;border-radius:99px;background:rgba(255,255,255,.06);overflow:hidden;margin-top:4px}
.spl-bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#7c3aed,#a78bfa);transition:width .4s cubic-bezier(.22,1,.36,1)}
.spl-bar i.is-other{background:linear-gradient(90deg,#64748b,#94a3b8)}
.spl-cmp-legend{display:flex;align-items:center;gap:6px;font-size:12px;color:#c4b5fd}
.spl-prazos{display:flex;flex-direction:column;gap:10px;padding-top:4px}
.spl-prazos-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.spl-prazos-grid div{padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid var(--line)}
.spl-prazos-grid small{display:block;font-size:11px;color:var(--mut)}
.spl-prazos-grid b{display:block;font-size:14px;margin:2px 0}
.spl-prazos-grid em{font-style:normal;font-size:10.5px;color:var(--v3)}
.spl-sim-foot{margin:0;font-size:11.5px;color:#7d7894;line-height:1.5}
@media (max-width:900px){.spl-sim{grid-template-columns:1fr}.spl-sim-left{border-right:0;border-bottom:1px solid var(--line);padding:26px 20px}.spl-sim-right{padding:22px 20px}}

/* app */
.spl-app-in{display:grid;grid-template-columns:1fr 1fr;gap:50px;align-items:center}
.spl-app .spl-h2,.spl-app .spl-lead{text-align:left;margin-left:0}
.spl-app-art{position:relative;height:420px;display:grid;place-items:center}
.spl-app-ninja{width:420px;max-width:100%;mix-blend-mode:lighten;animation:splFloat 6s ease-in-out infinite}
.spl-notif{position:absolute;display:flex;align-items:center;gap:10px;padding:10px 14px 10px 10px;border-radius:16px;min-width:220px;
  background:rgba(30,24,52,.78);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.12);box-shadow:0 20px 40px -14px rgba(0,0,0,.7);animation:splFloat 5s ease-in-out infinite}
.spl-notif img{width:32px;height:32px;border-radius:9px;background:#fff;object-fit:contain}
.spl-notif b{display:block;font-size:13px}.spl-notif small{font-size:11.5px;color:var(--mut)}
.spl-notif.n1{top:40px;left:0}.spl-notif.n2{bottom:50px;right:0;animation-delay:-2.5s}
.spl-app-btns{display:flex;gap:12px;flex-wrap:wrap}
.spl-store{display:flex;align-items:center;gap:12px;padding:12px 22px 12px 16px;border-radius:14px;background:#000;border:1px solid rgba(255,255,255,.22)!important;font-weight:700;font-size:16px;transition:transform .2s}
.spl-store:hover{transform:translateY(-2px)}
.spl-store small{display:block;font-size:11px;font-weight:500;color:#cfcbe0}
.spl-store span{text-align:left;line-height:1.2}
.spl-store.is-ghost{background:rgba(255,255,255,.04)}
@media (max-width:900px){.spl-app-in{grid-template-columns:1fr}.spl-app-art{height:340px}}

/* faq */
.spl-faq-wrap{max-width:820px}
.spl-faq{display:grid;gap:12px;margin-top:30px}
.spl-faq-item{border-radius:14px;background:linear-gradient(180deg,rgba(91,33,182,.18),rgba(255,255,255,.02));border:1px solid rgba(167,139,250,.14);overflow:hidden;transition:border-color .2s}
.spl-faq-item.is-on{border-color:rgba(167,139,250,.4)}
.spl-faq-item>button{width:100%;display:flex;justify-content:space-between;align-items:center;gap:14px;padding:20px 22px;text-align:left;font-weight:600;font-size:15.5px}
.spl-faq-item>button svg{flex-shrink:0;transition:transform .25s;color:var(--v3)}
.spl-faq-item.is-on>button svg{transform:rotate(180deg)}
.spl-faq-item p{margin:0;padding:0 22px 20px;color:var(--mut);font-size:14.5px;line-height:1.65}

/* cta final + rodapé */
.spl-final{padding-bottom:100px}
.spl-final-card{position:relative;overflow:hidden;text-align:center;padding:64px 24px;border-radius:28px;background:linear-gradient(135deg,#4c1d95,#6d28d9 45%,#8b5cf6);
  box-shadow:0 40px 100px -30px rgba(124,58,237,.9)}
.spl-final-glow{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px);background-size:48px 48px;
  mask-image:radial-gradient(60% 80% at 50% 0%,#000,transparent);-webkit-mask-image:radial-gradient(60% 80% at 50% 0%,#000,transparent)}
.spl-final-card h2{position:relative;font-size:clamp(26px,3.4vw,40px);font-weight:800;letter-spacing:-.02em;margin:0 0 10px}
.spl-final-card p{position:relative;color:#ede9fe;margin:0 0 28px;font-size:16px}
.spl-final-card .spl-btn{position:relative}
.spl-foot{border-top:1px solid var(--line);padding:60px 0 30px;background:#05040a}
.spl-foot-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:30px}
.spl-foot-brand p{color:var(--mut);font-size:14px;margin:14px 0 0;max-width:260px;line-height:1.6}
.spl-foot h4{font-size:14px;margin:6px 0 14px}
.spl-foot-grid>div>a:not(.spl-logo){display:block;color:var(--mut);font-size:14px;margin-bottom:10px}
.spl-foot-grid>div>a:hover{color:#fff}
.spl-foot-bottom{margin-top:40px;padding-top:22px;border-top:1px solid var(--line);font-size:13px;color:#6f6a86}
@media (max-width:800px){.spl-foot-grid{grid-template-columns:1fr 1fr}.spl-foot-brand{grid-column:1/-1}}

@media (prefers-reduced-motion:reduce){.spl *{animation:none!important;transition:none!important}.spl-chart-line{stroke-dashoffset:0}}
`;
