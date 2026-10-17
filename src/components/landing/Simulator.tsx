import { useMemo, useState } from "react";
import { Zap, ArrowRight } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
 * Simulador "Veja quanto das suas vendas fica com você".
 * Mesma mecânica do simulador da Átomo Pay: faturamento em degraus, taxa
 * efetiva = % + (fixo ÷ ticket médio), economia mensal/anual vs. a
 * plataforma atual. TAXAS DA SHADOW: edite SHADOW abaixo.
 * ──────────────────────────────────────────────────────────────────────── */

type Rate = { taxa: number; fixo: number };
type Metodo = "pix" | "credito";
type Plataforma = { id: string; nome: string; cor: string; pix: Rate; credito: Rate };

// Taxas públicas de cada plataforma (mesmos valores usados pela Átomo Pay).
const PLATAFORMAS: Plataforma[] = [
  { id: "monetizze", nome: "Monetizze", cor: "#2f6bff", credito: { taxa: 7.9, fixo: 1.5 }, pix: { taxa: 7.9, fixo: 1.5 } },
  { id: "kiwify", nome: "Kiwify", cor: "#17c964", credito: { taxa: 8.99, fixo: 2.49 }, pix: { taxa: 8.99, fixo: 2.49 } },
  { id: "braip", nome: "Braip", cor: "#7b5cff", credito: { taxa: 9.9, fixo: 1.0 }, pix: { taxa: 9.9, fixo: 1.0 } },
  { id: "perfectpay", nome: "PerfectPay", cor: "#11b5a4", credito: { taxa: 9.9, fixo: 1.0 }, pix: { taxa: 9.9, fixo: 1.0 } },
  { id: "hotmart", nome: "Hotmart", cor: "#f04e23", credito: { taxa: 9.9, fixo: 1.0 }, pix: { taxa: 9.9, fixo: 1.0 } },
  { id: "ticto", nome: "Ticto", cor: "#e5e7eb", credito: { taxa: 6.99, fixo: 2.49 }, pix: { taxa: 6.99, fixo: 2.49 } },
  { id: "kirvano", nome: "Kirvano", cor: "#94a3b8", credito: { taxa: 7.49, fixo: 2.0 }, pix: { taxa: 7.49, fixo: 2.0 } },
];

// Taxas padrão da ShadowPay (defaults do cadastro de seller).
export const SHADOW: Record<Metodo, Rate> = {
  pix: { taxa: 0.99, fixo: 0 },
  credito: { taxa: 3.99, fixo: 0.5 },
};

const TICKET_MEDIO = 297;
const METODO_LABEL: Record<Metodo, string> = { pix: "Pix", credito: "cartão de crédito" };

const STOPS: number[] = (() => {
  const s: number[] = [];
  for (let v = 10000; v < 50000; v += 1000) s.push(v);
  for (let v = 50000; v < 200000; v += 5000) s.push(v);
  for (let v = 200000; v <= 1000000; v += 10000) s.push(v);
  return s;
})();

const brl = (v: number, casas = 0) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: casas, maximumFractionDigits: casas });
const pct = (t: number) => t.toFixed(2).replace(".", ",") + "%";
const taxaEfetiva = (r: Rate) => Math.min(100, r.taxa + (TICKET_MEDIO > 0 ? (r.fixo / TICKET_MEDIO) * 100 : 0));
const descreve = (r: Rate) => (r.fixo ? `${pct(r.taxa)} + ${brl(r.fixo, 2)} por venda` : `${pct(r.taxa)} por venda`);

function Mark({ p }: { p: Plataforma }) {
  return (
    <span className="spl-sim-mark" style={{ background: p.cor + "22", color: p.cor, borderColor: p.cor + "55" }}>
      {p.nome.charAt(0)}
    </span>
  );
}

