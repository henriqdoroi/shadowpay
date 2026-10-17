/* Estilos da landing estilo PinguPag (prévia /lp/pingu). Tudo em .spp-*. */
export const PINGU_CSS = `
/* o wrapper do _app tem overflow-x:hidden, que quebra position:sticky — clip não quebra */
body:has(.spp),body:has(.spp) main,body:has(.spp) .overflow-x-hidden{overflow-x:clip!important;overflow-y:visible!important}
html:has(.spp){scroll-behavior:smooth;background:#04030a}
.spp{--bg:#04030a;--p1:#0b0915;--p2:#110e1f;--ln:rgba(255,255,255,.07);--ln2:rgba(167,139,250,.18);--tx:#f4f2ff;--mu:#9b96b5;
  --a:#8b5cf6;--a2:#a78bfa;--a3:#c4b5fd;--ad:#6d28d9;
  position:relative;background:var(--bg);color:var(--tx);min-height:100vh;width:100%;
  font-family:var(--spp-sans),ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased;letter-spacing:-.01em}
.spp *{box-sizing:border-box}
:where(.spp) a{color:inherit;text-decoration:none}
:where(.spp) img{display:block;max-width:100%}
:where(.spp) button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
.spp [id]{scroll-margin-top:80px}
.spp-wrap{width:100%;max-width:1200px;margin:0 auto;padding:0 24px}
.spp em{font-style:normal;background:linear-gradient(90deg,#c4b5fd,#8b5cf6);-webkit-background-clip:text;background-clip:text;color:transparent}

/* fundo e granulado */
.spp-amb{position:fixed;inset:0;pointer-events:none;z-index:0;
  background:radial-gradient(60% 50% at 85% -5%,rgba(109,40,217,.45),transparent 70%),radial-gradient(50% 40% at 0% 40%,rgba(76,29,149,.22),transparent 70%)}
.spp-grain{position:fixed;inset:0;pointer-events:none;z-index:60;opacity:.07;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.spp main,.spp footer{position:relative;z-index:1}

/* cursor glow */
.hov{position:relative;isolation:isolate}
.hov:before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity .3s;z-index:-1;
  background:radial-gradient(260px circle at var(--x,50%) var(--y,50%),rgba(139,92,246,.18),transparent 60%)}
.hov:hover:before{opacity:1}

/* tipografia */
.spp-h2{font-size:clamp(32px,4.4vw,56px);font-weight:500;letter-spacing:-.035em;line-height:1.05;margin:14px 0 16px;text-align:center}
.spp-h2.l,.spp-sub.l{text-align:left;margin-left:0}
.spp-sub{color:var(--mu);font-size:clamp(15px,1.3vw,17px);line-height:1.6;max-width:560px;margin:0 auto;text-align:center;font-weight:300}
.spp-eb,.spp-mono,.spp-mono-foot{font-family:var(--spp-mono),ui-monospace,monospace;font-size:11px;letter-spacing:.22em;color:var(--a2);text-transform:uppercase}
.spp-eb{display:inline-flex;align-items:center;gap:12px}
.spp-eb i{width:22px;height:1px;background:currentColor;opacity:.7}
.spp-mono-foot{text-align:center;color:#5d5876;margin:0}

/* botões */
.spp-btn{display:inline-flex;align-items:center;gap:10px;border-radius:999px;padding:7px 7px 7px 20px;font-weight:500;font-size:14.5px;color:#fff;white-space:nowrap;
  background:linear-gradient(180deg,#8b5cf6,#6d28d9);box-shadow:0 10px 30px -8px rgba(139,92,246,.75),inset 0 1px 0 rgba(255,255,255,.3);transition:transform .2s,box-shadow .2s}
.spp-btn:hover{transform:translateY(-1px);box-shadow:0 14px 40px -8px rgba(139,92,246,.95),inset 0 1px 0 rgba(255,255,255,.3)}
.spp-btn.ghost{background:rgba(255,255,255,.03);border:1px solid var(--ln);box-shadow:none}
.spp-btn.ghost:hover{background:rgba(255,255,255,.07)}
.spp-btn.sm{font-size:13px;padding:6px 6px 6px 16px}
.spp-btn.ghost.sm{padding:8px 16px}
.spp-btn.lg{font-size:15.5px;padding:8px 8px 8px 24px}
.spp-arr{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.18)}
.spp-arr.g{background:rgba(255,255,255,.06);border:1px solid var(--ln)}
.spp-btn.sm .spp-arr{width:26px;height:26px}

/* nav pílula */
.spp-top{position:fixed;top:14px;left:0;right:0;z-index:50;padding:0 16px}
.spp-pill{max-width:1200px;margin:0 auto;display:flex;align-items:center;gap:18px;padding:8px 8px 8px 18px;border-radius:999px;
  background:rgba(12,10,22,.66);backdrop-filter:blur(16px) saturate(1.3);-webkit-backdrop-filter:blur(16px) saturate(1.3);border:1px solid var(--ln);box-shadow:0 20px 50px -20px rgba(0,0,0,.8)}
.spp-logo{display:flex;align-items:center;gap:8px;font-weight:600;font-size:17px;letter-spacing:-.02em}
.spp-logo b{font-weight:600;color:var(--a3)}
.spp-links{display:flex;gap:4px;margin:0 auto}
.spp-links a{position:relative;padding:8px 13px;border-radius:999px;font-size:13.5px;color:var(--mu);transition:color .2s,background .2s}
.spp-links a:hover{color:#fff}
.spp-links a.on{color:#fff;background:rgba(139,92,246,.14)}
.spp-links a.on:after{content:"";position:absolute;left:50%;bottom:3px;width:4px;height:4px;border-radius:50%;background:var(--a2);transform:translateX(-50%);box-shadow:0 0 8px var(--a2)}
.spp-acts{display:flex;gap:8px}
.spp-burger{display:none;width:40px;height:40px;border-radius:50%;place-items:center;background:rgba(255,255,255,.06);margin-left:auto}
.spp-mnav{max-width:1200px;margin:10px auto 0;display:flex;flex-direction:column;gap:6px;padding:16px;border-radius:24px;background:rgba(12,10,22,.92);backdrop-filter:blur(16px);border:1px solid var(--ln)}
.spp-mnav>a:not(.spp-btn){padding:12px 8px;color:#ddd8f0;border-bottom:1px solid var(--ln)}
.spp-mnav .spp-btn{justify-content:center;padding:13px}
@media (max-width:980px){.spp-links,.spp-acts{display:none}.spp-burger{display:grid}}

/* hero */
.spp-hero{position:relative;min-height:100vh;display:grid;place-items:center;overflow:hidden;padding:120px 0 60px}
.spp-streaks{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.spp-streak{stroke-dasharray:1800;animation:sppStreak 9s ease-in-out infinite}
@keyframes sppStreak{0%,100%{stroke-dashoffset:0;opacity:.8}50%{stroke-dashoffset:400;opacity:1}}
.spp-hero-in{position:relative;text-align:center;display:flex;flex-direction:column;align-items:center;padding:0 20px}
.spp-badge{display:inline-flex;align-items:center;gap:10px;padding:7px 16px 7px 8px;border-radius:999px;font-size:12.5px;color:#cfc9e6;background:rgba(255,255,255,.03);border:1px solid var(--ln)}
.spp-badge i{width:18px;height:18px;border-radius:50%;background:radial-gradient(circle,var(--a2) 30%,rgba(139,92,246,.25) 34%);animation:sppPulse 2s infinite}
.spp-badge.sm{margin:0 auto}
@keyframes sppPulse{50%{box-shadow:0 0 0 6px rgba(139,92,246,.08)}}
.spp-hero h1{font-size:clamp(40px,6.4vw,84px);font-weight:400;letter-spacing:-.045em;line-height:1.02;margin:24px 0 20px}
.spp-hero p{max-width:600px;color:var(--mu);font-size:clamp(15px,1.35vw,18px);line-height:1.6;margin:0;font-weight:300}
.spp-cta{display:flex;gap:12px;margin-top:34px;flex-wrap:wrap;justify-content:center}
.spp-checks{list-style:none;display:flex;flex-wrap:wrap;justify-content:center;gap:10px 26px;padding:0;margin:30px 0 0;font-size:13.5px;color:#bdb7d6}
.spp-checks li{display:flex;align-items:center;gap:7px}
.spp-checks svg{color:var(--a2)}
.spp-down{margin-top:44px;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;border:1px solid var(--ln);animation:sppBob 2.4s ease-in-out infinite}
@keyframes sppBob{50%{transform:translateY(6px)}}

/* cenas presas */
.spp-scene{position:relative}
.spp-sticky{position:sticky;top:0;height:100vh;overflow:hidden;display:flex;flex-direction:column}
.spp-integ{height:280vh}
.spp-integ .spp-sticky{padding:96px 24px 24px;align-items:center}
.spp-integ-head{text-align:center}
.spp-integ-head .spp-h2{margin-bottom:10px}
.spp-stage{position:relative;width:min(1100px,100%);max-height:calc(100vh - 330px);flex:1;margin:10px auto;align-self:center}
.spp-lines{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.spp-lines .base{fill:none;stroke:rgba(167,139,250,.28);stroke-width:1.2;stroke-dasharray:100;vector-effect:non-scaling-stroke}
.spp-lines .flow{fill:none;stroke:#c4b5fd;stroke-width:2;stroke-linecap:round;stroke-dasharray:5 140;vector-effect:non-scaling-stroke;animation:sppFlow 1.8s ease-in infinite;filter:drop-shadow(0 0 4px #a78bfa)}
@keyframes sppFlow{from{stroke-dashoffset:5}to{stroke-dashoffset:-100}}
.spp-plat{position:absolute;translate:-50% -50%;display:flex;align-items:center;gap:10px;padding:9px 18px 9px 9px;border-radius:16px;font-weight:500;font-size:16px;white-space:nowrap;
  background:rgba(14,11,26,.8);border:1px solid var(--ln2);backdrop-filter:blur(8px);box-shadow:0 14px 40px -16px rgba(0,0,0,.8)}
.spp-plat .ic{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;overflow:hidden}
.spp-plat .ic img{width:24px;height:24px;object-fit:contain}
.spp-ring{position:absolute;left:50%;top:50%;width:min(52vh,420px);aspect-ratio:1;margin:calc(min(52vh,420px)/-2) 0 0 calc(min(52vh,420px)/-2);border-radius:50%;
  border:1px dashed rgba(167,139,250,.25);box-shadow:inset 0 0 80px rgba(109,40,217,.25),0 0 120px rgba(109,40,217,.25)}
.spp-s3d{position:absolute;left:50%;top:50%;width:min(36vh,280px);aspect-ratio:1;transform:translate(-50%,-50%);perspective:900px}
.spp-sculpt{width:100%;height:100%;transform-style:preserve-3d}
.spp-float{position:relative;width:100%;height:100%;transform-style:preserve-3d;animation:sppHover 5s ease-in-out infinite}
@keyframes sppHover{50%{transform:translateY(-10px)}}
.nj-ly{position:absolute;inset:0}
.nj-ly svg{width:100%;height:100%;display:block;overflow:visible}
.nj-sweep{animation:njSweep 4s ease-in-out infinite}
@keyframes njSweep{0%,100%{opacity:0}50%{opacity:1}}
@media (max-width:760px){.spp-plat{font-size:12px;padding:6px 10px 6px 6px;gap:7px}.spp-plat .ic{width:28px;height:28px}.spp-stage{max-height:none}.spp-s3d{width:30vw}.spp-ring{width:44vw;margin:-22vw 0 0 -22vw}}

/* cena olhar */
.spp-dive{height:420vh}
.spp-dive .spp-sticky{display:block}
.spp-dive-cap{position:absolute;left:max(24px,calc(50% - 576px));top:50%;translate:0 -50%;width:min(480px,calc(100% - 48px));z-index:3}
.spp-dfeats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:26px 0}
.spp-dfeat{display:flex;gap:10px;padding:12px;border-radius:14px;background:rgba(255,255,255,.025);border:1px solid var(--ln)}
.spp-dfeat>span{width:30px;height:30px;flex-shrink:0;border-radius:9px;display:grid;place-items:center;background:rgba(139,92,246,.15);color:var(--a3)}
.spp-dfeat b{display:block;font-size:13.5px;font-weight:500}
.spp-dfeat small{font-size:12px;color:var(--mu);line-height:1.4}
.spp-dive-ninja{position:absolute;right:max(24px,calc(50% - 600px));top:50%;width:min(44vw,520px);aspect-ratio:1;translate:0 -50%;z-index:2;pointer-events:none}
.spp-dive-ninja svg{width:100%;height:100%;overflow:visible;filter:drop-shadow(0 0 60px rgba(139,92,246,.45))}
.spp-browser{position:absolute;left:50%;top:86px;bottom:24px;width:min(1200px,calc(100% - 48px));translate:-50% 0;z-index:4;border-radius:18px;overflow:hidden;
  background:#08060f;border:1px solid var(--ln2);box-shadow:0 40px 120px -30px rgba(109,40,217,.7);display:flex;flex-direction:column}
.spp-bar{height:40px;flex-shrink:0;display:flex;align-items:center;gap:7px;padding:0 14px;border-bottom:1px solid var(--ln);background:#0c0a16}
.spp-bar>i{width:10px;height:10px;border-radius:50%;background:#ff5f57}.spp-bar>i:nth-child(2){background:#febc2e}.spp-bar>i:nth-child(3){background:#28c840}
.spp-bar span{margin:0 auto;display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--mu);padding:5px 40px;border-radius:8px;background:rgba(255,255,255,.04)}
.spp-view{position:relative;flex:1;overflow:hidden;padding:20px;margin:0}
.spp-view>div{will-change:transform}
.spp-gerente{position:absolute;right:16px;bottom:16px;display:flex;align-items:center;gap:7px;padding:10px 16px;border-radius:999px;font-size:13px;font-weight:500;
  background:linear-gradient(180deg,#8b5cf6,#6d28d9);box-shadow:0 10px 30px -8px rgba(139,92,246,.9)}
@media (max-width:860px){
  .spp-dive-cap{top:90px;translate:none}
  .spp-dfeats{display:none}
  .spp-dive-ninja{right:auto;left:50%;top:auto;bottom:4vh;width:70vw;translate:-50% 0}
  .spp-browser{top:76px;bottom:16px;width:calc(100% - 24px)}
  .spp-view{padding:10px}
}

/* painel demo (1100px de largura de projeto) */
.pd{width:1100px;color:#ece9f8;font-size:13px;display:flex;flex-direction:column;gap:14px;padding-bottom:20px}
.pd-nav{display:flex;align-items:center;gap:16px;padding:10px 14px;border-radius:14px;background:#0f0c1c;border:1px solid var(--ln)}
.pd-brand{display:flex;align-items:center;gap:7px;font-weight:600;font-size:14px}
.pd-brand img{width:22px;height:22px;border-radius:6px;background:#fff;object-fit:contain}
.pd-brand.lg{font-size:20px}.pd-brand.lg img{width:30px;height:30px}
.pd-tabs{display:flex;gap:4px;font-size:12px;color:var(--mu)}
.pd-tabs span{display:flex;align-items:center;gap:6px;padding:7px 11px;border-radius:9px}
.pd-tabs span.on{background:rgba(139,92,246,.18);color:#fff;box-shadow:inset 0 0 0 1px rgba(167,139,250,.35)}
.pd-bal{margin-left:auto;text-align:right;padding:5px 12px;border-radius:9px;background:rgba(255,255,255,.04)}
.pd-bal small{display:block;font-size:9px;color:var(--mu);letter-spacing:.1em}.pd-bal b{font-size:13px}
.pd-av{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:var(--a);font-weight:600}
.pd-banner{position:relative;overflow:hidden;display:flex;justify-content:space-between;align-items:center;padding:30px 36px;border-radius:18px;
  background:linear-gradient(110deg,#4c1d95,#6d28d9 45%,#1e1038);min-height:170px}
.pd-banner small{font-size:12.5px;color:#e9e3ff}.pd-banner small u{color:#fff}
.pd-banner h4{margin:12px 0 0;font-size:30px;font-weight:400;line-height:1.05;letter-spacing:-.02em}
.pd-banner h4 em{font-weight:600}
.pd-banner-r{display:flex;flex-direction:column;align-items:flex-end;gap:12px;position:relative;z-index:1}
.pd-chip{display:flex;align-items:center;gap:7px;padding:9px 16px;border-radius:10px;background:#fff;color:#4c1d95;font-weight:600}
.pd-banner-ninja{position:absolute;right:260px;top:-30px;width:240px;mix-blend-mode:lighten;opacity:.9}
.pd-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.pd-card{padding:16px;border-radius:16px;background:#0e0b1a;border:1px solid var(--ln)}
.pd-kh{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.pd-kh small{font-size:10.5px;letter-spacing:.08em;color:var(--mu)}
.pd-kh>span{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;border:1px solid var(--ln2);color:var(--a3)}
.pd-kpi b{display:block;font-size:24px;font-weight:600;margin:12px 0 4px;letter-spacing:-.02em}
.pd-kpi em{font-size:11.5px;color:var(--a2);-webkit-text-fill-color:currentColor;background:none}
.pd-row{display:grid;grid-template-columns:1.65fr 1fr;gap:14px}
.pd h5{margin:0;font-size:14px;font-weight:600}
.pd-chart small,.pd-meta>small,.pd-table small,.pd-pix>small{font-size:11.5px;color:var(--mu)}
.pd-seg{display:flex;gap:4px;font-size:11px}
.pd-seg span{padding:5px 9px;border-radius:7px;background:rgba(255,255,255,.04);color:var(--mu)}
.pd-seg span.on{background:var(--a);color:#fff}
.pd-area{width:100%;height:220px;display:block;margin-top:14px}
.pd-hours{display:flex;justify-content:space-between;font-size:10.5px;color:#6f6a88;margin-top:6px}
.pd-tag{font-size:9.5px;padding:4px 8px;border-radius:6px;background:rgba(139,92,246,.18);color:var(--a3);letter-spacing:.05em}
.pd-plaque{margin:14px auto;width:120px;height:150px;border-radius:10px;border:3px solid #1d1830;background:radial-gradient(circle at 50% 30%,#2e1065,#0b0716);
  display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:12px;box-shadow:0 20px 40px -10px rgba(139,92,246,.6)}
.pd-plaque img{width:84px;mix-blend-mode:lighten}
.pd-plaque b{font-size:24px;line-height:1}.pd-plaque em{font-size:10px;color:var(--a3);-webkit-text-fill-color:currentColor;background:none}
.pd-mrow{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--mu);margin:6px 0}
.pd-mrow b{color:#fff}
.pd-bar{height:7px;border-radius:99px;background:rgba(255,255,255,.06);overflow:hidden}
.pd-bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#6d28d9,#a78bfa)}
.pd-live{font-size:9.5px;padding:4px 8px;border-radius:6px;background:rgba(34,197,94,.15);color:#4ade80;letter-spacing:.08em}
.pd table{width:100%;border-collapse:collapse;margin-top:14px;font-size:12.5px}
.pd th{text-align:left;font-size:10px;letter-spacing:.08em;color:#6f6a88;font-weight:500;padding:8px 6px;border-bottom:1px solid var(--ln)}
.pd td{padding:11px 6px;border-bottom:1px solid rgba(255,255,255,.04)}
.pd-st{font-size:10.5px;padding:3px 8px;border-radius:6px;background:rgba(34,197,94,.14);color:#4ade80}
.pd-st.wait{background:rgba(245,158,11,.14);color:#fbbf24}
.pd-pixrow{margin-top:8px}
.pd h5.mt{margin-top:18px}
.pd-saq{padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04)}
.pd-saq span{display:block;color:#fff}.pd-saq small{font-size:10.5px}

/* bento */
.spp-why{padding:140px 0 120px;text-align:center}
.spp-bento{display:grid;grid-template-columns:1.25fr 1fr;gap:18px;margin-top:56px;text-align:left}
.spp-bento>div>.spp-card{height:100%}
.spp-card{padding:28px;border-radius:24px;background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.01));border:1px solid var(--ln);overflow:hidden}
.spp-card h3{font-size:clamp(20px,1.9vw,25px);font-weight:500;letter-spacing:-.025em;line-height:1.2;margin:12px 0 10px}
.spp-card p{color:var(--mu);font-size:14.5px;line-height:1.6;margin:0 0 20px;font-weight:300}
.spp-link{display:inline-flex;align-items:center;gap:6px;color:var(--a3);font-size:14px;margin-bottom:18px}
.spp-tags{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}
.spp-tags span{font-size:12px;padding:6px 12px;border-radius:999px;border:1px solid var(--ln2);color:#d9d3f0;background:rgba(139,92,246,.08)}
@media (max-width:900px){.spp-bento{grid-template-columns:1fr}}

/* checkout builder */
.spp-ckb{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.spp-ckb-ed,.spp-ckb-pv{border-radius:16px;padding:14px;background:#0b0916;border:1px solid var(--ln)}
.spp-ckb-h{display:flex;justify-content:space-between;align-items:center;font-size:13px;margin-bottom:8px}
.spp-on{font-size:10px;padding:3px 8px;border-radius:99px;background:rgba(34,197,94,.15);color:#4ade80}
.spp-ckb .lbl{display:block;font-size:10px;letter-spacing:.12em;color:#6f6a88;text-transform:uppercase;margin:12px 0 6px;font-family:var(--spp-mono),monospace}
.spp-ckb-row{display:flex;justify-content:space-between;align-items:center;font-size:12.5px;color:#cfc9e6;margin:8px 0}
.spp-ckb-row .sw{display:flex;gap:6px}
.spp-ckb-row .sw button{width:18px;height:18px;border-radius:50%;outline:2px solid transparent;outline-offset:2px;transition:outline-color .2s}
.spp-ckb-row .sw button.on{outline-color:#fff}
.spp-ckb-row.tg{cursor:pointer}
.spp-ckb-row.tg input{display:none}
.spp-ckb-row.tg i{width:32px;height:18px;border-radius:99px;background:rgba(255,255,255,.12);position:relative;transition:background .2s}
.spp-ckb-row.tg i:after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:transform .2s}
.spp-ckb-row.tg input:checked+i{background:var(--a)}
.spp-ckb-row.tg input:checked+i:after{transform:translateX(14px)}
.spp-ckb-blk{display:flex;justify-content:space-between;align-items:center;font-size:12px;padding:7px 10px;border-radius:9px;border:1px dashed var(--ln2);margin-top:6px;color:#bdb7d6}
.spp-ckb-pv{background:#f7f6fb;color:#16121f;font-size:12px;display:flex;flex-direction:column;gap:7px}
.spp-ckb-pv .tm{text-align:center;padding:6px;border-radius:var(--r);background:var(--ck);color:#fff;font-size:11px;transition:all .3s}
.spp-ckb-pv .pr{display:flex;align-items:center;gap:8px;font-size:11.5px}
.spp-ckb-pv .pr .th{width:30px;height:30px;border-radius:calc(var(--r) * .6);background:linear-gradient(135deg,var(--ck),#000);flex-shrink:0}
.spp-ckb-pv .pr small{display:block;font-size:10px;color:#6b6780}
.spp-ckb-pv .pr>b{margin-left:auto}
.spp-ckb-pv .st{display:flex;align-items:center;gap:6px;font-weight:600;font-size:11.5px;margin-top:2px}
.spp-ckb-pv .st i{width:16px;height:16px;border-radius:50%;background:var(--ck);color:#fff;display:grid;place-items:center;font-style:normal;font-size:10px}
.spp-ckb-pv .in{padding:7px 9px;border-radius:var(--r);border:1px solid #e3e0ee;background:#fff;color:#9a96aa;font-size:11px;transition:border-radius .3s}
.spp-ckb-pv .px{display:flex;align-items:center;gap:6px;padding:8px 9px;border-radius:var(--r);border:1.5px solid var(--ck);color:var(--ck);font-weight:600;font-size:11.5px}
.spp-ckb-pv .px small{margin-left:auto;font-weight:400;color:#6b6780;font-size:10px}
.spp-ckb-pv .ob{display:flex;align-items:center;gap:6px;padding:7px 9px;border-radius:var(--r);background:color-mix(in srgb,var(--ck) 10%,#fff);font-size:11px}
.spp-ckb-pv .ob svg{color:var(--ck)}.spp-ckb-pv .ob b{margin-left:auto}
.spp-ckb-pv .pay{text-align:center;padding:10px;border-radius:var(--r);background:var(--ck);color:#fff;font-weight:600;transition:all .3s}
.spp-ckb-pv .sec{display:flex;align-items:center;justify-content:center;gap:4px;color:#6b6780;font-size:10px}
@media (max-width:520px){.spp-ckb{grid-template-columns:1fr}}

/* chat */
.spp-chat{border-radius:18px;background:#0b0916;border:1px solid var(--ln);padding:14px}
.spp-chat-h{display:flex;align-items:center;gap:10px;padding-bottom:12px;border-bottom:1px solid var(--ln)}
.spp-chat-h b{display:block;font-size:14px;font-weight:500}
.spp-chat-h small{display:flex;align-items:center;gap:6px;font-size:11.5px;color:#4ade80}
.spp-chat-h small i{width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 8px #4ade80}
.spp-chat-tags{display:flex;gap:6px;margin:12px 0}
.spp-chat-tags span{font-family:var(--spp-mono),monospace;font-size:9.5px;letter-spacing:.1em;padding:5px 9px;border-radius:7px;border:1px solid var(--ln);color:#6f6a88}
.spp-chat-tags span.on{border-color:var(--ln2);color:var(--a3);background:rgba(139,92,246,.1)}
.spp-chat-body{min-height:190px;display:flex;flex-direction:column;gap:8px;justify-content:flex-end}
.spp-chat .msg{max-width:82%;padding:10px 13px;border-radius:14px 14px 14px 4px;font-size:13px;line-height:1.45;background:rgba(255,255,255,.06)}
.spp-chat .msg.me{align-self:flex-end;border-radius:14px 14px 4px 14px;background:linear-gradient(180deg,#8b5cf6,#6d28d9)}
.spp-chat .typing{display:flex;gap:4px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.06);width:max-content}
.spp-chat .typing i{width:6px;height:6px;border-radius:50%;background:var(--mu);animation:sppDot 1s infinite}
.spp-chat .typing i:nth-child(2){animation-delay:.15s}.spp-chat .typing i:nth-child(3){animation-delay:.3s}
@keyframes sppDot{50%{transform:translateY(-4px);opacity:.4}}

/* moedas */
.spp-coins{position:relative;height:250px;display:grid;place-items:center}
.spp-coins .orbit{position:absolute;width:0;height:0;animation:sppSpin 22s linear infinite}
.spp-coins .orbit span{position:absolute;left:-26px;top:-26px;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;
  background:radial-gradient(circle at 35% 30%,#ddd6fe,#8b5cf6 55%,#4c1d95);box-shadow:0 10px 24px -6px rgba(139,92,246,.8),inset 0 2px 0 rgba(255,255,255,.5)}
.spp-coins .orbit span svg{width:34px;height:34px;animation:sppSpin 22s linear infinite reverse}
.spp-coins .core{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:rgba(139,92,246,.15);border:1px solid var(--ln2);color:var(--a3);box-shadow:0 0 50px rgba(139,92,246,.5)}
@keyframes sppSpin{to{transform:rotate(360deg)}}

/* simulador taxa */
.spp-fee{border-radius:18px;background:#0b0916;border:1px solid var(--ln);padding:16px;display:flex;flex-direction:column;gap:12px}
.spp-fee .row{display:flex;justify-content:space-between;align-items:baseline;font-size:13px;color:#cfc9e6}
.spp-fee .row b{font-size:17px;color:#fff;font-weight:600;font-variant-numeric:tabular-nums}
.spp-fee .row.sm{font-size:11px;color:#6f6a88}
.spp-fee-f{display:flex;flex-direction:column;gap:6px}
.spp-range{-webkit-appearance:none;appearance:none;width:100%;height:5px;border-radius:99px;outline:none;cursor:pointer;background:linear-gradient(90deg,var(--a) 0 var(--p),rgba(255,255,255,.1) var(--p) 100%)}
.spp-range::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#fff;border:4px solid var(--a);box-shadow:0 0 0 5px rgba(139,92,246,.2)}
.spp-range::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:#fff;border:4px solid var(--a)}
.spp-fee-line{display:flex;justify-content:space-between;font-size:12.5px;padding:10px 12px;border-radius:10px;border:1px solid var(--ln);color:#bdb7d6}
.spp-fee-line .neg{color:#fb7185;font-weight:500}
.spp-fee-res{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.spp-fee-res>div{padding:12px;border-radius:12px;background:rgba(255,255,255,.03)}
.spp-fee-res .mo{background:rgba(139,92,246,.12);border:1px solid var(--ln2)}
.spp-fee-res small{display:block;font-size:11px;color:var(--mu)}
.spp-fee-res b{font-size:20px;font-weight:600;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.spp-fee-bar{height:6px;border-radius:99px;background:#fb7185;overflow:hidden}
.spp-fee-bar i{display:block;height:100%;background:linear-gradient(90deg,#6d28d9,#a78bfa);transition:width .3s}

/* premiações */
.spp-awards{height:440vh}
.spp-awards .spp-sticky{justify-content:center}
.spp-aw-glow{position:absolute;left:62%;top:50%;width:900px;height:700px;translate:-50% -50%;filter:blur(40px);transition:background .6s;pointer-events:none}
.spp-aw-in{position:relative;display:grid;grid-template-columns:.9fr 1.1fr;gap:30px;align-items:center;height:100%;padding-top:70px}
.spp-aw-info{margin-top:40px}
.spp-aw-info .v{display:block;font-size:clamp(34px,4vw,52px);font-weight:500;letter-spacing:-.035em;margin:8px 0 12px}
.spp-aw-info .chip{display:inline-flex;align-items:center;gap:7px;padding:6px 12px;border-radius:99px;font-size:12.5px;border:1px solid var(--ln);background:rgba(255,255,255,.03)}
.spp-aw-info .chip i{width:9px;height:9px;border-radius:50%}
.spp-tl{position:relative;height:30px;margin-top:34px;max-width:420px}
.spp-tl .trk{position:absolute;left:0;right:0;top:5px;height:2px;background:rgba(255,255,255,.1)}
.spp-tl .trk i{display:block;height:100%;background:var(--a2);box-shadow:0 0 10px var(--a2)}
.spp-tl>span{position:absolute;top:0;width:12px;height:12px;margin-left:-6px;border-radius:50%;background:#1a1530;border:2px solid #3a3358;transition:all .3s}
.spp-tl>span.on{background:var(--a2);border-color:var(--a3);box-shadow:0 0 12px var(--a2)}
.spp-tl>span em{position:absolute;top:18px;left:50%;translate:-50% 0;font-family:var(--spp-mono),monospace;font-size:10px;color:var(--mu);-webkit-text-fill-color:currentColor;background:none}
.spp-aw-stage{position:relative;height:min(64vh,560px);perspective:1400px;transform-style:preserve-3d;display:grid;place-items:center}
.spp-plq{position:absolute;width:min(30vh,280px);aspect-ratio:720/976;transform-style:preserve-3d}
.spp-plq .frame{width:100%;height:100%;padding:12px;border-radius:8px;background:linear-gradient(145deg,#2a2638,#0b0a10 60%,#1b1824);
  box-shadow:0 50px 80px -30px rgba(0,0,0,.9),inset 0 1px 0 rgba(255,255,255,.15),inset 0 0 0 1px rgba(255,255,255,.05)}
.spp-plq .art{position:relative;overflow:hidden;width:100%;height:100%;border-radius:3px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:14px 10px 18px;text-align:center;
  background:radial-gradient(120% 70% at 50% 25%,color-mix(in srgb,var(--tc) 35%,#0b0716),#07050d 70%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.06),inset 0 8px 20px rgba(0,0,0,.7)}
.spp-plq .brand{position:absolute;top:12px;left:50%;translate:-50% 0;display:flex;align-items:center;gap:5px;font-size:10px;font-weight:600;color:#fff;opacity:.85}
.spp-plq img{width:92%;margin-bottom:-6%;mix-blend-mode:lighten}
.spp-plq small{font-size:9.5px;color:#d6d0ea}
.spp-plq b{font-size:clamp(36px,5.4vh,54px);font-weight:700;letter-spacing:-.04em;line-height:1;color:var(--tc);text-shadow:0 0 30px color-mix(in srgb,var(--tc) 60%,transparent)}
.spp-plq .glare{position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.12) 45%,transparent 60%);pointer-events:none}
@media (max-width:860px){
  .spp-aw-in{grid-template-columns:1fr;grid-template-rows:auto 1fr;gap:0;padding-top:84px;align-content:start}
  .spp-aw-txt .spp-sub{display:none}
  .spp-aw-txt .spp-h2{font-size:32px}
  .spp-aw-info{margin-top:10px}.spp-aw-info .v{font-size:28px;margin:4px 0 8px}
  .spp-tl{margin-top:18px}
  .spp-aw-stage{height:46vh}
  .spp-plq{width:min(26vh,200px)}
}

/* CTA */
.spp-ct{padding:60px 24px 120px}
.spp-ct-card{display:grid;grid-template-columns:1.4fr 1fr;align-items:center;gap:20px;padding:56px;border-radius:32px;overflow:hidden;
  background:radial-gradient(80% 120% at 100% 50%,rgba(109,40,217,.5),transparent 60%),linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.01));border:1px solid var(--ln2)}
.spp-ct-card .spp-badge{margin:0}
.spp-ct-card h2{font-size:clamp(30px,3.6vw,48px);font-weight:500;letter-spacing:-.035em;line-height:1.05;margin:18px 0 14px}
.spp-ct-card p{color:var(--mu);font-size:16px;line-height:1.6;margin:0 0 28px;max-width:480px;font-weight:300}
.spp-ct-card .r svg{width:100%;max-width:320px;margin-left:auto;display:block;filter:drop-shadow(0 0 50px rgba(139,92,246,.6));animation:sppHover 5s ease-in-out infinite;overflow:visible}
@media (max-width:760px){.spp-ct-card{grid-template-columns:1fr;padding:32px 24px}.spp-ct-card .r{display:none}}

/* FAQ */
.spp-faq{display:grid;grid-template-columns:.8fr 1.2fr;gap:60px;padding-bottom:120px}
.spp-faq-l{position:sticky;top:110px;align-self:start}
.spp-q{display:grid;place-items:center;width:52px;height:52px;border-radius:16px;font-size:24px;font-weight:600;margin-bottom:22px;color:var(--a3);background:rgba(139,92,246,.12);border:1px solid var(--ln2)}
.spp-fi{border-bottom:1px solid var(--ln)}
.spp-fi>button{width:100%;display:flex;align-items:center;gap:18px;padding:24px 0;text-align:left;font-size:17px;font-weight:400}
.spp-fi .n{font-family:var(--spp-mono),monospace;font-size:12px;color:var(--a2);flex-shrink:0}
.spp-fi .pl{margin-left:auto;flex-shrink:0;color:var(--mu);transition:transform .3s}
.spp-fi.on .pl{transform:rotate(45deg);color:var(--a3)}
.spp-fi p{margin:0;padding:0 40px 24px 48px;color:var(--mu);font-size:15px;line-height:1.65;font-weight:300}
@media (max-width:860px){.spp-faq{grid-template-columns:1fr;gap:20px}.spp-faq-l{position:static}.spp-fi p{padding-left:0;padding-right:0}}

/* rodapé */
.spp-foot{border-top:1px solid var(--ln);padding:70px 0 30px;background:#030208}
.spp-foot .g{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:30px}
.spp-foot .b p{color:var(--mu);font-size:14px;line-height:1.6;max-width:300px;margin:16px 0 0;font-weight:300}
.spp-foot h4{font-family:var(--spp-mono),monospace;font-size:11px;letter-spacing:.18em;color:#6f6a88;font-weight:400;margin:6px 0 16px}
.spp-foot .g>div>a:not(.spp-logo){display:block;color:#c9c3de;font-size:14px;margin-bottom:10px}
.spp-foot .g>div>a:not(.spp-logo):hover{color:#fff}
.spp-foot .bt{display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-top:50px;padding-top:22px;border-top:1px solid var(--ln);font-size:12.5px;color:#6f6a88}
@media (max-width:760px){.spp-foot .g{grid-template-columns:1fr 1fr}.spp-foot .b{grid-column:1/-1}}

@media (prefers-reduced-motion:reduce){.spp *{animation:none!important}}
`;
