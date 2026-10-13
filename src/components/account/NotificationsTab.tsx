"use client";

/**
 * Minha conta → aba "Notificações": instalar o app, ligar o push neste
 * aparelho, escolher quais avisos receber e reescrever o texto de cada um.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Banknote,
  BellOff,
  BellRing,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Loader2,
  Monitor,
  PencilLine,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  Smartphone,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePush } from "@/hooks/usePush";
import { apiErrorMessage, withRetry } from "@/lib/axiosErrors";
import { canPromptInstall, onInstallChange, promptInstall } from "@/lib/install";
import { detectPlatform, isStandalone, type PushPlatform } from "@/lib/push";
import { DeviceRow, deniedHelp } from "@/components/PushEnableCard";
import {
  BODY_MAX,
  PhonePreview,
  TITLE_MAX,
  renderSample,
  type PushEventInfo,
  type PushKind,
  type PushTemplates,
} from "@/components/admin/PushTemplateEditor";
import { Button, C, Card, FieldLabel, IconBox, Pill, Switch, inputCls } from "./ui";

const API = "https://shadowpay-backend.onrender.com";

type Prefs = Record<"pushSalePending" | "pushSaleApproved" | "pushWithdrawalPaid", boolean>;
type Custom = Partial<Record<PushKind, { title?: string; body?: string }>>;
type TemplatesData = { events: PushEventInfo[]; defaults: PushTemplates; custom: Custom };

type Tone = "amber" | "green" | "blue";
const EVENTS: { kind: PushKind; pref: keyof Prefs; label: string; short: string; desc: string; tone: Tone; Icon: typeof Clock }[] = [
  { kind: "sale_pending", pref: "pushSalePending", label: "Venda pendente (PIX gerado)", short: "Venda pendente", desc: "Cliente abriu o checkout e gerou o PIX", tone: "amber", Icon: Clock },
  { kind: "sale_paid", pref: "pushSaleApproved", label: "Venda aprovada", short: "Venda aprovada", desc: "Cliente pagou e o dinheiro caiu na sua conta", tone: "green", Icon: CheckCircle2 },
  { kind: "withdrawal_paid", pref: "pushWithdrawalPaid", label: "Saque pago", short: "Saque pago", desc: "Seu saque foi enviado para a sua chave PIX", tone: "blue", Icon: Banknote },
];

const TONE: Record<Tone, { fg: string; soft: string; border: string; tint: string }> = {
  amber: { fg: "#B45309", soft: "rgba(245,158,11,0.14)", border: "rgba(245,158,11,0.35)", tint: "rgba(245,158,11,0.05)" },
  green: { fg: "#047857", soft: "rgba(16,185,129,0.14)", border: "rgba(16,185,129,0.35)", tint: "rgba(16,185,129,0.05)" },
  blue: { fg: "#1D4ED8", soft: "rgba(37,99,235,0.12)", border: "rgba(37,99,235,0.30)", tint: "rgba(37,99,235,0.04)" },
};

/* ------------------------------------------------------------------ instalar */

const INSTALL_STEPS: Record<"ios" | "android" | "desktop", { label: string; steps: string[] }> = {
  ios: {
    label: "iPhone",
    steps: [
      "Abra a ShadowPay no Safari.",
      "Toque em Compartilhar (o quadrado com a setinha pra cima).",
      "Escolha “Adicionar à Tela de Início” e confirme.",
      "Abra a ShadowPay pelo ícone novo e ative as notificações aqui.",
    ],
  },
  android: {
    label: "Android",
    steps: [
      "Abra a ShadowPay no Chrome.",
      "Toque no menu ⋮ no canto de cima.",
      "Escolha “Instalar app” (ou “Adicionar à tela inicial”).",
      "Abra a ShadowPay pelo ícone novo.",
    ],
  },
  desktop: {
    label: "Computador",
    steps: [
      "Use o Chrome ou o Edge.",
      "Clique no ícone de instalar na barra de endereço (ou menu ⋮ → “Instalar ShadowPay”).",
      "Pronto: a ShadowPay abre como um app, numa janela própria.",
    ],
  },
};

