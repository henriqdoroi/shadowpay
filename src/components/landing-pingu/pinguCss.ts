/* Estilos da landing pública (/ e /lp/pingu). Tudo em .sx-* (landing) e .pd-* (painel demo). */
export const PINGU_CSS = `
/* o wrapper do _app (e o CSS global no mobile) usam overflow-x:hidden, que quebra position:sticky — clip não quebra */
body:has(.sx),body:has(.sx) main,body:has(.sx) .overflow-x-hidden{overflow-x:clip!important;overflow-y:visible!important}
html:has(.sx){scroll-behavior:smooth;background:#050409}
.sx{--bg:#050409;--p1:#0c0a15;--ln:rgba(255,255,255,.08);--ln2:rgba(167,139,250,.22);--tx:#f5f3ff;--mu:#a19bb9;
  --a:#7c3aed;--a2:#a78bfa;--a3:#c4b5fd;--ad:#5b21b6;
  --disp:"Clash Display",var(--font-inter),ui-sans-serif,system-ui,sans-serif;
  --body:"Satoshi",var(--font-inter),ui-sans-serif,system-ui,sans-serif;
  --mono:var(--font-jetbrains),ui-monospace,monospace;
  position:relative;background:var(--bg);color:var(--tx);min-height:100vh;width:100%;font-family:var(--body);-webkit-font-smoothing:antialiased}
.sx *{box-sizing:border-box}
:where(.sx) a{color:inherit;text-decoration:none}
:where(.sx) img{display:block;max-width:100%}
:where(.sx) button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
.sx [id]{scroll-margin-top:84px}
.sx main,.sx footer{position:relative;z-index:1}
.sx-wrap{width:100%;max-width:1220px;margin:0 auto;padding:0 24px}
.sx-grain{position:fixed;inset:0;pointer-events:none;z-index:60;opacity:.06;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.hov{position:relative;isolation:isolate}
.hov:before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity .3s;z-index:-1;
  background:radial-gradient(300px circle at var(--x,50%) var(--y,50%),rgba(124,58,237,.16),transparent 60%)}
.hov:hover:before{opacity:1}

/* tipografia */
.sx-h2{font-family:var(--disp);font-size:clamp(32px,4.2vw,58px);font-weight:600;letter-spacing:-.025em;line-height:1.02;margin:16px 0 18px}
.sx-h2 span,.sx-hero h1 span,.sx-cta-card h2 span{color:var(--a2)}
.sx-h2.c{text-align:center}
.sx-sub{color:var(--mu);font-size:clamp(15px,1.25vw,17.5px);line-height:1.65;margin:0;max-width:520px}
.sx-tag{display:inline-flex;align-items:center;gap:10px;font-family:var(--mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#d8d2ee}
.sx-tag b{display:grid;place-items:center;width:30px;height:22px;border-radius:6px;background:var(--a);color:#fff;font-weight:600;font-size:11px}
.sx-h2.c+*,.sx-sec .sx-tag{margin-left:auto;margin-right:auto}
.sx-sec>.sx-wrap>div:first-child,.sx-faq>div:first-child{display:flex;justify-content:center}

/* botões */
.sx-btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;border-radius:12px;padding:12px 20px;font-weight:700;font-size:14.5px;color:#fff;white-space:nowrap;
  background:var(--a);box-shadow:0 0 0 1px rgba(196,181,253,.35) inset,0 12px 30px -10px rgba(124,58,237,.9);transition:transform .2s,background .2s,box-shadow .2s}
.sx-btn:hover{transform:translateY(-2px);background:#8b5cf6;box-shadow:0 0 0 1px rgba(196,181,253,.5) inset,0 18px 40px -10px rgba(139,92,246,1)}
.sx-btn.ghost{background:transparent;box-shadow:0 0 0 1px var(--ln) inset}
.sx-btn.ghost:hover{background:rgba(255,255,255,.05)}
.sx-btn.light{background:#fff;color:#1a1033;box-shadow:0 14px 40px -12px rgba(255,255,255,.4)}
.sx-btn.sm{padding:9px 16px;font-size:13.5px;border-radius:10px}
.sx-btn.lg{padding:16px 26px;font-size:15.5px;border-radius:14px}

/* nav */
.sx-nav{position:fixed;top:0;left:0;right:0;z-index:50;border-bottom:1px solid transparent;transition:background .3s,border-color .3s}
.sx-nav.solid{background:rgba(7,6,13,.82);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-color:var(--ln)}
.sx-nav-in{display:flex;align-items:center;gap:28px;height:72px}
.sx-logo{display:flex;align-items:center;gap:9px;font-family:var(--disp);font-weight:600;font-size:21px;letter-spacing:-.01em;flex-shrink:0}
.sx-logo img{width:34px;height:34px;object-fit:contain;filter:drop-shadow(0 0 10px rgba(139,92,246,.55))}
.sx-logo i{font-style:italic;font-weight:500;color:var(--a2);margin-left:1px}
.sx-links{display:flex;gap:26px;margin:0 auto;font-size:14.5px;font-weight:500}
.sx-links a{position:relative;padding:8px 0;color:var(--mu);transition:color .2s}
.sx-links a:hover,.sx-links a.on{color:#fff}
.sx-ul{position:absolute;left:0;right:0;bottom:-2px;height:2px;border-radius:2px;background:linear-gradient(90deg,var(--a2),var(--a));box-shadow:0 0 12px var(--a2)}
.sx-acts{display:flex;align-items:center;gap:18px}
.sx-txt{font-weight:600;font-size:14.5px;color:#ddd6f3}
.sx-txt:hover{color:#fff}
.sx-burger{display:none;margin-left:auto;width:42px;height:42px;border-radius:12px;place-items:center;box-shadow:0 0 0 1px var(--ln) inset}
.sx-mnav{overflow:hidden;border-top:1px solid var(--ln);background:rgba(7,6,13,.96)}
.sx-mnav>div{display:flex;flex-direction:column;padding:10px 24px 22px}
.sx-mnav a:not(.sx-btn){padding:13px 0;border-bottom:1px solid var(--ln);color:#ddd6f3;font-weight:500}
.sx-mnav-cta{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
@media (max-width:1020px){.sx-links,.sx-acts{display:none}.sx-burger{display:grid}}

/* hero */
.sx-hero{position:relative;min-height:100vh;display:flex;align-items:center;padding:110px 0 70px;overflow:hidden}
.sx-fog{position:absolute;border-radius:50%;filter:blur(90px);pointer-events:none;animation:sxFog 16s ease-in-out infinite}
.sx-fog.f1{width:760px;height:560px;right:-160px;top:-120px;background:rgba(109,40,217,.45)}
.sx-fog.f2{width:600px;height:460px;left:-220px;bottom:-200px;background:rgba(76,29,149,.38);animation-delay:-8s}
@keyframes sxFog{50%{transform:translate(-40px,30px) scale(1.08)}}
.sx-slashbg{position:absolute;inset:0;pointer-events:none;background:linear-gradient(118deg,transparent 46%,rgba(196,181,253,.10) 49.6%,rgba(255,255,255,.22) 50%,rgba(196,181,253,.10) 50.4%,transparent 54%)}
.sx-hero-in{position:relative;display:grid;grid-template-columns:1.05fr .95fr;gap:40px;align-items:center}
.sx-chip{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:500;color:#e6e0fb;background:rgba(124,58,237,.14);box-shadow:0 0 0 1px var(--ln2) inset}
.sx-chip svg{color:var(--a3)}
.sx-hero h1{font-family:var(--disp);font-size:clamp(44px,6.3vw,88px);font-weight:600;letter-spacing:-.03em;line-height:.98;margin:22px 0 22px}
.sx-hero h1 span{display:inline-block;background:linear-gradient(100deg,#ddd6fe,#a78bfa 45%,#7c3aed);-webkit-background-clip:text;background-clip:text;color:transparent}
.sx-hero-txt>p{color:var(--mu);font-size:clamp(15.5px,1.35vw,18.5px);line-height:1.65;max-width:540px;margin:0}
.sx-cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:34px}
.sx-stats{display:flex;gap:34px;margin:40px 0 0;padding-top:26px;border-top:1px solid var(--ln)}
.sx-stats dt{font-family:var(--disp);font-size:28px;font-weight:600;letter-spacing:-.02em}
.sx-stats dd{margin:2px 0 0;font-size:13px;color:var(--mu)}
.sx-hero-art{position:relative;aspect-ratio:.92;max-width:560px;width:100%;justify-self:center}
.sx-halo{position:absolute;inset:12%;border-radius:50%;background:radial-gradient(circle,rgba(139,92,246,.55),rgba(91,33,182,.15) 55%,transparent 70%);filter:blur(10px);animation:sxPulse 5s ease-in-out infinite}
@keyframes sxPulse{50%{transform:scale(1.06);opacity:.8}}
.sx-hero-ninja{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 30px 60px rgba(0,0,0,.6));animation:sxBob 6s ease-in-out infinite}
@keyframes sxBob{50%{transform:translateY(-14px) rotate(-1.5deg)}}
.sx-hero-3d{position:absolute;inset:-6% -8% -10% -8%;z-index:2}
.sx-hero-3d canvas{touch-action:pan-y}
.sx-hero-ninja{inset:-2% 40% 30% -6%!important;width:66%!important;height:auto!important;z-index:1}
.sx-hero-phone{position:absolute;right:4%;top:2%;width:min(280px,50%);z-index:2;rotate:4deg;
  filter:drop-shadow(0 40px 60px rgba(0,0,0,.65)) drop-shadow(0 0 40px rgba(124,58,237,.35));animation:sxPhone 7s ease-in-out infinite}
@keyframes sxPhone{50%{transform:translateY(-12px);rotate:2.5deg}}
.sx-feed{position:absolute;right:-2%;bottom:-6%;width:min(300px,64%);display:flex;flex-direction:column;gap:8px}
.sx-notif{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:rgba(20,16,36,.78);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  box-shadow:0 0 0 1px rgba(255,255,255,.1) inset,0 18px 40px -14px rgba(0,0,0,.8);transform-origin:top center}
.sx-notif img{width:30px;height:30px;object-fit:contain;flex-shrink:0}
.sx-notif b{display:block;font-size:13px}
.sx-notif small{font-size:11.5px;color:var(--mu)}
.sx-notif strong{margin-left:auto;font-size:13.5px;color:#4ade80;white-space:nowrap}
.sx-scroll{position:absolute;left:50%;bottom:20px;translate:-50% 0;color:var(--mu);animation:sxDown 2s ease-in-out infinite}
@keyframes sxDown{50%{transform:translateY(6px)}}
@media (max-width:900px){
  .sx-hero{padding-top:100px}
  .sx-hero-in{grid-template-columns:1fr;gap:10px}
  .sx-hero-art{max-width:400px;order:-1;margin-bottom:-40px}
  .sx-hero-art{margin-bottom:24px;aspect-ratio:.85;max-width:360px}
  .sx-hero-ninja{inset:0 46% 40% -4%!important;width:58%!important}
  .sx-hero-phone{width:56%;right:8%}
  .sx-stats{gap:22px}.sx-stats dt{font-size:23px}
  .sx-scroll{display:none}
}

/* cenas presas */
.sx-scene{position:relative}
.sx-sticky{position:sticky;top:0;height:100vh;overflow:hidden}

/* integrações: órbita */
.sx-integ{height:260vh}
.sx-integ-grid{height:100%;display:grid;grid-template-columns:.85fr 1.15fr;gap:30px;align-items:center;padding-top:72px}
.sx-counter{display:flex;align-items:baseline;gap:10px;margin-top:34px;font-family:var(--mono)}
.sx-counter b{font-family:var(--disp);font-size:64px;font-weight:600;line-height:1;color:var(--a2);font-variant-numeric:tabular-nums}
.sx-counter span{color:var(--mu);font-size:13px}
.sx-orbit{position:relative;width:100%;aspect-ratio:1.15;max-height:calc(100vh - 120px);perspective:900px}
.sx-orbit-rings{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.sx-orbit-rings ellipse{fill:none;stroke:rgba(167,139,250,.22);stroke-width:.25;stroke-dasharray:1 1.4;vector-effect:non-scaling-stroke}
.sx-orbit-core{position:absolute;left:50%;top:50%;width:38%;aspect-ratio:1;translate:-50% -50%;z-index:2;transform-style:preserve-3d}
.sx-orbit-core:before{content:"";position:absolute;inset:-10%;border-radius:50%;background:radial-gradient(circle,rgba(139,92,246,.5),transparent 65%);filter:blur(8px)}
.sx-orbit-core img{position:relative;width:100%;height:100%;object-fit:contain}
.sx-orb-chip{position:absolute;translate:-50% -50%;display:flex;align-items:center;gap:9px;padding:7px 14px 7px 7px;border-radius:12px;white-space:nowrap;font-weight:600;font-size:14.5px;
  background:rgba(16,13,30,.86);backdrop-filter:blur(8px);box-shadow:0 0 0 1px var(--ln2) inset,0 14px 30px -14px rgba(0,0,0,.9)}
.sx-orb-chip .ic{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;overflow:hidden}
.sx-orb-chip .ic img{width:21px;height:21px;object-fit:contain}
@media (max-width:860px){
  .sx-integ-grid{grid-template-columns:1fr;grid-template-rows:auto 1fr;gap:0;align-content:start;padding-top:86px}
  .sx-integ-txt .sx-sub{display:none}
  .sx-integ-txt .sx-h2{font-size:30px;margin:10px 0 6px}
  .sx-counter{margin-top:8px}.sx-counter b{font-size:38px}
  .sx-orbit{aspect-ratio:.8;max-height:calc(100vh - 290px);margin:0 auto;width:min(100%,calc((100vh - 290px)*.8))}
  .sx-orb-chip{font-size:11.5px;padding:5px 9px 5px 5px;gap:6px}.sx-orb-chip .ic{width:24px;height:24px}.sx-orb-chip .ic img{width:16px;height:16px}
}

/* painel: katana */
.sx-panel{height:400vh}
.sx-panel-cap{position:absolute;left:max(24px,calc(50% - 586px));top:50%;translate:0 -50%;width:min(470px,calc(100% - 48px));z-index:3}
.sx-feats{list-style:none;padding:0;margin:28px 0 0;display:grid;gap:10px}
.sx-feats li{display:flex;align-items:center;gap:12px}
.sx-feats li>span{width:34px;height:34px;flex-shrink:0;border-radius:10px;display:grid;place-items:center;background:rgba(124,58,237,.16);color:var(--a3);box-shadow:0 0 0 1px var(--ln2) inset}
.sx-feats b{display:block;font-size:14.5px}
.sx-feats small{font-size:13px;color:var(--mu)}
.sx-panel-ninja{position:absolute;right:max(24px,calc(50% - 600px));top:50%;width:min(44vw,540px);translate:0 -50%;z-index:2;filter:drop-shadow(0 0 70px rgba(139,92,246,.4))}
.sx-katana{position:absolute;left:-10%;top:50%;width:120%;height:3px;z-index:6;transform-origin:100% 50%;rotate:-28deg;
  background:linear-gradient(90deg,transparent,#ede9fe 30%,#fff 50%,#ede9fe 70%,transparent);box-shadow:0 0 18px #c4b5fd,0 0 50px #8b5cf6}
.sx-window{position:absolute;left:50%;top:86px;bottom:24px;width:min(1220px,calc(100% - 48px));translate:-50% 0;z-index:4;border-radius:16px;overflow:hidden;
  background:#08060f;box-shadow:0 0 0 1px var(--ln2),0 40px 120px -30px rgba(109,40,217,.7);display:flex;flex-direction:column}
.sx-winbar{height:40px;flex-shrink:0;display:flex;align-items:center;padding:0 14px;border-bottom:1px solid var(--ln);background:#0c0a15}
.sx-winbar .dots{display:flex;gap:6px}.sx-winbar .dots i{width:10px;height:10px;border-radius:3px;background:#3a3354}
.sx-winbar .url{margin:0 auto;display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--mu);padding:5px 40px;border-radius:8px;background:rgba(255,255,255,.04)}
.sx-view{position:relative;flex:1;overflow:hidden;padding:20px}
.sx-view>div{will-change:transform}
.sx-float-cta{position:absolute;right:16px;bottom:16px;display:flex;align-items:center;gap:7px;padding:11px 16px;border-radius:12px;font-size:13.5px;font-weight:700;background:var(--a);box-shadow:0 12px 30px -8px rgba(124,58,237,.95)}
@media (max-width:860px){
  .sx-panel-cap{top:92px;translate:none}
  .sx-feats{display:none}
  .sx-panel-ninja{right:auto;left:50%;top:auto;bottom:5vh;width:68vw;translate:-50% 0}
  .sx-window{top:76px;bottom:16px;width:calc(100% - 24px)}
  .sx-view{padding:10px}
}

/* painel demo (1100px de largura de projeto) */
.pd{width:1100px;color:#ece9f8;font-size:13px;display:flex;flex-direction:column;gap:14px;padding-bottom:20px;font-family:var(--body)}
.pd-nav{display:flex;align-items:center;gap:16px;padding:10px 14px;border-radius:14px;background:#0f0c1c;border:1px solid var(--ln)}
.pd-brand{display:flex;align-items:center;gap:7px;font-weight:700;font-size:14px}
.pd-brand img{width:24px;height:24px;object-fit:contain}
.pd-brand.lg{font-size:20px}.pd-brand.lg img{width:32px;height:32px}
.pd-tabs{display:flex;gap:4px;font-size:12px;color:var(--mu)}
.pd-tabs span{display:flex;align-items:center;gap:6px;padding:7px 11px;border-radius:9px}
.pd-tabs span.on{background:rgba(139,92,246,.18);color:#fff;box-shadow:inset 0 0 0 1px rgba(167,139,250,.35)}
.pd-bal{margin-left:auto;text-align:right;padding:5px 12px;border-radius:9px;background:rgba(255,255,255,.04)}
.pd-bal small{display:block;font-size:9px;color:var(--mu);letter-spacing:.1em}.pd-bal b{font-size:13px}
.pd-av{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:var(--a);font-weight:600}
.pd-banner{position:relative;overflow:hidden;display:flex;justify-content:space-between;align-items:center;padding:30px 36px;border-radius:18px;background:linear-gradient(110deg,#4c1d95,#6d28d9 45%,#1e1038);min-height:170px}
.pd-banner small{font-size:12.5px;color:#e9e3ff}.pd-banner small u{color:#fff}
.pd-banner h4{margin:12px 0 0;font-family:var(--disp);font-size:30px;font-weight:500;line-height:1.05;letter-spacing:-.01em}
.pd-banner h4 em{font-style:normal;font-weight:600}
.pd-banner-r{display:flex;flex-direction:column;align-items:flex-end;gap:12px;position:relative;z-index:1}
.pd-chip{display:flex;align-items:center;gap:7px;padding:9px 16px;border-radius:10px;background:#fff;color:#4c1d95;font-weight:700}
.pd-banner-ninja{position:absolute;right:250px;top:-36px;width:240px}
.pd-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.pd-card{padding:16px;border-radius:16px;background:#0e0b1a;border:1px solid var(--ln)}
.pd-kh{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.pd-kh small{font-size:10.5px;letter-spacing:.08em;color:var(--mu)}
.pd-kh>span{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;border:1px solid var(--ln2);color:var(--a3)}
.pd-kpi b{display:block;font-size:24px;font-weight:700;margin:12px 0 4px;letter-spacing:-.02em}
.pd-kpi em{font-style:normal;font-size:11.5px;color:var(--a2)}
.pd-row{display:grid;grid-template-columns:1.65fr 1fr;gap:14px}
.pd h5{margin:0;font-size:14px;font-weight:700}
.pd-chart small,.pd-meta>small,.pd-table small,.pd-pix>small{font-size:11.5px;color:var(--mu)}
.pd-seg{display:flex;gap:4px;font-size:11px}
.pd-seg span{padding:5px 9px;border-radius:7px;background:rgba(255,255,255,.04);color:var(--mu)}
.pd-seg span.on{background:var(--a);color:#fff}
.pd-area{width:100%;height:220px;display:block;margin-top:14px}
.pd-hours{display:flex;justify-content:space-between;font-size:10.5px;color:#6f6a88;margin-top:6px}
.pd-tag{font-size:9.5px;padding:4px 8px;border-radius:6px;background:rgba(139,92,246,.18);color:var(--a3);letter-spacing:.05em}
.pd-plaque{margin:14px auto;width:120px;height:150px;border-radius:10px;border:3px solid #1d1830;background:radial-gradient(circle at 50% 30%,#2e1065,#0b0716);
  display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:12px;box-shadow:0 20px 40px -10px rgba(139,92,246,.6)}
.pd-plaque img{width:84px}
.pd-plaque b{font-size:24px;line-height:1}.pd-plaque em{font-style:normal;font-size:10px;color:var(--a3)}
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

/* recursos (bento) */
.sx-sec{padding:150px 0 120px}
.sx-bento{display:grid;grid-template-columns:repeat(12,1fr);gap:16px;margin-top:56px}
.sx-bento .b1{grid-column:span 7}.sx-bento .b2{grid-column:span 5}.sx-bento .b3{grid-column:span 5}.sx-bento .b4{grid-column:span 7}
.sx-bento>div>.sx-card{height:100%}
.sx-card{position:relative;padding:26px;border-radius:20px;background:var(--p1);box-shadow:0 0 0 1px var(--ln) inset;overflow:hidden}
.sx-card:after{content:"";position:absolute;left:24px;right:24px;top:0;height:1px;background:linear-gradient(90deg,transparent,var(--a2),transparent);opacity:.6}
.sx-card header{margin-bottom:20px}
.sx-card header em{font-style:normal;font-family:var(--mono);font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--a2)}
.sx-card h3{font-family:var(--disp);font-size:clamp(21px,2vw,27px);font-weight:600;letter-spacing:-.015em;line-height:1.15;margin:8px 0 0}
.sx-card h3 .hl{color:var(--a2)}
.sx-more{display:inline-flex;align-items:center;gap:6px;margin-top:16px;font-size:14px;font-weight:600;color:var(--a3)}
@media (max-width:900px){.sx-bento .b1,.sx-bento .b2,.sx-bento .b3,.sx-bento .b4{grid-column:1/-1}}

.sx-ckb{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.sx-ckb-ed,.sx-ckb-pv{border-radius:14px;padding:14px}
.sx-ckb-ed{background:#0a0812;box-shadow:0 0 0 1px var(--ln) inset;font-size:12.5px}
.sx-ckb-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.sx-ckb-h .live{font-size:11px;color:#4ade80}
.sx-ckb .row{display:flex;justify-content:space-between;align-items:center;color:#d6d0ea;margin:10px 0}
.sx-ckb .sw{display:flex;gap:6px}
.sx-ckb .sw button{width:18px;height:18px;border-radius:5px;outline:2px solid transparent;outline-offset:2px;transition:outline-color .2s}
.sx-ckb .sw button.on{outline-color:#fff}
.sx-ckb .tg{cursor:pointer}.sx-ckb .tg input{display:none}
.sx-ckb .tg i{width:32px;height:18px;border-radius:6px;background:rgba(255,255,255,.12);position:relative;transition:background .2s}
.sx-ckb .tg i:after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:4px;background:#fff;transition:transform .2s}
.sx-ckb .tg input:checked+i{background:var(--a)}
.sx-ckb .tg input:checked+i:after{transform:translateX(14px)}
.sx-ckb .blks{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
.sx-ckb .blks span{display:flex;align-items:center;gap:4px;font-size:11px;padding:5px 8px;border-radius:7px;box-shadow:0 0 0 1px var(--ln2) inset;color:#cfc8e8}
.sx-ckb-pv{background:#f6f5fa;color:#16121f;font-size:12px;display:flex;flex-direction:column;gap:7px}
.sx-ckb-pv .tm{text-align:center;padding:6px;border-radius:var(--r);background:var(--ck);color:#fff;font-size:11px;transition:all .3s}
.sx-ckb-pv .pr{display:flex;align-items:center;gap:8px;font-size:11.5px}
.sx-ckb-pv .pr .th{width:30px;height:30px;border-radius:calc(var(--r)*.6);background:linear-gradient(135deg,var(--ck),#000);flex-shrink:0}
.sx-ckb-pv .pr small{display:block;font-size:10px;color:#6b6780}
.sx-ckb-pv .pr>b{margin-left:auto}
.sx-ckb-pv .st{display:flex;align-items:center;gap:6px;font-weight:700;font-size:11.5px}
.sx-ckb-pv .st i{width:16px;height:16px;border-radius:5px;background:var(--ck);color:#fff;display:grid;place-items:center;font-style:normal;font-size:10px}
.sx-ckb-pv .in{padding:7px 9px;border-radius:var(--r);border:1px solid #e3e0ee;background:#fff;color:#9a96aa;font-size:11px;transition:border-radius .3s}
.sx-ckb-pv .px{display:flex;align-items:center;gap:6px;padding:8px 9px;border-radius:var(--r);border:1.5px solid var(--ck);color:var(--ck);font-weight:700;font-size:11.5px}
.sx-ckb-pv .px small{margin-left:auto;font-weight:400;color:#6b6780;font-size:10px}
.sx-ckb-pv .ob{display:flex;align-items:center;gap:6px;padding:7px 9px;border-radius:var(--r);background:color-mix(in srgb,var(--ck) 10%,#fff);font-size:11px}
.sx-ckb-pv .ob svg{color:var(--ck)}.sx-ckb-pv .ob b{margin-left:auto}
.sx-ckb-pv .pay{text-align:center;padding:10px;border-radius:var(--r);background:var(--ck);color:#fff;font-weight:700;transition:all .3s}
.sx-ckb-pv .sec{display:flex;align-items:center;justify-content:center;gap:4px;color:#6b6780;font-size:10px}
@media (max-width:520px){.sx-ckb{grid-template-columns:1fr}}

.sx-chat{border-radius:14px;background:#0a0812;box-shadow:0 0 0 1px var(--ln) inset;padding:14px}
.sx-chat-h{display:flex;align-items:center;gap:10px;padding-bottom:12px;border-bottom:1px solid var(--ln)}
.sx-chat-h img{width:32px;height:32px;object-fit:contain}
.sx-chat-h b{display:block;font-size:14px}
.sx-chat-h small{display:flex;align-items:center;gap:6px;font-size:11.5px;color:#4ade80}
.sx-chat-h small i{width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 8px #4ade80}
.sx-chat-h .hp{margin-left:auto;color:var(--mu)}
.sx-chat-body{min-height:210px;display:flex;flex-direction:column;gap:8px;justify-content:flex-end;padding-top:12px}
.sx-chat .msg{max-width:84%;padding:10px 13px;border-radius:12px 12px 12px 3px;font-size:13.5px;line-height:1.45;background:rgba(255,255,255,.07)}
.sx-chat .msg.me{align-self:flex-end;border-radius:12px 12px 3px 12px;background:var(--a)}
.sx-chat .typing{display:flex;gap:4px;padding:12px 14px;border-radius:12px;background:rgba(255,255,255,.07);width:max-content}
.sx-chat .typing i{width:6px;height:6px;border-radius:50%;background:var(--mu);animation:sxDot 1s infinite}
.sx-chat .typing i:nth-child(2){animation-delay:.15s}.sx-chat .typing i:nth-child(3){animation-delay:.3s}
@keyframes sxDot{50%{transform:translateY(-4px);opacity:.4}}

.sx-flow{list-style:none;margin:0;padding:0;display:grid;gap:10px;position:relative}
.sx-flow li{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;background:#0a0812;box-shadow:0 0 0 1px var(--ln) inset;color:var(--mu);font-weight:600;font-size:14.5px;transition:all .35s}
.sx-flow li>span{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:rgba(255,255,255,.06);font-size:12.5px;transition:all .35s}
.sx-flow li.now{color:#fff;box-shadow:0 0 0 1px var(--a2) inset,0 0 30px -8px rgba(139,92,246,.8)}
.sx-flow li.now>span{background:var(--a);color:#fff}
.sx-flow li.done{color:#d6d0ea}
.sx-flow li.done>span{background:rgba(74,222,128,.16);color:#4ade80}

.sx-fee{display:grid;gap:16px}
.sx-fee label{display:grid;gap:8px}
.sx-fee label>span{display:flex;justify-content:space-between;font-size:14px;color:#d6d0ea}
.sx-fee label b{font-variant-numeric:tabular-nums}
.sx-range{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:4px;outline:none;cursor:pointer;background:linear-gradient(90deg,var(--a2) 0 var(--p),rgba(255,255,255,.1) var(--p) 100%)}
.sx-range::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:6px;background:#fff;box-shadow:0 0 0 4px rgba(124,58,237,.5)}
.sx-range::-moz-range-thumb{width:18px;height:18px;border-radius:6px;background:#fff;border:0}
.sx-fee .out{display:grid;grid-template-columns:1fr 1fr 1.3fr;gap:10px}
.sx-fee .out>div{padding:12px;border-radius:12px;background:#0a0812;box-shadow:0 0 0 1px var(--ln) inset}
.sx-fee .out .big{background:linear-gradient(135deg,#5b21b6,#7c3aed);box-shadow:none}
.sx-fee .out small{display:block;font-size:11.5px;color:var(--mu)}
.sx-fee .out .big small{color:#e9e3ff}
.sx-fee .out b{font-family:var(--disp);font-size:19px;font-weight:600;font-variant-numeric:tabular-nums}
.sx-fee .out .neg{color:#fb7185}
@media (max-width:520px){.sx-fee .out{grid-template-columns:1fr 1fr}.sx-fee .out .big{grid-column:1/-1}}

/* premiações: contador */
.sx-awards{height:320vh}
.sx-aw{height:100%;display:grid;grid-template-columns:.9fr 1.1fr;gap:40px;align-items:center;padding-top:72px}
.sx-meter{margin-top:34px;padding:22px;border-radius:18px;background:var(--p1);box-shadow:0 0 0 1px var(--ln) inset}
.sx-meter>small{font-size:12px;color:var(--mu);font-family:var(--mono);text-transform:uppercase;letter-spacing:.08em}
.sx-meter>b{display:block;font-family:var(--disp);font-size:clamp(34px,4vw,52px);font-weight:600;letter-spacing:-.02em;margin:6px 0 18px;font-variant-numeric:tabular-nums}
.sx-meter .trk{position:relative;height:8px;border-radius:6px;background:rgba(255,255,255,.08);margin-bottom:30px}
.sx-meter .trk>i{display:block;height:100%;border-radius:6px;background:linear-gradient(90deg,#5b21b6,#a78bfa);box-shadow:0 0 16px rgba(167,139,250,.7)}
.sx-meter .trk>span{position:absolute;top:50%;width:14px;height:14px;translate:-50% -50%;border-radius:4px;background:#1a1530;box-shadow:0 0 0 2px #3a3358;transition:all .3s}
.sx-meter .trk>span.on{background:var(--a2);box-shadow:0 0 0 2px var(--a3),0 0 14px var(--a2)}
.sx-meter .trk>span em{position:absolute;top:18px;left:50%;translate:-50% 0;font-style:normal;font-family:var(--mono);font-size:10.5px;color:var(--mu)}
.sx-meter .nx{margin:0;font-size:13.5px;color:var(--mu)}
.sx-meter .nx b{color:#fff}
.sx-aw-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;justify-self:center;width:min(100%,calc((100vh - 210px) * .75 + 14px))}
.sx-prize{position:relative;aspect-ratio:225/300;border-radius:16px;overflow:hidden;background:#120e22;box-shadow:0 0 0 1px var(--ln) inset;transition:box-shadow .5s,transform .5s}
.sx-prize .art{position:absolute;inset:0;background:url(/dashboard-banner.webp) no-repeat;background-size:888.9% auto;filter:grayscale(1) brightness(.35) blur(3px);transform:scale(1.04);transition:filter .6s,transform .6s}
.sx-prize .lock{position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:rgba(5,4,9,.7);color:var(--mu);transition:all .4s}
.sx-prize .cap{position:absolute;left:0;right:0;bottom:0;padding:30px 14px 12px;background:linear-gradient(transparent,rgba(5,4,9,.92))}
.sx-prize .cap b{display:block;font-family:var(--disp);font-size:24px;font-weight:600}
.sx-prize .cap small{font-size:12.5px;color:var(--mu)}
.sx-prize.on{box-shadow:0 0 0 1px var(--a2) inset,0 20px 60px -16px rgba(139,92,246,.9);transform:translateY(-4px)}
.sx-prize.on .art{filter:none;transform:scale(1)}
.sx-prize.on .lock{background:var(--a);color:#fff}
.sx-prize.on .cap small{color:#4ade80;font-weight:700}
@media (max-width:860px){
  .sx-aw{grid-template-columns:1fr;grid-template-rows:auto 1fr;gap:14px;padding-top:84px;align-content:start}
  .sx-aw-l .sx-sub{display:none}
  .sx-aw-l .sx-h2{font-size:32px;margin:8px 0 0}
  .sx-meter{margin-top:12px;padding:14px}.sx-meter>b{font-size:28px;margin:2px 0 12px}
  .sx-aw-grid{grid-template-columns:repeat(4,1fr);gap:8px;width:100%}
  .sx-prize .cap{padding:16px 6px 6px}.sx-prize .cap b{font-size:15px}.sx-prize .cap small{font-size:9.5px}.sx-prize .lock{width:22px;height:22px;top:5px;right:5px}
}

/* CTA */
.sx-cta-sec{padding:40px 24px 110px}
.sx-cta-card{position:relative;display:grid;grid-template-columns:auto 1fr auto;gap:30px;align-items:center;padding:34px 40px;border-radius:24px;overflow:hidden;
  background:linear-gradient(110deg,#2e1065,#5b21b6 55%,#7c3aed);box-shadow:0 40px 100px -40px rgba(124,58,237,.9)}
.sx-cta-card .nj{width:130px;filter:drop-shadow(0 10px 30px rgba(0,0,0,.5))}
.sx-cta-card h2{font-family:var(--disp);font-size:clamp(26px,3vw,40px);font-weight:600;letter-spacing:-.02em;line-height:1.05;margin:0 0 8px}
.sx-cta-card h2 span{color:#fff;text-decoration:underline;text-decoration-color:rgba(255,255,255,.4);text-underline-offset:6px}
.sx-cta-card p{margin:0;color:#e9e3ff;font-size:15.5px;line-height:1.55;max-width:520px}
@media (max-width:900px){.sx-cta-card{grid-template-columns:1fr;text-align:center;justify-items:center;padding:30px 22px}.sx-cta-card .nj{width:100px}}

/* FAQ */
.sx-faq{padding-bottom:120px}
.sx-faq-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:44px;align-items:start}
.sx-fq{border-radius:16px;background:var(--p1);box-shadow:0 0 0 1px var(--ln) inset;transition:box-shadow .25s}
.sx-fq.on{box-shadow:0 0 0 1px var(--ln2) inset}
.sx-fq>button{width:100%;display:flex;justify-content:space-between;align-items:center;gap:14px;padding:20px 22px;text-align:left;font-size:16px;font-weight:700}
.sx-fq>button svg{flex-shrink:0;color:var(--a2);transition:transform .25s}
.sx-fq.on>button svg{transform:rotate(180deg)}
.sx-fq p{margin:0;padding:0 22px 20px;color:var(--mu);font-size:14.5px;line-height:1.65}
@media (max-width:800px){.sx-faq-grid{grid-template-columns:1fr}}

/* rodapé */
.sx-foot{border-top:1px solid var(--ln);padding:64px 0 28px;background:#040308}
.sx-foot .g{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:30px}
.sx-foot .b p{color:var(--mu);font-size:14px;line-height:1.6;max-width:300px;margin:16px 0 0}
.sx-foot h4{font-size:14px;margin:6px 0 14px}
.sx-foot .g>div>a:not(.sx-logo){display:block;color:var(--mu);font-size:14px;margin-bottom:10px}
.sx-foot .g>div>a:not(.sx-logo):hover{color:#fff}
.sx-foot .bt{display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-top:44px;padding-top:22px;border-top:1px solid var(--ln);font-size:12.5px;color:#6f6a88}
.sx-foot .bt span{display:flex;align-items:center;gap:6px}
@media (max-width:760px){.sx-foot .g{grid-template-columns:1fr 1fr}.sx-foot .b{grid-column:1/-1}}

@media (prefers-reduced-motion:reduce){.sx *{animation:none!important}}
`;