export default function Simulator({ ctaHref }: { ctaHref: string }) {
  const [idx, setIdx] = useState(() => STOPS.indexOf(50000));
  const [metodo, setMetodo] = useState<Metodo>("pix");
  const [platId, setPlatId] = useState("perfectpay");

  const r = useMemo(() => {
    const fat = STOPS[idx] ?? 50000;
    const plat = PLATAFORMAS.find((p) => p.id === platId) ?? PLATAFORMAS[0]!;
    const outra = plat[metodo];
    const shadow = SHADOW[metodo];
    const liqOutra = Math.round(fat * (1 - taxaEfetiva(outra) / 100));
    const liqShadow = Math.round(fat * (1 - taxaEfetiva(shadow) / 100));
    const feeOutra = fat - liqOutra;
    const feeShadow = fat - liqShadow;
    const maior = Math.max(feeOutra, feeShadow, 1);
    return {
      fat, plat, outra, shadow, liqOutra, liqShadow, feeOutra, feeShadow,
      economia: liqShadow - liqOutra,
      barOutra: Math.max(2, (feeOutra / maior) * 100),
      barShadow: Math.max(2, (feeShadow / maior) * 100),
    };
  }, [idx, metodo, platId]);

  const progress = (idx / (STOPS.length - 1)) * 100;
  const temEconomia = r.economia > 0;

  return (
    <div className="spl-sim">
      {/* ── coluna de controles ── */}
      <div className="spl-sim-left">
        <h3 className="spl-sim-title">Veja quanto das suas vendas fica com você</h3>
        <p className="spl-sim-lead">
          Informe seu faturamento e a plataforma que usa hoje. O simulador mostra quanto você recebe e quanto paga
          em taxas, lado a lado com a ShadowPay.
        </p>

        <div className="spl-sim-field">
          <div className="spl-sim-row">
            <span className="spl-sim-label">Faturamento mensal</span>
            <span className="spl-sim-amount">{brl(r.fat)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={STOPS.length - 1}
            step={1}
            value={idx}
            onChange={(e) => setIdx(Number(e.target.value))}
            aria-label="Faturamento mensal"
            aria-valuetext={brl(r.fat)}
            className="spl-range"
            style={{ ["--p" as string]: progress + "%" }}
          />
          <div className="spl-sim-row spl-sim-scale">
            <span>R$ 10 mil</span>
            <span>R$ 1 milhão</span>
          </div>
        </div>

        <div className="spl-sim-field">
          <span className="spl-sim-label">Forma de pagamento</span>
          <div className="spl-seg" role="tablist">
            {(["pix", "credito"] as Metodo[]).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={metodo === m}
                className={metodo === m ? "is-on" : ""}
                onClick={() => setMetodo(m)}
              >
                {m === "pix" ? "Pix" : "Cartão de crédito"}
              </button>
            ))}
          </div>
        </div>

        <div className="spl-sim-field">
          <span className="spl-sim-label">Plataforma que você usa hoje</span>
          <div className="spl-chips">
            {PLATAFORMAS.map((p) => (
              <button
                key={p.id}
                className={"spl-chip" + (p.id === platId ? " is-on" : "")}
                onClick={() => setPlatId(p.id)}
                aria-pressed={p.id === platId}
              >
                <Mark p={p} />
                {p.nome}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── coluna de resultado ── */}
      <div className="spl-sim-right">
        <div className={"spl-sim-hero" + (temEconomia ? "" : " is-zero")}>
          <span className="spl-sim-hero-k">Sua economia por mês com a ShadowPay</span>
          <strong className="spl-sim-hero-v">{brl(Math.max(0, r.economia))}</strong>
          <p className="spl-sim-hero-sub">
            {temEconomia ? (
              <>
                <b>{brl(r.economia * 12)} por ano</b> a mais no seu caixa, vendendo no {METODO_LABEL[metodo]} e saindo
                da {r.plat.nome}.
              </>
            ) : (
              <>No {METODO_LABEL[metodo]}, a taxa da {r.plat.nome} já é igual ou menor. Compare no outro método.</>
            )}
          </p>
        </div>

        <div className="spl-cmp">
          <div className="spl-cmp-head">
            <Mark p={r.plat} />
            <span>{r.plat.nome}</span>
          </div>
          <span className="spl-cmp-rate">{descreve(r.outra)}</span>
          <div className="spl-cmp-nums">
            <div>
              <small>Você recebe</small>
              <b>{brl(r.liqOutra)}</b>
            </div>
            <div className="ta-r">
              <small>Taxas pagas</small>
              <span>{brl(r.feeOutra)}</span>
            </div>
          </div>
          <div className="spl-bar"><i style={{ width: r.barOutra + "%" }} className="is-other" /></div>
        </div>

        <div className="spl-cmp is-shadow">
          <div className="spl-cmp-head">
            <span className="spl-sim-mark is-shadow">
              <img src="/logoshadowpay.png" alt="" />
            </span>
            <span>ShadowPay</span>
          </div>
          <span className="spl-cmp-rate">{descreve(r.shadow)}</span>
          <div className="spl-cmp-nums">
            <div>
              <small>Você recebe</small>
              <b>{brl(r.liqShadow)}</b>
            </div>
            <div className="ta-r">
              <small>Taxas pagas</small>
              <span>{brl(r.feeShadow)}</span>
            </div>
          </div>
          <div className="spl-bar"><i style={{ width: r.barShadow + "%" }} /></div>
          {temEconomia && (
            <span className="spl-cmp-legend">
              <Zap size={12} /> {brl(r.feeOutra - r.feeShadow)} em taxas que você deixa de pagar
            </span>
          )}
        </div>

        <div className="spl-prazos">
          <span className="spl-sim-label">Prazos de recebimento na ShadowPay</span>
          <div className="spl-prazos-grid">
            <div><small>Pix</small><b>Na hora</b><em>D+0</em></div>
            <div><small>Saque</small><b>Via Pix</b><em>24/7</em></div>
            <div><small>Confirmação</small><b>Automática</b><em>em segundos</em></div>
          </div>
        </div>

        <a href={ctaHref} className="spl-btn spl-btn-primary spl-btn-block">
          Abrir minha conta <ArrowRight size={16} />
        </a>
        <p className="spl-sim-foot">
          Simulação com ticket médio de {brl(TICKET_MEDIO)} para diluir a taxa fixa por venda. Valores estimados, com
          base nas taxas públicas de cada plataforma.
        </p>
      </div>
    </div>
  );
}