function InstallCard() {
  const [ready, setReady] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const [which, setWhich] = useState<"ios" | "android" | "desktop">("android");

  useEffect(() => {
    const p: PushPlatform = detectPlatform();
    setWhich(p === "ios" ? "ios" : p === "desktop" ? "desktop" : "android");
    setStandalone(isStandalone());
    setCanPrompt(canPromptInstall());
    setReady(true);
    return onInstallChange(() => setCanPrompt(canPromptInstall()));
  }, []);

  if (!ready || standalone) return null; // já está rodando como app instalado

  const install = async () => {
    const ok = await promptInstall();
    if (ok) toast.success("App instalado! Abra pelo ícone na tela inicial.");
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/pwa/icon-192.png" alt="" className="h-11 w-11 shrink-0 rounded-xl shadow-sm" />
          <div>
            <p className="text-[15px] font-bold text-slate-900">Instale o app da ShadowPay</p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-500">
              Abre direto da tela inicial e as notificações chegam com mais confiança.
              {which === "ios" && " No iPhone, só o app instalado recebe notificações."}
            </p>
          </div>
        </div>
        {canPrompt && (
          <Button onClick={install} icon={<Download className="h-4 w-4" />}>
            Instalar app
          </Button>
        )}
      </div>
      <button
        type="button"
        onClick={() => setHowOpen((o) => !o)}
        aria-expanded={howOpen}
        className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
        style={{ color: C.primary }}
      >
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${howOpen ? "" : "-rotate-90"}`} />
        Como instalar manualmente
      </button>
      {howOpen && (
        <div className="mt-3 rounded-xl border border-[#E6E8EB] bg-slate-50/60 p-4">
          <div className="mb-3 inline-flex rounded-lg border border-[#E6E8EB] bg-white p-0.5">
            {(Object.keys(INSTALL_STEPS) as (keyof typeof INSTALL_STEPS)[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setWhich(k)}
                className="rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors"
                style={which === k ? { background: C.primarySoft, color: C.primary } : { color: "#64748B" }}
              >
                {INSTALL_STEPS[k].label}
              </button>
            ))}
          </div>
          <ol className="space-y-2">
            {INSTALL_STEPS[which].steps.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px] text-slate-700">
                <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: C.primary }}>
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ push */

function PushStatus() {
  const { token } = useAuth();
  const push = usePush(token);
  const [showDevices, setShowDevices] = useState(false);

  const enable = () => {
    // direto no toque: o pedido de permissão sai na hora
    push.enable().then((r) => (r.ok ? toast.success(r.message) : toast.error(r.message, { duration: 8000 })));
  };

  if (push.state === "checking") return <div className="h-11 w-60 animate-pulse rounded-xl bg-slate-100" />;

  if (push.state === "prompt") {
    return (
      <Button onClick={enable} loading={push.busy === "enable"} icon={<BellRing className="h-4 w-4" />}>
        {push.busy === "enable" ? "Ativando…" : "Ativar notificações neste aparelho"}
      </Button>
    );
  }

  if (push.state === "denied") {
    return (
      <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3.5">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-rose-700">
          <BellOff className="h-4 w-4" /> Notificações bloqueadas neste aparelho
        </p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-slate-600">{deniedHelp(push.platform)}</p>
        <Button variant="outline" className="mt-3 h-9 px-3.5 text-[12.5px]" onClick={() => push.refresh()} icon={<RefreshCw className="h-3.5 w-3.5" />}>
          Já liberei
        </Button>
      </div>
    );
  }

  if (push.state === "ios-install" || push.state === "ios-outdated" || push.state === "unsupported") {
    const msg =
      push.state === "ios-install"
        ? "No iPhone, instale o app primeiro (veja “Como instalar manualmente” acima) e abra a ShadowPay pelo ícone para ativar."
        : push.state === "ios-outdated"
          ? "Notificações no iPhone precisam do iOS 16.4 ou mais novo: Ajustes → Geral → Atualização de Software."
          : "Este navegador não recebe notificações. No Android use o Chrome; no computador, Chrome, Edge ou Firefox.";
    return (
      <p className="flex items-start gap-2 rounded-xl bg-slate-50 p-3.5 text-[12.5px] leading-relaxed text-slate-600">
        <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        {msg}
      </p>
    );
  }

  // enabled
  const devices = push.devices || [];
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="green" icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
          Ativo neste aparelho
        </Pill>
        <Button
          variant="outline"
          className="h-9 px-3.5 text-[12.5px]"
          loading={push.busy === "test"}
          disabled={!!push.busy}
          icon={<Send className="h-3.5 w-3.5" />}
          onClick={async () => {
            const r = await push.test();
            if (r.ok) toast.success(r.message, { duration: 7000 });
            else toast.error(r.message, { duration: 9000 });
          }}
        >
          Enviar teste
        </Button>
        <Button
          variant="ghost"
          className="h-9 px-3 text-[12.5px]"
          disabled={!!push.busy}
          onClick={async () => toast.success((await push.disable()).message)}
        >
          {push.busy === "disable" ? "Desativando…" : "Desativar"}
        </Button>
      </div>
      {devices.length > 0 && (
        <button
          type="button"
          onClick={() => setShowDevices((s) => !s)}
          className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-700"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDevices ? "" : "-rotate-90"}`} />
          {devices.length === 1 ? "1 aparelho recebe suas notificações" : `${devices.length} aparelhos recebem suas notificações`}
        </button>
      )}
      {showDevices && (
        <ul className="mt-1 divide-y divide-slate-100">
          {devices.map((d) => (
            <DeviceRow key={d.id} d={d} isThis={!!push.thisHint && d.endpointHint === push.thisHint} />
          ))}
        </ul>
      )}
      {push.platform === "ios" && (
        <p className="mt-3 text-[11.5px] text-slate-500">
          No iPhone, com o app aberto na tela o aviso pode ir direto para a Central de Notificações — bloqueie a tela para ver o teste chegar.
        </p>
      )}
    </div>
  );
}

