import { LayoutDashboard, ShoppingBag, Package, Wallet, Plug, User, Headphones, TrendingUp, Check, Percent } from "lucide-react";

/* Painel ShadowPay de demonstração (largura de projeto 1100px; o pai escala). */

const SERIES = [2, 1, 1, 1, 2, 3, 6, 9, 14, 18, 24, 31, 36, 40, 38, 33, 28, 22, 17, 12, 8, 5, 3, 2];

function Area() {
  const w = 640, h = 200, max = Math.max(...SERIES);
  const pts = SERIES.map((v, i) => [(i / (SERIES.length - 1)) * w, h - (v / max) * (h - 20) - 4] as const);
  let d = `M${pts[0]![0]},${pts[0]![1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]!;
    const [x1, y1] = pts[i]!;
    const cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="pd-area" preserveAspectRatio="none">
      <defs>
        <linearGradient id="pdA" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#8b5cf6" stopOpacity=".55" />
          <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.2, 0.4, 0.6, 0.8].map((g) => <line key={g} x1="0" x2={w} y1={h * g} y2={h * g} stroke="rgba(255,255,255,.05)" />)}
      <path d={`${d} L${w},${h} L0,${h} Z`} fill="url(#pdA)" />
      <path d={d} fill="none" stroke="#a78bfa" strokeWidth="2.5" />
    </svg>
  );
}

const VENDAS = [
  ["Mentoria Escala", "Ana P.", "R$ 997,00", true],
  ["Kit Premium", "Bruno M.", "R$ 289,90", true],
  ["Curso Lançamento", "Carla S.", "R$ 297,00", true],
  ["Assinatura Pro", "Diego R.", "R$ 79,90", true],
  ["Kit Premium", "Elisa T.", "R$ 289,90", false],
  ["Mentoria Escala", "Fábio L.", "R$ 997,00", true],
] as const;

export default function DashboardPanel() {
  const tabs = [
    [LayoutDashboard, "Dashboard"], [ShoppingBag, "Vendas"], [Package, "Produtos"], [Wallet, "Financeiro"],
    [Plug, "Integrações"], [User, "Minha conta"],
  ] as const;
  return (
    <div className="pd">
      <div className="pd-nav">
        <span className="pd-brand"><img src="/logoshadowpay.png" alt="" /> ShadowPay</span>
        <div className="pd-tabs">
          {tabs.map(([I, t], k) => <span key={t} className={k === 0 ? "on" : ""}><I size={13} /> {t}</span>)}
        </div>
        <div className="pd-bal"><small>DISPONÍVEL</small><b>R$ 3.270,43</b></div>
        <span className="pd-av">S</span>
      </div>

      <div className="pd-banner">
        <div>
          <small><u>Precisa de ajuda?</u> Conte com uma equipe pronta pra fazer seu negócio crescer.</small>
          <h4>CONTE COM NOSSO<br /><em>SUPORTE SHADOWPAY</em></h4>
        </div>
        <div className="pd-banner-r">
          <span className="pd-brand lg"><img src="/logoshadowpay.png" alt="" /> ShadowPay</span>
          <span className="pd-chip"><Headphones size={14} /> Gerente dedicado</span>
        </div>
        <img src="/logoshadowpay1.png" alt="" className="pd-banner-ninja" />
      </div>

      <div className="pd-kpis">
        {[
          ["RECEITA LÍQUIDA", "R$ 18.452,90", "+8,2% esta semana", TrendingUp],
          ["VENDAS PAGAS", "241", "+32 hoje", Check],
          ["TAXA DE APROVAÇÃO", "92,4%", "acima da média", Percent],
        ].map(([k, v, s, I]) => {
          const Ic = I as typeof Check;
          return (
            <div key={k as string} className="pd-card pd-kpi">
              <div className="pd-kh"><small>{k as string}</small><span><Ic size={13} /></span></div>
              <b>{v as string}</b>
              <em>{s as string}</em>
            </div>
          );
        })}
      </div>

      <div className="pd-row">
        <div className="pd-card pd-chart">
          <div className="pd-kh">
            <div><h5>Desempenho de vendas</h5><small>Evolução diária da receita em tempo real</small></div>
            <div className="pd-seg"><span className="on">Hoje</span><span>7 dias</span><span>30 dias</span><span>Máximo</span></div>
          </div>
          <Area />
          <div className="pd-hours">{["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"].map((h) => <span key={h}>{h}</span>)}</div>
        </div>
        <div className="pd-card pd-meta">
          <div className="pd-kh"><h5>Meta de premiação</h5><span className="pd-tag">META: 500K</span></div>
          <small>Conquista por faturamento</small>
          <div className="pd-plaque"><img src="/logoshadowpay1.png" alt="" /><b>500K</b><em>iPad</em></div>
          <div className="pd-mrow"><span>R$ 421.320,00 faturados</span><b>84%</b></div>
          <div className="pd-bar"><i style={{ width: "84%" }} /></div>
          <div className="pd-mrow"><span>Próximo marco</span><span>faltam R$ 78.680,00</span></div>
        </div>
      </div>

      <div className="pd-row">
        <div className="pd-card pd-table">
          <div className="pd-kh"><div><h5>Últimas vendas</h5><small>Atualizado em tempo real</small></div><span className="pd-live">AO VIVO</span></div>
          <table>
            <thead><tr><th>PRODUTO</th><th>CLIENTE</th><th>MÉTODO</th><th>VALOR</th><th>STATUS</th></tr></thead>
            <tbody>
              {VENDAS.map(([p, c, v, ok], k) => (
                <tr key={k}><td>{p}</td><td>{c}</td><td>Pix</td><td>{v}</td><td><span className={"pd-st" + (ok ? "" : " wait")}>{ok ? "Aprovada" : "Aguardando"}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pd-card pd-pix">
          <h5>Pix de hoje</h5><small>Cobranças geradas e pagas</small>
          {[["Gerados", 312, 100], ["Pagos", 241, 77], ["Aguardando", 71, 23]].map(([k, v, w]) => (
            <div key={k as string} className="pd-pixrow"><div className="pd-mrow"><span>{k}</span><b>{v}</b></div><div className="pd-bar"><i style={{ width: w + "%" }} /></div></div>
          ))}
          <h5 className="mt">Saques recentes</h5>
          {[["Hoje, 14:32", "R$ 1.250,00"], ["Ontem, 18:05", "R$ 2.480,00"], ["07/10, 09:47", "R$ 960,00"]].map(([d, v]) => (
            <div key={d} className="pd-mrow pd-saq"><div><span>Saque via Pix</span><small>{d}</small></div><b>{v}</b></div>
          ))}
        </div>
      </div>
    </div>
  );
}
