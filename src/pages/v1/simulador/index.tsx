"use client";

/**
 * /v1/simulador — gerador de vendas da conta demo (simulação).
 *
 * Só funciona dentro da conta demo (o admin libera por seller). Gera Pix e
 * vendas aprovadas pelo dia todo seguindo o cenário (teste / pré-escala /
 * escala) e a meta diária; nada disso é dinheiro: não cobra ninguém, não
 * entra saldo de verdade e não saca. As notificações vão pros aparelhos da
 * conta principal e o título SEMPRE começa com "Simulação · " (fixo).
 *
 * API: /api/user/demo/simulation (GET/POST) + /start /stop /reset /test-push.
 */
import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import axios from "axios";
import {
  BellRing,
  FlaskConical,
  Package,
  Play,
  RotateCcw,
  Send,
  Square,
  Target,
  TrendingUp,
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import { StatusBadge } from "@/components/PanelBits";
import { Button, Card, FieldLabel, Hint, IconBox, Switch, TextInput, inputCls } from "@/components/account/ui";
import { useAuth } from "@/contexts/AuthContext";
import { apiErrorMessage } from "@/lib/axiosErrors";
import { enterDemo } from "@/lib/demo";

const API = "https://shadowpay-backend.onrender.com";
/** Fixo no começo de todo título de notificação da simulação (o backend também põe). */
const SIM_PREFIX = "Simulação · ";
const TITLE_MAX = 80 - SIM_PREFIX.length;

type Scenario = "teste" | "pre" | "escala";
type Item = { name: string; price: number };
type Offer = { product: Item; bump?: Item | null; upsell?: Item | null; downsell?: Item | null };
type Templates = {
  notifyPending: boolean;
  notifyPaid: boolean;
  pendingTitle: string;
  pendingBody: string;
  paidTitle: string;
  paidBody: string;
};
type Today = { generated: number; paid: number; pending: number; revenue: number; approval: number };
type Sim = {
  running: boolean;
  scenario: Scenario;
  dailyTarget: number;
  offer: Offer;
  templates: Templates;
  startedAt: string | null;
  today: Today | null;
  scenarios: Record<Scenario, { label: string; approvalFrom: number; approvalTo: number }>;
};

const SCENARIO_ORDER: Scenario[] = ["teste", "pre", "escala"];
const SCENARIO_TEXT: Record<Scenario, string> = {
  teste: "Volume baixo, oferta nova sendo validada. Aprovação mais baixa e poucos upsells.",
  pre: "A oferta já validou e o volume sobe ao longo do dia. Mais order bump e upsell.",
  escala: "Muito volume o dia todo. A aprovação sobe com o volume, até perto do teto.",
};

const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const money = (v: number) => (Number(v) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** "1.297,90" / "1297.9" → 1297.9 */
function parseMoney(s: string): number {
  const t = String(s || "").trim();
  if (!t) return NaN;
  const n = t.includes(",") ? Number(t.replace(/\./g, "").replace(",", ".")) : Number(t);
  return Math.round(n * 100) / 100;
}
const pct = (v: number) => `${(Number(v) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

type ItemForm = { on: boolean; name: string; price: string };
type OfferForm = { product: ItemForm; bump: ItemForm; upsell: ItemForm; downsell: ItemForm };
const OFFER_KEYS: { key: keyof OfferForm; label: string; hint: string }[] = [
  { key: "product", label: "Produto (front)", hint: "Ticket principal do checkout." },
  { key: "bump", label: "Order bump", hint: "Somado ao front em parte dos pedidos." },
  { key: "upsell", label: "Upsell", hint: "Oferecido depois que o front é pago." },
  { key: "downsell", label: "Downsell", hint: "Quando o cliente recusa o upsell." },
];

function toForm(o: Offer): OfferForm {
  const f = (it: Item | null | undefined, on = !!it): ItemForm => ({
    on,
    name: it?.name ?? "",
    price: it ? money(it.price) : "",
  });
  return { product: f(o.product, true), bump: f(o.bump), upsell: f(o.upsell), downsell: f(o.downsell) };
}

function fromForm(f: OfferForm): { offer: any; error?: string } {
  const out: any = {};
  for (const { key, label } of OFFER_KEYS) {
    const it = f[key];
    if (key !== "product" && !it.on) {
      out[key] = null;
      continue;
    }
    const price = parseMoney(it.price);
    if (!(price > 0)) return { offer: null, error: `Coloque o preço do ${label.toLowerCase()}.` };
    out[key] = { name: it.name.trim() || label, price };
  }
  return { offer: out };
}

/** Prévia do texto com os valores de exemplo. */
function preview(tpl: string, price: number, product: string) {
  const vars: Record<string, string> = {
    cliente: "Mariana Souza",
    valor: brl(price),
    liquido: brl(price * 0.95),
    produto: product || "Produto",
    loja: "Sua loja",
  };
  return tpl.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
}

function SimuladorContent() {
  const { token, user } = useAuth();
  const isDemo = !!user?.isDemo;
  const canDemo = !isDemo && (!!user?.demoAllowed || !!user?.isAdministrator);

  const [sim, setSim] = useState<Sim | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  // formulário
  const [scenario, setScenario] = useState<Scenario>("teste");
  const [target, setTarget] = useState("5.000,00");
  const [offer, setOffer] = useState<OfferForm | null>(null);
  const [tpl, setTpl] = useState<Templates | null>(null);
  const [dirty, setDirty] = useState(false);
  const [products, setProducts] = useState<{ id: string; name: string; price: number }[]>([]);

  const auth = useCallback(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const fill = (s: Sim) => {
    setScenario(s.scenario);
    setTarget(money(s.dailyTarget));
    setOffer(toForm(s.offer));
    setTpl(s.templates);
    setDirty(false);
  };

  const load = useCallback(
    async (withForm: boolean) => {
      if (!token) return;
      try {
        const r = await axios.get(`${API}/api/user/demo/simulation`, auth());
        const s: Sim = r.data?.data;
        setSim(s);
        if (withForm) fill(s);
      } catch (e) {
        setMsg({ tone: "error", text: apiErrorMessage(e, "Não consegui carregar o simulador.") });
      } finally {
        setLoading(false);
      }
    },
    [token, auth],
  );

  useEffect(() => {
    if (!token || !isDemo) {
      setLoading(false);
      return;
    }
    load(true);
    axios
      .get(`${API}/api/products`, auth())
      .then((r) => {
        const list: any[] = r.data?.data?.products || r.data?.products || [];
        setProducts(
          list
            .map((p) => ({ id: String(p.id), name: String(p.name || ""), price: Number(p.price) || 0 }))
            .filter((p) => p.name && p.price > 0),
        );
      })
      .catch(() => {});
  }, [token, isDemo, load, auth]);

  // Números de hoje atualizam sozinhos enquanto o gerador roda.
  useEffect(() => {
    if (!sim?.running) return;
    const id = setInterval(() => load(false), 15000);
    return () => clearInterval(id);
  }, [sim?.running, load]);

  const payload = () => {
    if (!offer || !tpl) return null;
    const t = parseMoney(target);
    if (!(t >= 50)) {
      setMsg({ tone: "error", text: "Faturamento diário mínimo: R$ 50,00." });
      return null;
    }
    const o = fromForm(offer);
    if (o.error) {
      setMsg({ tone: "error", text: o.error });
      return null;
    }
    return { scenario, dailyTarget: t, offer: o.offer, templates: tpl };
  };

  const save = async (quiet = false) => {
    const body = payload();
    if (!body) return false;
    try {
      const r = await axios.post(`${API}/api/user/demo/simulation`, body, auth());
      const s: Sim = r.data?.data;
      setSim((prev) => ({ ...s, today: prev?.today ?? s.today }));
      fill(s);
      if (!quiet) setMsg({ tone: "ok", text: "Configuração salva." });
      return true;
    } catch (e) {
      setMsg({ tone: "error", text: apiErrorMessage(e, "Não consegui salvar.") });
      return false;
    }
  };

  const run = async (what: "save" | "start" | "stop" | "reset") => {
    setBusy(what);
    setMsg(null);
    try {
      if (what === "save") {
        await save();
      } else if (what === "start") {
        if (!(await save(true))) return;
        const r = await axios.post(`${API}/api/user/demo/simulation/start`, {}, auth());
        setSim(r.data?.data);
        setMsg({ tone: "ok", text: "Simulação rodando. As vendas aparecem no dashboard e em Transações." });
      } else if (what === "stop") {
        const r = await axios.post(`${API}/api/user/demo/simulation/stop`, {}, auth());
        setSim(r.data?.data);
        setMsg({ tone: "ok", text: "Simulação parada." });
      } else {
        if (!window.confirm("Apagar todas as vendas simuladas desta conta demo? O gerador também para.")) return;
        const r = await axios.post(`${API}/api/user/demo/simulation/reset`, {}, auth());
        await load(false);
        setMsg({ tone: "ok", text: `${r.data?.data?.deleted ?? 0} vendas simuladas apagadas.` });
      }
    } catch (e) {
      setMsg({ tone: "error", text: apiErrorMessage(e, "Não deu certo. Tente de novo.") });
    } finally {
      setBusy(null);
    }
  };

  const testPush = async (kind: "pending" | "paid") => {
    setBusy(`push-${kind}`);
    setMsg(null);
    try {
      if (dirty && !(await save(true))) return;
      const r = await axios.post(`${API}/api/user/demo/simulation/test-push`, { kind }, auth());
      const rep = r.data?.data?.report;
      const sent = Number(rep?.sent ?? 0);
      setMsg(
        sent > 0
          ? { tone: "ok", text: `Teste enviado pra ${sent} aparelho${sent > 1 ? "s" : ""} da sua conta principal.` }
          : {
              tone: "error",
              text: "Nenhum aparelho da conta principal com notificação ligada. Ative em Minha conta → Notificações (na conta principal).",
            },
      );
    } catch (e) {
      setMsg({ tone: "error", text: apiErrorMessage(e, "Não consegui enviar o teste.") });
    } finally {
      setBusy(null);
    }
  };

  const setItem = (key: keyof OfferForm, patch: Partial<ItemForm>) => {
    setOffer((o) => (o ? { ...o, [key]: { ...o[key], ...patch } } : o));
    setDirty(true);
  };
  const setT = (patch: Partial<Templates>) => {
    setTpl((t) => (t ? { ...t, ...patch } : t));
    setDirty(true);
  };

  // ------------------------------------------------------------------ fora da demo
  if (!isDemo) {
    return (
      <LightShell>
        <Head>
          <title>ShadowPay — Simulador</title>
        </Head>
        <Card className="mx-auto mt-6 max-w-xl p-6 text-center">
          <span className="mx-auto mb-3 flex w-fit">
            <IconBox>
              <FlaskConical className="h-5 w-5" />
            </IconBox>
          </span>
          <h1 className="text-[18px] font-semibold text-slate-900">O simulador fica na conta demo</h1>
          <p className="mt-1.5 text-[14px] text-slate-500">
            {canDemo
              ? "Abra a conta demo pra gerar vendas de simulação. Sua conta principal não muda em nada."
              : "A conta demo não está liberada pra você. Fale com o administrador."}
          </p>
          {canDemo && (
            <Button
              className="mt-5"
              loading={busy === "enter"}
              icon={<FlaskConical className="h-4 w-4" />}
              onClick={async () => {
                if (!token) return;
                setBusy("enter");
                const r = await enterDemo(token);
                if (!r.ok) {
                  setBusy(null);
                  setMsg({ tone: "error", text: r.message || "Não consegui abrir a conta demo." });
                }
              }}
            >
              Abrir conta demo
            </Button>
          )}
          {msg && <Hint tone={msg.tone}>{msg.text}</Hint>}
        </Card>
      </LightShell>
    );
  }

  const today = sim?.today;
  const running = !!sim?.running;
  const frontPrice = offer ? parseMoney(offer.product.price) || 0 : 0;
  const frontName = offer?.product.name || "Produto";

  return (
    <LightShell>
      <Head>
        <title>ShadowPay — Simulador</title>
      </Head>

      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold text-slate-900 sm:text-[26px]">Simulador</h1>
          <p className="mt-1 max-w-2xl text-[14px] text-slate-500">
            Gera vendas de simulação nesta conta demo pelo dia todo, no ritmo do cenário e da meta que você escolher.
            Nada aqui é dinheiro: não cobra ninguém, não entra saldo de verdade e não dá pra sacar.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {running ? (
            <Button variant="danger" loading={busy === "stop"} icon={<Square className="h-4 w-4" />} onClick={() => run("stop")}>
              Parar
            </Button>
          ) : (
            <Button loading={busy === "start"} disabled={loading || !offer} icon={<Play className="h-4 w-4" />} onClick={() => run("start")}>
              Iniciar simulação
            </Button>
          )}
        </div>
      </header>

      {msg && (
        <div
          role="status"
          className={`mb-5 rounded-xl border px-4 py-3 text-[13.5px] ${
            msg.tone === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* HOJE */}
      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="sp-kpi rounded-2xl p-4 lg:col-span-1">
          <p className="sp-kpi-label text-[12.5px]">Situação</p>
          <div className="mt-2">
            {running ? <StatusBadge tone="green">Rodando</StatusBadge> : <StatusBadge tone="gray">Parada</StatusBadge>}
          </div>
          {sim?.startedAt && running && (
            <p className="sp-kpi-label mt-2 text-[11.5px]">
              desde {new Date(sim.startedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
        {[
          { label: "Pix gerados hoje", value: today ? String(today.generated) : "—" },
          { label: "Pagas / pendentes", value: today ? `${today.paid} / ${today.pending}` : "—" },
          { label: "Aprovação", value: today ? pct(today.approval) : "—" },
          { label: "Faturamento hoje", value: today ? brl(today.revenue) : "—" },
        ].map((k) => (
          <div key={k.label} className="sp-kpi rounded-2xl p-4">
            <p className="sp-kpi-label text-[12.5px]">{k.label}</p>
            <p className="sp-kpi-value mt-1.5 text-[20px] font-semibold tabular-nums">{k.value}</p>
          </div>
        ))}
      </section>

      {loading || !offer || !tpl || !sim ? (
        <Card className="p-6 text-[14px] text-slate-500">Carregando…</Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {/* CENÁRIO */}
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <IconBox>
                <TrendingUp className="h-5 w-5" />
              </IconBox>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Cenário</h2>
                <p className="text-[12.5px] text-slate-500">A aprovação sobe conforme o volume do dia.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {SCENARIO_ORDER.map((k) => {
                const s = sim.scenarios[k];
                const on = scenario === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setScenario(k);
                      setDirty(true);
                    }}
                    className={`rounded-xl border p-3.5 text-left transition-colors ${
                      on ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-semibold text-slate-900">{s.label}</span>
                      <span className="text-[12px] font-semibold tabular-nums text-violet-600">
                        {pct(s.approvalFrom)} → {pct(s.approvalTo)}
                      </span>
                    </div>
                    <p className="mt-1 text-[12.5px] text-slate-500">{SCENARIO_TEXT[k]}</p>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* META */}
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <IconBox>
                <Target className="h-5 w-5" />
              </IconBox>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Faturamento diário</h2>
                <p className="text-[12.5px] text-slate-500">Quanto o dia deve faturar (vendas pagas).</p>
              </div>
            </div>
            <FieldLabel htmlFor="sim-target">Meta do dia</FieldLabel>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-slate-400">R$</span>
              <TextInput
                id="sim-target"
                inputMode="decimal"
                className="pl-10 tabular-nums"
                value={target}
                onChange={(e) => {
                  setTarget(e.target.value.replace(/[^\d.,]/g, ""));
                  setDirty(true);
                }}
                onBlur={() => {
                  const v = parseMoney(target);
                  if (v > 0) setTarget(money(v));
                }}
              />
            </div>
            <Hint>
              As vendas se espalham pelo dia (mais à tarde e à noite). O dia pode fechar até R$ 3.000 acima ou R$ 2.000
              abaixo da meta. Começando no meio do dia, o painel já mostra o movimento até agora.
            </Hint>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="outline" loading={busy === "save"} disabled={!dirty} onClick={() => run("save")}>
                Salvar configuração
              </Button>
              <Button variant="ghost" loading={busy === "reset"} icon={<RotateCcw className="h-4 w-4" />} onClick={() => run("reset")}>
                Limpar vendas simuladas
              </Button>
            </div>
          </Card>

          {/* OFERTA */}
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <IconBox>
                <Package className="h-5 w-5" />
              </IconBox>
              <div className="min-w-0 flex-1">
                <h2 className="text-[15px] font-semibold text-slate-900">Oferta</h2>
                <p className="text-[12.5px] text-slate-500">Os tickets que aparecem nas vendas.</p>
              </div>
              {products.length > 0 && (
                <select
                  aria-label="Usar um produto desta conta"
                  className={`${inputCls} h-9 w-auto max-w-[180px] text-[12.5px]`}
                  value=""
                  onChange={(e) => {
                    const p = products.find((x) => x.id === e.target.value);
                    if (p) setItem("product", { name: p.name, price: money(p.price), on: true });
                  }}
                >
                  <option value="">Usar produto…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-3.5">
              {OFFER_KEYS.map(({ key, label, hint }) => {
                const it = offer[key];
                const optional = key !== "product";
                return (
                  <div key={key} className="rounded-xl border border-slate-200 p-3.5">
                    <div className="mb-2.5 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[13.5px] font-semibold text-slate-900">{label}</p>
                        <p className="text-[12px] text-slate-500">{hint}</p>
                      </div>
                      {optional && <Switch checked={it.on} onChange={(v) => setItem(key, { on: v })} label={`Ligar ${label}`} />}
                    </div>
                    {(!optional || it.on) && (
                      <div className="grid grid-cols-[1fr_120px] gap-2">
                        <TextInput
                          aria-label={`Nome do ${label}`}
                          placeholder={label}
                          maxLength={120}
                          value={it.name}
                          onChange={(e) => setItem(key, { name: e.target.value })}
                        />
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400">R$</span>
                          <TextInput
                            aria-label={`Preço do ${label}`}
                            inputMode="decimal"
                            className="pl-9 tabular-nums"
                            placeholder="0,00"
                            value={it.price}
                            onChange={(e) => setItem(key, { price: e.target.value.replace(/[^\d.,]/g, "") })}
                            onBlur={() => {
                              const v = parseMoney(it.price);
                              if (v > 0) setItem(key, { price: money(v) });
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* NOTIFICAÇÕES */}
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <IconBox>
                <BellRing className="h-5 w-5" />
              </IconBox>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Notificações</h2>
                <p className="text-[12.5px] text-slate-500">
                  Chegam nos aparelhos da sua conta principal. O título sempre começa com “{SIM_PREFIX.trim()}”.
                </p>
              </div>
            </div>

            {(
              [
                { kind: "pending", label: "Pix gerado (pendente)", on: "notifyPending", title: "pendingTitle", body: "pendingBody" },
                { kind: "paid", label: "Venda aprovada", on: "notifyPaid", title: "paidTitle", body: "paidBody" },
              ] as const
            ).map((n) => (
              <div key={n.kind} className="mb-4 rounded-xl border border-slate-200 p-3.5 last:mb-0">
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <p className="text-[13.5px] font-semibold text-slate-900">{n.label}</p>
                  <Switch checked={tpl[n.on]} onChange={(v) => setT({ [n.on]: v } as Partial<Templates>)} label={`Notificar ${n.label}`} />
                </div>
                <FieldLabel htmlFor={`sim-${n.kind}-title`}>Título</FieldLabel>
                <div className="flex items-stretch overflow-hidden rounded-xl border border-slate-200 focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-100">
                  <span
                    className="flex shrink-0 select-none items-center bg-slate-50 px-3 text-[13.5px] font-medium text-slate-500"
                    title="Fixo: identifica a notificação como simulação"
                  >
                    {SIM_PREFIX.trim()}
                  </span>
                  <input
                    id={`sim-${n.kind}-title`}
                    maxLength={TITLE_MAX}
                    className="h-11 min-w-0 flex-1 bg-white px-3 text-[14px] text-slate-900 outline-none"
                    value={tpl[n.title]}
                    onChange={(e) => setT({ [n.title]: e.target.value } as Partial<Templates>)}
                  />
                </div>
                <div className="mt-3">
                  <FieldLabel htmlFor={`sim-${n.kind}-body`}>Texto</FieldLabel>
                  <textarea
                    id={`sim-${n.kind}-body`}
                    rows={2}
                    maxLength={240}
                    className={`${inputCls} h-auto resize-none py-2.5`}
                    value={tpl[n.body]}
                    onChange={(e) => setT({ [n.body]: e.target.value } as Partial<Templates>)}
                  />
                </div>
                <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2.5">
                  <p className="text-[12.5px] font-semibold text-slate-800">
                    {SIM_PREFIX}
                    {preview(tpl[n.title], frontPrice, frontName)}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-slate-500">{preview(tpl[n.body], frontPrice, frontName)}</p>
                </div>
                <div className="mt-2.5">
                  <Button
                    variant="outline"
                    className="h-9 px-3.5 text-[12.5px]"
                    loading={busy === `push-${n.kind}`}
                    icon={<Send className="h-3.5 w-3.5" />}
                    onClick={() => testPush(n.kind)}
                  >
                    Enviar teste
                  </Button>
                </div>
              </div>
            ))}
            <Hint>
              Variáveis: {"{cliente}"} {"{valor}"} {"{liquido}"} {"{produto}"} {"{loja}"}. Pra receber, a notificação
              precisa estar ligada na conta principal (Minha conta → Notificações).
            </Hint>
          </Card>
        </div>
      )}

      <p className="mb-10 mt-6 text-[12.5px] text-slate-400">
        As vendas simuladas aparecem no <Link href="/v1/dashboard" className="underline">Dashboard</Link> e em{" "}
        <Link href="/v1/products/sales" className="underline">Transações</Link> desta conta demo, nunca na conta principal.
      </p>
    </LightShell>
  );
}

export default function SimuladorPage() {
  return (
    <ProtectedRoute>
      <SimuladorContent />
    </ProtectedRoute>
  );
}