function PushCard({
  prefs,
  setPref,
  defaults,
}: {
  prefs: Prefs | null;
  setPref: (k: keyof Prefs, v: boolean) => void;
  defaults: PushTemplates | null;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <IconBox>
          <BellRing className="h-[18px] w-[18px]" />
        </IconBox>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-slate-900">Notificações push</p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-500">
            Receba avisos de venda aprovada, PIX gerado e saque pago direto no seu celular ou computador — mesmo com o app fechado.
          </p>
          <div className="mt-4">
            <PushStatus />
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-[#E6E8EB] pt-5">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Quando me notificar</p>
        <div className="space-y-2.5">
          {EVENTS.map(({ kind, pref, label, desc, tone, Icon }) => {
            const paused = defaults ? defaults[kind]?.enabled === false : false;
            return (
              <div key={kind} className="flex items-center gap-3 rounded-xl border border-[#E6E8EB] px-3.5 py-3 sm:px-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: TONE[tone].soft, color: TONE[tone].fg }}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-slate-800">{label}</p>
                  <p className="text-[12px] text-slate-500">{paused ? "Pausado pela plataforma no momento" : desc}</p>
                </div>
                {prefs ? (
                  <Switch checked={!!prefs[pref] && !paused} disabled={paused} onChange={(v) => setPref(pref, v)} label={label} />
                ) : (
                  <span className="h-6 w-11 animate-pulse rounded-full bg-slate-100" />
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11.5px] text-slate-400">Vale para todos os aparelhos onde você ativou as notificações. Salva na hora.</p>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ textos */

function TemplateItem({
  ev,
  info,
  base,
  own,
  open,
  onToggle,
  onSave,
}: {
  ev: (typeof EVENTS)[number];
  info?: PushEventInfo;
  base: { enabled: boolean; title: string; body: string };
  own?: { title?: string; body?: string };
  open: boolean;
  onToggle: () => void;
  onSave: (draft: { title: string; body: string } | null) => Promise<boolean>;
}) {
  const { token } = useAuth();
  const effective = { title: own?.title || base.title, body: own?.body || base.body };
  const [draft, setDraft] = useState(effective);
  const [busy, setBusy] = useState<null | "save" | "reset" | "test">(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const lastField = useRef<"title" | "body">("body");

  // ao abrir (ou quando o salvo muda), começa do texto atual
  useEffect(() => {
    if (open) setDraft({ title: own?.title || base.title, body: own?.body || base.body });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, own?.title, own?.body, base.title, base.body]);

  const customized = !!(own?.title || own?.body);
  const dirty = draft.title !== effective.title || draft.body !== effective.body;
  const t = TONE[ev.tone];

  const insertVar = (key: string) => {
    const field = lastField.current;
    const el = field === "title" ? titleRef.current : bodyRef.current;
    const text = draft[field];
    const tag = `{${key}}`;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const max = field === "title" ? TITLE_MAX : BODY_MAX;
    setDraft((d) => ({ ...d, [field]: (text.slice(0, start) + tag + text.slice(end)).slice(0, max) }));
    setTimeout(() => {
      el?.focus();
      el?.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  const test = async () => {
    setBusy("test");
    try {
      const r = await axios.post(
        `${API}/api/user/push/templates/test`,
        { kind: ev.kind, title: draft.title, body: draft.body },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (r.data?.success) toast.success(r.data.message, { duration: 7000 });
      else toast.error(r.data?.message || "Não consegui enviar o teste.", { duration: 9000 });
    } catch (e) {
      toast.error(apiErrorMessage(e, "Não consegui enviar o teste."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-white transition-colors" style={{ borderColor: t.border, background: open ? "#FFFFFF" : t.tint }}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: t.soft, color: t.fg }}>
          <ev.Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-bold" style={{ color: t.fg }}>
            {ev.short}
          </span>
          <span className="block truncate text-[12px] text-slate-500">{renderSample(effective.title)}</span>
        </span>
        {customized && <Pill tone="violet">Personalizado</Pill>}
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t px-4 pb-4 pt-4" style={{ borderColor: t.border }}>
          {!base.enabled && (
            <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-[12px] text-slate-600">Este aviso está pausado pela plataforma no momento — seu texto fica guardado.</p>
          )}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor={`tpl-title-${ev.kind}`}>Título</FieldLabel>
                  <span className="mb-1.5 text-[11px] text-slate-400">
                    {draft.title.length}/{TITLE_MAX}
                  </span>
                </div>
                <input
                  id={`tpl-title-${ev.kind}`}
                  ref={titleRef}
                  value={draft.title}
                  maxLength={TITLE_MAX}
                  onFocus={() => (lastField.current = "title")}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor={`tpl-body-${ev.kind}`}>Texto</FieldLabel>
                  <span className="mb-1.5 text-[11px] text-slate-400">
                    {draft.body.length}/{BODY_MAX}
                  </span>
                </div>
                <textarea
                  id={`tpl-body-${ev.kind}`}
                  ref={bodyRef}
                  value={draft.body}
                  maxLength={BODY_MAX}
                  rows={3}
                  onFocus={() => (lastField.current = "body")}
                  onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                  className={`${inputCls} h-auto resize-none py-2.5`}
                />
              </div>
              {info?.variables?.length ? (
                <div>
                  <p className="mb-1.5 text-[11.5px] text-slate-500">Toque para inserir no campo:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {info.variables.map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        // não tira o foco do campo (o cursor fica onde estava)
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => insertVar(v.key)}
                        title={v.description}
                        className="rounded-lg px-2.5 py-1 text-[12px] font-semibold transition-colors hover:bg-violet-100"
                        style={{ background: C.primarySoft, color: C.primary }}
                      >
                        {`{${v.key}}`}
                        <span className="ml-1 font-normal text-slate-500">{v.description.toLowerCase()}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="lg:self-start">
              <PhonePreview title={draft.title} body={draft.body} enabled />
              <p className="mt-2 text-center text-[11px] text-slate-400">Prévia com dados de exemplo</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="outline" className="h-10 px-4 text-[12.5px]" onClick={test} loading={busy === "test"} disabled={!!busy} icon={<Send className="h-3.5 w-3.5" />}>
              Enviar teste pra mim
            </Button>
            <div className="flex gap-2">
              {(customized || dirty) && (
                <Button
                  variant="ghost"
                  className="h-10 px-3.5 text-[12.5px]"
                  disabled={!!busy}
                  loading={busy === "reset"}
                  icon={<RotateCcw className="h-3.5 w-3.5" />}
                  onClick={async () => {
                    if (!customized) {
                      setDraft(effective);
                      return;
                    }
                    setBusy("reset");
                    if (await onSave(null)) toast.success("Voltou para o texto padrão.");
                    setBusy(null);
                  }}
                >
                  {customized ? "Restaurar padrão" : "Desfazer"}
                </Button>
              )}
              <Button
                className="h-10 px-4 text-[12.5px]"
                disabled={!dirty || !draft.title.trim() || !draft.body.trim() || !!busy}
                loading={busy === "save"}
                icon={<Save className="h-3.5 w-3.5" />}
                onClick={async () => {
                  setBusy("save");
                  if (await onSave({ title: draft.title.trim(), body: draft.body.trim() })) toast.success("Texto salvo! As próximas notificações já saem assim.");
                  setBusy(null);
                }}
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TemplatesCard({ data, onCustom }: { data: TemplatesData | null; onCustom: (c: Custom) => void }) {
  const { token } = useAuth();
  const [open, setOpen] = useState<PushKind | null>(null);
  const vars = useMemo(() => {
    const keys = new Set<string>();
    data?.events.forEach((e) => e.variables.forEach((v) => keys.add(v.key)));
    return [...keys];
  }, [data]);

  const save = async (kind: PushKind, draft: { title: string; body: string } | null): Promise<boolean> => {
    if (!data) return false;
    const next: Custom = { ...data.custom };
    if (draft) next[kind] = draft;
    else delete next[kind];
    try {
      const r = await axios.post(`${API}/api/user/push/templates`, { templates: next }, { headers: { Authorization: `Bearer ${token}` } });
      onCustom(r.data?.data?.custom || {});
      return true;
    } catch (e) {
      toast.error(apiErrorMessage(e, "Não consegui salvar o texto."));
      return false;
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <IconBox>
          <PencilLine className="h-[18px] w-[18px]" />
        </IconBox>
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-slate-900">Personalizar texto das notificações</p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-500">
            Reescreva o título e o texto de cada aviso do seu jeito. Use{" "}
            {vars.map((k, i) => (
              <span key={k}>
                <code className="rounded px-1 py-0.5 text-[11.5px] font-semibold" style={{ background: C.primarySoft, color: C.primary }}>{`{${k}}`}</code>
                {i < vars.length - 2 ? ", " : i === vars.length - 2 ? " e " : ""}
              </span>
            ))}{" "}
            como variáveis.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {!data
          ? [0, 1, 2].map((i) => <div key={i} className="h-[66px] animate-pulse rounded-xl bg-slate-50" />)
          : EVENTS.map((ev) => (
              <TemplateItem
                key={ev.kind}
                ev={ev}
                info={data.events.find((e) => e.kind === ev.kind)}
                base={data.defaults[ev.kind]}
                own={data.custom[ev.kind]}
                open={open === ev.kind}
                onToggle={() => setOpen((o) => (o === ev.kind ? null : ev.kind))}
                onSave={(d) => save(ev.kind, d)}
              />
            ))}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ aba */

export function NotificationsTab() {
  const { token } = useAuth();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [tpl, setTpl] = useState<TemplatesData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    withRetry(() => axios.get(`${API}/api/user/notification-preferences`, { headers }))
      .then((r) => setPrefs(r.data?.data || null))
      .catch(() => setFailed(true));
    withRetry(() => axios.get(`${API}/api/user/push/templates`, { headers }))
      .then((r) => setTpl(r.data?.data || null))
      .catch(() => setFailed(true));
  }, [token]);

  const setPref = async (key: keyof Prefs, value: boolean) => {
    if (!prefs) return;
    const before = prefs;
    setPrefs({ ...prefs, [key]: value });
    try {
      await axios.post(`${API}/api/user/notification-preferences`, { [key]: value }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (e) {
      setPrefs(before);
      toast.error(apiErrorMessage(e, "Não consegui salvar essa preferência."));
    }
  };

  return (
    <div className="space-y-5">
      {failed && (
        <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-[12.5px] text-amber-800">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          O servidor está acordando — recarregue a página em alguns segundos se algo não aparecer.
        </p>
      )}
      <InstallCard />
      <PushCard prefs={prefs} setPref={setPref} defaults={tpl?.defaults ?? null} />
      <TemplatesCard data={tpl} onCustom={(custom) => setTpl((t) => (t ? { ...t, custom } : t))} />
      <p className="flex items-center justify-center gap-1.5 text-[11.5px] text-slate-400">
        <Monitor className="h-3.5 w-3.5" /> Avisos importantes da ShadowPay também aparecem no sino, no topo do painel.
      </p>
    </div>
  );
}
