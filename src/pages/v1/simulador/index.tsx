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
  Plus,
  RotateCcw,
  Trash2,
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
import { enterDemo, saveDemoLabel } from "@/lib/demo";

const API = "https://shadowpay-backend.onrender.com";
/**
 * O título da notificação SEMPRE começa com um rótulo que deixa claro que a
 * venda não é real ("Simulação · ..."). Dá pra escolher qual, mas só da lista
 * que o servidor manda (o servidor também confere).
 */
const DEFAULT_LABELS = ["Simulação", "Demonstração", "Demo", "Teste", "Venda simulada"];
const TITLE_MAX = 80 - "Venda simulada · ".length;

type Scenario = "teste" | "pre" | "escala";
type Item = { name: string; price: number };
type Offer = { product: Item; bump?: Item | null; upsells: Item[]; downsell?: Item | null };
type NotifyMode = "ambas" | "aprovadas";
type Templates = {
  label: string;
  notifyMode: NotifyMode;
  pendingTitle: string;
  pendingBody: string;
  paidTitle: string;
  paidBody: string;
  customTitle: string;
  customBody: string;
};
/** Mesmos padrões do servidor (demo-engine.ts › DEFAULT_SIM_TEMPLATES). */
const DEFAULT_TEMPLATES: Templates = {
  label: "Simulação",
  notifyMode: "ambas",
  pendingTitle: "🟡 Venda gerada",
  pendingBody: "{cliente} gerou um PIX de {valor} · {produto}",
  paidTitle: "🟢 Venda aprovada!",
  paidBody: "Você recebeu {valor} de {cliente} · {produto}",
  customTitle: "",
  customBody: "",
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
  labels?: string[];
  maxUpsells?: number;
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
type FixedKey = "product" | "bump" | "downsell";
type OfferForm = { product: ItemForm; bump: ItemForm; downsell: ItemForm; upsells: ItemForm[] };
const OFFER_KEYS: { key: FixedKey; label: string; hint: string }[] = [
  { key: "product", label: "Produto (front)", hint: "Ticket principal do checkout." },
  { key: "bump", label: "Order bump", hint: "Somado ao front em parte dos pedidos." },
  { key: "downsell", label: "Downsell", hint: "Pra quem recusa o 1º upsell. Encerra o funil." },
];

function toForm(o: Offer): OfferForm {
  const f = (it: Item | null | undefined, on = !!it): ItemForm => ({
    on,
    name: it?.name ?? "",
    price: it ? money(it.price) : "",
  });
  return {
    product: f(o.product, true),
    bump: f(o.bump),
    downsell: f(o.downsell),
    // oferta salva antes do funil tinha um `upsell` só
    upsells: (o.upsells ?? ((o as any).upsell ? [(o as any).upsell] : [])).map((u: Item) => f(u, true)),
  };
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
  out.upsells = [];
  for (const [i, u] of f.upsells.entries()) {
    const price = parseMoney(u.price);
    if (!(price > 0)) return { offer: null, error: `Coloque o preço do upsell ${i + 1}.` };
    out.upsells.push({ name: u.name.trim() || `Upsell ${i + 1}`, price });
  }
  return { offer: out };
}

/** Um ticket da oferta (nome + preço), com liga/desliga quando é opcional. */
function OfferItemBox({
  label,
  hint,
  item,
  optional,
  onChange,
}: {
  label: string;
  hint: string;
  item: ItemForm;
  optional?: boolean;
  onChange: (patch: Partial<ItemForm>) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-3.5">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-semibold text-slate-900">{label}</p>
          <p className="text-[12px] text-slate-500">{hint}</p>
        </div>
        {optional && <Switch checked={item.on} onChange={(v) => onChange({ on: v })} label={`Ligar ${label}`} />}
      </div>
      {(!optional || item.on) && (
        <div className="grid grid-cols-[1fr_120px] gap-2">
          <TextInput
            aria-label={`Nome do ${label}`}
            placeholder={label}
            maxLength={120}
            value={item.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400">R$</span>
            <TextInput
              aria-label={`Preço do ${label}`}
              inputMode="decimal"
              className="pl-9 tabular-nums"
              placeholder="0,00"
              value={item.price}
              onChange={(e) => onChange({ price: e.target.value.replace(/[^\d.,]/g, "") })}
              onBlur={() => {
                const v = parseMoney(item.price);
                if (v > 0) onChange({ price: money(v) });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Prévia com os MESMOS valores de exemplo do "Enviar teste" (servidor:
 * DemoService.testPush) — o que aparece aqui é o que chega no celular.
 */
function preview(tplIn: string, price: number, product: string, loja: string) {
  const tpl = String(tplIn ?? "");
  const vars: Record<string, string> = {
    cliente: "Mariana Souza",
    valor: brl(price),
    liquido: brl(Math.round(price * 0.95 * 100) / 100),
    produto: product || "Produto",
    loja: loja || "Sua loja",
  };
  // mesma regra do servidor (push-templates.ts › renderTemplate)
  return tpl
    .replace(/\{(\w+)\}/g, (m, k) => vars[String(k).toLowerCase()] ?? m)
    .replace(/[ \t]{2,}/g, " ")
    .replace(/·\s*·/g, "·")
    .replace(/\s*·\s*(?=$|\n)/g, "")
    .replace(/^\s*·\s*/g, "")
    .trim();
}

/** Rótulo colado no começo do texto sai (o servidor faz o mesmo ao salvar) — sem duplicar. */
const PASTED_LABEL_RE = new RegExp(
  `^\\s*(?:${[...DEFAULT_LABELS, "simula[cç][aã]o", "demonstra[cç][aã]o"].map((l) => l.replace(/ /g, "\\s+")).join("|")})(?:\\s*[·:\\-–|]\\s*|\\s*$)`,
  "iu",
);

/** Título como sai no celular: rótulo + título (vazio = só o rótulo). */
function previewTitle(label: string, title: string, price: number, product: string, loja: string) {
  // igual ao servidor (demo-engine.ts › stripLabel): tira o rótulo colado, mesmo repetido
  let raw = String(title ?? "");
  for (let i = 0; i < 5; i++) {
    const next = raw.replace(PASTED_LABEL_RE, "");
    if (next === raw) break;
    raw = next;
  }
  const t = preview(raw.trim(), price, product, loja).trim();
  return (t ? `${label} · ${t}` : label).slice(0, 80);
}

/** Texto que o celular mostra quando a mensagem fica vazia (public/sw.js). */
const EMPTY_BODY = "Você tem uma nova notificação.";

/** Prévia no formato de notificação do celular (marca ShadowPay). */
function NotificationPreview({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_6px_18px_-12px_rgba(16,12,24,0.35)]">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="h-5 w-5 shrink-0 rounded-md bg-[#14101f]"
          style={{ backgroundImage: "url(/logoshadowpay.png)", backgroundSize: "75%", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
        />
        <span className="text-[11.5px] font-semibold uppercase tracking-wide text-slate-500">ShadowPay</span>
        <span className="ml-auto text-[11px] text-slate-400">agora</span>
      </div>
      <p className="mt-1.5 break-words text-[13.5px] font-semibold text-slate-900">{title}</p>
      <p className="mt-0.5 whitespace-pre-line break-words text-[13px] text-slate-600">{body || EMPTY_BODY}</p>
    </div>
  );
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
    // campos que faltarem (resposta de servidor antigo) ficam com o padrão
    const t = { ...DEFAULT_TEMPLATES, ...(s.templates || {}) };
    setTpl(t);
    saveDemoLabel(t.label);
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

  const testPush = async (kind: "pending" | "paid" | "custom") => {
    if (kind === "custom" && tpl && !tpl.customTitle.trim() && !tpl.customBody.trim()) {
      setMsg({ tone: "error", text: "Escreva o título ou a mensagem antes de enviar o teste." });
      return;
    }
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

  const setItem = (key: FixedKey, patch: Partial<ItemForm>) => {
    setOffer((o) => (o ? { ...o, [key]: { ...o[key], ...patch } } : o));
    setDirty(true);
  };
  const setUpsell = (i: number, patch: Partial<ItemForm>) => {
    setOffer((o) => (o ? { ...o, upsells: o.upsells.map((u, k) => (k === i ? { ...u, ...patch } : u)) } : o));
    setDirty(true);
  };
  const setUpsells = (fn: (list: ItemForm[]) => ItemForm[]) => {
    setOffer((o) => (o ? { ...o, upsells: fn(o.upsells) } : o));
    setDirty(true);
  };
  const setT = (patch: Partial<Templates>) => {
    setTpl((t) => (t ? { ...t, ...patch } : t));
    if (patch.label) saveDemoLabel(patch.label);
    setDirty(true);
  };
  const maxUpsells = sim?.maxUpsells ?? 5;
  const labels = sim?.labels?.length ? sim.labels : DEFAULT_LABELS;

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
          <h1 className="text-[18px] font-semibold text-slate-900">O simulador fica no painel de amigos</h1>
          <p className="mt-1.5 text-[14px] text-slate-500">
            {canDemo
              ? "Abra o painel de amigos pra gerar vendas de simulação. Sua conta principal não muda em nada."
              : "O painel de amigos não está liberado pra você. Fale com o administrador."}
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
                  setMsg({ tone: "error", text: r.message || "Não consegui abrir o painel de amigos." });
                }
              }}
            >
              Abrir painel de amigos
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
  // mesmo nome que vai pro servidor quando o campo fica vazio (fromForm)
  const frontName = offer?.product.name.trim() || "Produto (front)";
  const lojaName = user?.companyName || "";

  return (
    <LightShell>
      <Head>
        <title>ShadowPay — Simulador</title>
      </Head>

      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold text-slate-900 sm:text-[26px]">Simulador</h1>
          <p className="mt-1 max-w-2xl text-[14px] text-slate-500">
            Gera vendas de simulação neste painel de amigos pelo dia todo, no ritmo do cenário e da meta que você escolher.
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
              {OFFER_KEYS.filter((k) => k.key !== "downsell").map(({ key, label, hint }) => (
                <OfferItemBox
                  key={key}
                  label={label}
                  hint={hint}
                  item={offer[key]}
                  optional={key !== "product"}
                  onChange={(patch) => setItem(key, patch)}
                />
              ))}

              {/* funil de upsells: quem paga um vê o próximo */}
              <div className="rounded-xl border border-slate-200 p-3.5">
                <div className="mb-2.5">
                  <p className="text-[13.5px] font-semibold text-slate-900">Upsells (até {maxUpsells})</p>
                  <p className="text-[12px] text-slate-500">
                    Em sequência: quem paga o upsell 1 vê o 2, e assim por diante. Cada um gera o seu Pix.
                  </p>
                </div>
                <div className="space-y-2">
                  {offer.upsells.map((u, i) => (
                    <div key={i} className="grid grid-cols-[22px_1fr_110px_32px] items-center gap-2">
                      <span className="text-center text-[12px] font-semibold text-slate-400">{i + 1}</span>
                      <TextInput
                        aria-label={`Nome do upsell ${i + 1}`}
                        placeholder={`Upsell ${i + 1}`}
                        maxLength={120}
                        value={u.name}
                        onChange={(e) => setUpsell(i, { name: e.target.value })}
                      />
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400">R$</span>
                        <TextInput
                          aria-label={`Preço do upsell ${i + 1}`}
                          inputMode="decimal"
                          className="pl-9 tabular-nums"
                          placeholder="0,00"
                          value={u.price}
                          onChange={(e) => setUpsell(i, { price: e.target.value.replace(/[^\d.,]/g, "") })}
                          onBlur={() => {
                            const v = parseMoney(u.price);
                            if (v > 0) setUpsell(i, { price: money(v) });
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        aria-label={`Remover upsell ${i + 1}`}
                        onClick={() => setUpsells((list) => list.filter((_, k) => k !== i))}
                        className="flex h-9 w-8 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {offer.upsells.length < maxUpsells && (
                  <Button
                    variant="ghost"
                    className="mt-2 h-9 px-3 text-[12.5px]"
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => setUpsells((list) => [...list, { on: true, name: "", price: "" }])}
                  >
                    Adicionar upsell
                  </Button>
                )}
              </div>

              <OfferItemBox
                label="Downsell"
                hint={OFFER_KEYS.find((k) => k.key === "downsell")!.hint}
                item={offer.downsell}
                optional
                onChange={(patch) => setItem("downsell", patch)}
              />
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
                  Chegam nos aparelhos da sua conta principal. Toda venda notifica.
                </p>
              </div>
            </div>

            <FieldLabel>Quais notificações</FieldLabel>
            <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(
                [
                  { mode: "ambas", title: "Pix gerado + venda aprovada", text: "Avisa quando o Pix é gerado e quando é pago." },
                  { mode: "aprovadas", title: "Só venda aprovada", text: "Avisa só quando o Pix é pago." },
                ] as const
              ).map((m) => {
                const on = tpl.notifyMode === m.mode;
                return (
                  <button
                    key={m.mode}
                    type="button"
                    onClick={() => setT({ notifyMode: m.mode })}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      on ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-[13.5px] font-semibold text-slate-900">{m.title}</span>
                    <span className="mt-0.5 block text-[12px] text-slate-500">{m.text}</span>
                  </button>
                );
              })}
            </div>

            <div className="mb-5">
              <FieldLabel htmlFor="sim-label">Identificação de demonstração</FieldLabel>
              <select
                id="sim-label"
                className={`${inputCls} h-11 text-[14px]`}
                value={tpl.label}
                onChange={(e) => setT({ label: e.target.value })}
              >
                {labels.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              <Hint>
                Vai na frente do título na hora do envio (veja na prévia) e no selo do painel — não entra nos campos que
                você escreve.
              </Hint>
            </div>

            {/* mensagem livre: título e texto do jeito que a pessoa quiser */}
            {(
              [
                {
                  kind: "custom",
                  label: "Mensagem personalizada",
                  hint: "Título e mensagem livres. Use o Enviar teste pra ver no seu celular.",
                  title: "customTitle",
                  body: "customBody",
                },
                {
                  kind: "pending",
                  label: "Automática: quando o Pix é gerado",
                  hint: "Enviada pelo simulador a cada Pix gerado (se escolhido acima).",
                  title: "pendingTitle",
                  body: "pendingBody",
                },
                {
                  kind: "paid",
                  label: "Automática: quando o Pix é pago",
                  hint: "Enviada pelo simulador a cada pagamento.",
                  title: "paidTitle",
                  body: "paidBody",
                },
              ] as const
            ).map((n) => {
              const off = n.kind === "pending" && tpl.notifyMode === "aprovadas";
              return (
                <div key={n.kind} className={`mb-4 rounded-xl border border-slate-200 p-3.5 last:mb-0 ${off ? "opacity-60" : ""}`}>
                  <div className="mb-2.5 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[13.5px] font-semibold text-slate-900">{n.label}</p>
                      <p className="text-[12px] text-slate-500">{n.hint}</p>
                    </div>
                    {off && <span className="shrink-0 text-[11.5px] font-medium text-slate-500">desligada</span>}
                  </div>
                  <FieldLabel htmlFor={`sim-${n.kind}-title`}>Título</FieldLabel>
                  <TextInput
                    id={`sim-${n.kind}-title`}
                    maxLength={TITLE_MAX}
                    placeholder="Escreva o título"
                    value={tpl[n.title]}
                    onChange={(e) => setT({ [n.title]: e.target.value } as Partial<Templates>)}
                  />
                  <div className="mt-3">
                    <FieldLabel htmlFor={`sim-${n.kind}-body`}>Mensagem</FieldLabel>
                    <textarea
                      id={`sim-${n.kind}-body`}
                      rows={2}
                      maxLength={240}
                      placeholder="Escreva a mensagem"
                      className={`${inputCls} h-auto resize-none py-2.5`}
                      value={tpl[n.body]}
                      onChange={(e) => setT({ [n.body]: e.target.value } as Partial<Templates>)}
                    />
                  </div>
                  <div className="mt-3">
                    <p className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-slate-500">Prévia</p>
                    <NotificationPreview
                      title={previewTitle(tpl.label, tpl[n.title], frontPrice, frontName, lojaName)}
                      body={preview(tpl[n.body], frontPrice, frontName, lojaName)}
                    />
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
              );
            })}
            <Hint>
              Variáveis (opcionais): {"{cliente}"} {"{valor}"} {"{liquido}"} {"{produto}"} {"{loja}"}. O teste vai só pros
              aparelhos da sua conta principal com a notificação ligada (Minha conta → Notificações). Tudo fica salvo
              nesta conta.
            </Hint>
          </Card>
        </div>
      )}

      <p className="mb-10 mt-6 text-[12.5px] text-slate-400">
        As vendas simuladas aparecem no <Link href="/v1/dashboard" className="underline">Dashboard</Link> e em{" "}
        <Link href="/v1/products/sales" className="underline">Transações</Link> deste painel de amigos, nunca na conta principal.
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
