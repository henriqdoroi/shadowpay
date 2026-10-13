"use client";

/**
 * /v2/manager/notifications — Notificações (admin).
 *
 *  - Disparar aviso: o admin escreve a mensagem e dispara pra TODOS os sellers
 *    (push nos aparelhos ativos + fica no sino de todo mundo). Prévia ao vivo,
 *    teste no próprio celular, confirmação e histórico com o resultado.
 *  - Textos automáticos: textos das notificações de venda gerada, venda
 *    aprovada e saque pago (o padrão de todos os sellers; cada seller pode
 *    personalizar o dele em Minha conta → Notificações).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import { toast } from "sonner";
import {
  BellRing,
  CheckCircle2,
  ChevronDown,
  Clock,
  EyeOff,
  Loader2,
  Megaphone,
  PencilLine,
  RotateCcw,
  Save,
  Send,
  Smartphone,
  Users,
  X,
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import { useAuth } from "@/contexts/AuthContext";
import { apiErrorMessage } from "@/lib/axiosErrors";
import { refreshAnnouncements } from "@/components/NotificationsBell";
import { Button, C, Card, FieldLabel, IconBox, Pill, inputCls, timeAgo } from "@/components/account/ui";
import {
  BODY_MAX,
  EventCard,
  PhonePreview,
  TITLE_MAX,
  type PushEventInfo,
  type PushKind,
  type PushTemplates,
} from "@/components/admin/PushTemplateEditor";

const API = "https://shadowpay-backend.onrender.com";

const PLATFORM_LABEL: Record<string, string> = {
  android: "Android",
  ios: "iPhone",
  desktop: "Computador",
  other: "Outros",
};

type Stats = { devices: number; sellers: number; byPlatform: Record<string, number> };
type Reach = { sellers: number; sellersWithDevices: number; devices: number };
type Broadcast = {
  id: string;
  title: string;
  body: string;
  url: string;
  audience: "all" | "approved";
  status: "sending" | "sent" | "interrupted";
  sellers: number;
  devices: number;
  sent: number;
  failed: number;
  removed: number;
  hidden: boolean;
  createdAt: string;
};

const DEFAULT_TARGETS = [{ url: "/v1/dashboard", label: "Dashboard" }];
const plural = (n: number, one: string, many: string) => `${n.toLocaleString("pt-BR")} ${n === 1 ? one : many}`;

/* ------------------------------------------------------------------ disparo */

function BroadcastStatus({ b }: { b: Broadcast }) {
  const done = b.sent + b.failed + b.removed;
  if (b.status === "sending") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: C.primary }}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando… {done}/{b.devices}
      </span>
    );
  }
  if (!b.devices) return <span className="text-[12px] text-slate-500">Só no sino (nenhum aparelho com push ativo)</span>;
  if (b.status === "interrupted") {
    return <span className="text-[12px] font-semibold text-amber-700">Interrompido · {b.sent} de {b.devices} entregues</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-slate-600">
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
      Entregue em {b.sent} de {plural(b.devices, "aparelho", "aparelhos")}
      {b.removed > 0 && <span className="text-slate-400">· {b.removed} sem o app</span>}
    </span>
  );
}

function BroadcastPanel({ token, onSent }: { token: string; onSent: () => void }) {
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [audience, setAudience] = useState<"all" | "approved">("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/v1/dashboard");
  const [targets, setTargets] = useState(DEFAULT_TARGETS);
  const [reach, setReach] = useState<Reach | null>(null);
  const [history, setHistory] = useState<Broadcast[] | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState<null | "send" | "test">(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const lastField = useRef<"title" | "body">("body");

  const loadHistory = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/api/admin/push/broadcasts`, { headers });
      setHistory(r.data?.data?.broadcasts || []);
      if (r.data?.data?.targets?.length) setTargets(r.data.data.targets);
    } catch (e) {
      setHistory((h) => h ?? []);
      toast.error(apiErrorMessage(e, "Não consegui carregar o histórico de avisos."));
    }
  }, [headers]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    setReach(null);
    axios
      .get(`${API}/api/admin/push/broadcasts/reach?audience=${audience}`, { headers })
      .then((r) => setReach(r.data?.data || null))
      .catch(() => setReach(null));
  }, [audience, headers]);

  // enquanto algum aviso está saindo, atualiza o histórico
  const sending = !!history?.some((b) => b.status === "sending");
  useEffect(() => {
    if (!sending) return;
    const t = setInterval(loadHistory, 2500);
    return () => clearInterval(t);
  }, [sending, loadHistory]);

  const insertVar = (key: string) => {
    const field = lastField.current;
    const el = field === "title" ? titleRef.current : bodyRef.current;
    const text = field === "title" ? title : body;
    const tag = `{${key}}`;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const next = (text.slice(0, start) + tag + text.slice(end)).slice(0, field === "title" ? TITLE_MAX : BODY_MAX);
    if (field === "title") setTitle(next);
    else setBody(next);
    setTimeout(() => {
      el?.focus();
      el?.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  const ready = title.trim().length > 0 && body.trim().length > 0;
  const payload = { title: title.trim(), body: body.trim(), url, audience };

  const test = async () => {
    setBusy("test");
    try {
      const r = await axios.post(`${API}/api/admin/push/broadcasts/test`, payload, { headers });
      if (r.data?.success) toast.success(r.data.message, { duration: 7000 });
      else toast.error(r.data?.message || "Não consegui enviar o teste.", { duration: 9000 });
    } catch (e) {
      toast.error(apiErrorMessage(e, "Não consegui enviar o teste."));
    } finally {
      setBusy(null);
    }
  };

  const send = async () => {
    setBusy("send");
    try {
      const r = await axios.post(`${API}/api/admin/push/broadcasts`, payload, { headers });
      toast.success(r.data?.message || "Aviso disparado!", { duration: 8000 });
      setConfirming(false);
      setTitle("");
      setBody("");
      await loadHistory();
      onSent();
      refreshAnnouncements(); // o sino do próprio admin já mostra o aviso
    } catch (e) {
      toast.error(apiErrorMessage(e, "Não consegui disparar o aviso."));
    } finally {
      setBusy(null);
    }
  };

  const hide = async (b: Broadcast) => {
    if (!window.confirm("Tirar este aviso do sino dos sellers? (quem já recebeu no celular continua com ele lá)")) return;
    try {
      await axios.post(`${API}/api/admin/push/broadcasts/${b.id}/hide`, {}, { headers });
      setHistory((h) => (h ? h.map((x) => (x.id === b.id ? { ...x, hidden: true } : x)) : h));
      refreshAnnouncements();
      toast.success("Aviso removido do sino.");
    } catch (e) {
      toast.error(apiErrorMessage(e, "Não consegui remover o aviso."));
    }
  };

  const audienceLabel = audience === "approved" ? "contas verificadas" : "todos os sellers";

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
        <div className="space-y-5">
          <div>
            <FieldLabel>Para quem</FieldLabel>
            <div className="inline-flex w-full rounded-xl border border-[#E6E8EB] bg-slate-50 p-1 sm:w-auto">
              {(
                [
                  { id: "all", label: "Todos os sellers" },
                  { id: "approved", label: "Só contas verificadas" },
                ] as const
              ).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setAudience(o.id)}
                  className="flex-1 rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors sm:flex-none"
                  style={audience === o.id ? { background: "#FFFFFF", color: C.primary, boxShadow: "0 1px 2px rgba(15,23,42,0.08)" } : { color: "#64748B" }}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <p className="mt-2 flex items-start gap-1.5 text-[12px] text-slate-500">
              <Users className="mt-px h-3.5 w-3.5 shrink-0" />
              {reach ? (
                <span>
                  Aparece no sino de <b className="text-slate-700">{plural(reach.sellers, "seller", "sellers")}</b> e chega agora por push em{" "}
                  <b className="text-slate-700">{plural(reach.devices, "aparelho", "aparelhos")}</b> ({plural(reach.sellersWithDevices, "seller", "sellers")} com notificações ativas).
                </span>
              ) : (
                <span>Calculando o alcance…</span>
              )}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="bc-title">Título</FieldLabel>
              <span className="mb-1.5 text-[11px] text-slate-400">
                {title.length}/{TITLE_MAX}
              </span>
            </div>
            <input
              id="bc-title"
              ref={titleRef}
              value={title}
              maxLength={TITLE_MAX}
              placeholder="Ex.: 🚀 Novidade na ShadowPay"
              onFocus={() => (lastField.current = "title")}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="bc-body">Mensagem</FieldLabel>
              <span className="mb-1.5 text-[11px] text-slate-400">
                {body.length}/{BODY_MAX}
              </span>
            </div>
            <textarea
              id="bc-body"
              ref={bodyRef}
              value={body}
              maxLength={BODY_MAX}
              rows={4}
              placeholder="Ex.: Olá, {loja}! Os saques agora caem em até 1 hora."
              onFocus={() => (lastField.current = "body")}
              onChange={(e) => setBody(e.target.value)}
              className={`${inputCls} h-auto resize-none py-2.5`}
            />
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11.5px] text-slate-500">Toque para inserir:</span>
              <button
                type="button"
                // não tira o foco do campo (o cursor fica onde estava)
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertVar("loja")}
                className="rounded-lg px-2.5 py-1 text-[12px] font-semibold transition-colors hover:bg-violet-100"
                style={{ background: C.primarySoft, color: C.primary }}
              >
                {"{loja}"} <span className="font-normal text-slate-500">nome da loja de cada seller</span>
              </button>
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="bc-url">Ao tocar no aviso, abrir</FieldLabel>
            <div className="relative">
              <select id="bc-url" value={url} onChange={(e) => setUrl(e.target.value)} className={`${inputCls} cursor-pointer appearance-none pr-10`}>
                {targets.map((t) => (
                  <option key={t.url} value={t.url}>
                    {t.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={test} loading={busy === "test"} disabled={!ready || !!busy} icon={<Smartphone className="h-4 w-4" />}>
              Enviar teste pra mim
            </Button>
            <Button onClick={() => setConfirming(true)} disabled={!ready || !!busy} icon={<Megaphone className="h-4 w-4" />}>
              Disparar aviso
            </Button>
          </div>
        </div>

        <div className="lg:self-start">
          <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-slate-500">Prévia no celular</p>
          <PhonePreview title={title || "Título do aviso"} body={body || "A mensagem aparece aqui."} enabled />
          <p className="mt-2 text-center text-[11px] text-slate-400">{"{loja}"} vira o nome de cada seller</p>
        </div>
      </div>

      {/* histórico */}
      <div className="mt-8 border-t border-[#E6E8EB] pt-6">
        <p className="mb-3 text-[15px] font-bold text-slate-900">Avisos disparados</p>
        {history === null ? (
          <div className="space-y-2.5">
            {[0, 1].map((i) => (
              <div key={i} className="h-[84px] animate-pulse rounded-xl bg-slate-50" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-[#E6E8EB] px-6 py-10 text-center">
            <Megaphone className="h-6 w-6 text-slate-300" />
            <p className="mt-2 text-[13.5px] font-semibold text-slate-700">Nenhum aviso disparado ainda</p>
            <p className="mt-0.5 text-[12.5px] text-slate-500">Escreva a mensagem acima e dispare para os sellers.</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {history.map((b) => (
              <li key={b.id} className="flex gap-3 rounded-xl border border-[#E6E8EB] bg-white p-4" style={{ opacity: b.hidden ? 0.6 : 1 }}>
                <IconBox>
                  <Megaphone className="h-[18px] w-[18px]" />
                </IconBox>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <p className="min-w-0 text-[14px] font-bold text-slate-900">{b.title}</p>
                    <span className="shrink-0 text-[11.5px] text-slate-400" title={new Date(b.createdAt).toLocaleString("pt-BR")}>
                      {timeAgo(b.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 whitespace-pre-line text-[12.5px] text-slate-600">{b.body}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <Pill tone={b.audience === "approved" ? "blue" : "violet"}>{b.audience === "approved" ? "Contas verificadas" : "Todos os sellers"}</Pill>
                    <BroadcastStatus b={b} />
                    <span className="ml-auto">
                      {b.hidden ? (
                        <span className="inline-flex items-center gap-1 text-[11.5px] text-slate-400">
                          <EyeOff className="h-3.5 w-3.5" /> Fora do sino
                        </span>
                      ) : (
                        <button type="button" onClick={() => hide(b)} className="text-[12px] font-semibold text-slate-500 hover:text-rose-600">
                          Tirar do sino
                        </button>
                      )}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {confirming &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onClick={() => !busy && setConfirming(false)}>
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Confirmar disparo"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl bg-white p-6 pb-[max(24px,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-2xl"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[17px] font-bold text-slate-900">Disparar para {audienceLabel}?</p>
                  <p className="mt-0.5 text-[12.5px] text-slate-500">
                    {reach
                      ? `Vai para o sino de ${plural(reach.sellers, "seller", "sellers")} e por push para ${plural(reach.devices, "aparelho", "aparelhos")}. Não dá para desfazer o push depois de enviado.`
                      : "Não dá para desfazer o push depois de enviado."}
                  </p>
                </div>
                <button onClick={() => setConfirming(false)} aria-label="Fechar" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <PhonePreview title={title} body={body} enabled />
              <div className="mt-5 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setConfirming(false)} disabled={busy === "send"}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={send} loading={busy === "send"} icon={<Send className="h-4 w-4" />}>
                  Sim, disparar
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

/* ------------------------------------------------------------------ textos */

function TemplatesPanel({ token }: { token: string }) {
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [events, setEvents] = useState<PushEventInfo[]>([]);
  const [saved, setSaved] = useState<PushTemplates | null>(null);
  const [draft, setDraft] = useState<PushTemplates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<PushKind | null>(null);

  useEffect(() => {
    axios
      .get(`${API}/api/admin/push/templates`, { headers })
      .then((t) => {
        setEvents(t.data?.data?.events || []);
        setSaved(t.data?.data?.templates || null);
        setDraft(t.data?.data?.templates || null);
      })
      .catch((e) => setError(apiErrorMessage(e, "Não consegui carregar os textos.")));
  }, [headers]);

  const dirty = !!draft && !!saved && JSON.stringify(draft) !== JSON.stringify(saved);

  const save = async (templates: Partial<PushTemplates>) => {
    setSaving(true);
    try {
      const r = await axios.post(`${API}/api/admin/push/templates`, { templates }, { headers });
      setSaved(r.data?.data?.templates);
      setDraft(r.data?.data?.templates);
      toast.success(r.data?.message || "Textos salvos.");
    } catch (e) {
      toast.error(apiErrorMessage(e, "Não consegui salvar."));
    } finally {
      setSaving(false);
    }
  };

  const test = async (kind: PushKind) => {
    if (!draft) return;
    setTesting(kind);
    try {
      const r = await axios.post(`${API}/api/admin/push/templates/test`, { kind, title: draft[kind].title, body: draft[kind].body }, { headers });
      if (r.data?.success) toast.success(r.data.message, { duration: 7000 });
      else toast.error(r.data?.message || "Não consegui enviar o teste.", { duration: 9000 });
    } catch (e) {
      toast.error(apiErrorMessage(e, "Não consegui enviar o teste."));
    } finally {
      setTesting(null);
    }
  };

  if (error) return <p className="py-8 text-center text-[14px] text-rose-600">{error}</p>;
  if (!draft)
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-50" />
        ))}
      </div>
    );

  return (
    <div className="space-y-4">
      <p className="text-[13px] leading-relaxed text-slate-500">
        Texto padrão que todos os sellers recebem. Quem personalizou o próprio texto em <b>Minha conta → Notificações</b> continua recebendo o dele. Desligar um tipo aqui pausa esse aviso para todos.
      </p>
      {events.map((info) => (
        <EventCard
          key={info.kind}
          info={info}
          value={draft[info.kind]}
          onChange={(v) => setDraft((d) => (d ? { ...d, [info.kind]: v } : d))}
          onTest={() => test(info.kind)}
          testing={testing === info.kind}
        />
      ))}
      <div
        className="sticky bottom-4 z-10 flex flex-col gap-2 rounded-xl bg-white/95 p-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between"
        style={{ border: `1px solid ${C.border}`, boxShadow: "0 16px 40px -20px rgba(15,23,42,0.35)" }}
      >
        <p className="flex items-center gap-2 px-1 text-[12.5px] text-slate-500">
          <BellRing className="h-4 w-4" style={{ color: C.primary }} />
          {dirty ? "Alterações não salvas" : "Tudo salvo"}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="h-10 px-4 text-[12.5px]"
            disabled={saving}
            icon={<RotateCcw className="h-4 w-4" />}
            onClick={() => {
              if (window.confirm("Voltar todos os textos para o padrão da ShadowPay?")) save({});
            }}
          >
            Restaurar padrão
          </Button>
          <Button className="h-10 px-5 text-[13px]" onClick={() => save(draft)} disabled={!dirty} loading={saving} icon={<Save className="h-4 w-4" />}>
            Salvar para todos
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ página */

type TabId = "disparar" | "textos";

function NotificationsAdmin() {
  const { token, user } = useAuth();
  const router = useRouter();
  const tab: TabId = router.query.tab === "textos" ? "textos" : "disparar";
  const [stats, setStats] = useState<Stats | null>(null);

  const loadStats = useCallback(() => {
    if (!token) return;
    axios
      .get(`${API}/api/admin/push/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((s) => setStats(s.data?.data || null))
      .catch(() => {});
  }, [token]);
  useEffect(loadStats, [loadStats]);

  const goTab = (t: TabId) =>
    router.replace({ pathname: router.pathname, query: t === "disparar" ? {} : { tab: t } }, undefined, { shallow: true, scroll: false });

  const TABS: { id: TabId; label: string; Icon: typeof Megaphone }[] = [
    { id: "disparar", label: "Disparar aviso", Icon: Megaphone },
    { id: "textos", label: "Textos automáticos", Icon: PencilLine },
  ];

  return (
    <>
      <Head>
        <title>ShadowPay — Notificações</title>
      </Head>
      <LightShell>
        <header className="mb-6">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em]" style={{ color: C.primary }}>
            Admin
          </p>
          <h1 className="mt-1 text-[26px] font-bold tracking-[-0.01em] text-slate-900 sm:text-[30px]">Notificações</h1>
          <p className="mt-1 text-[14px] text-slate-500">Dispare avisos para os sellers e edite os textos automáticos de venda e saque.</p>
        </header>

        {!user?.isAdministrator ? (
          <Card className="p-6 text-[14px] text-slate-600">Acesso restrito a administradores.</Card>
        ) : (
          <>
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <Card className="p-4 sm:p-5">
                <p className="text-[13px] font-medium text-slate-500">Aparelhos recebendo</p>
                <p className="mt-1.5 text-[24px] font-semibold tabular-nums text-slate-900">{stats ? stats.devices.toLocaleString("pt-BR") : "—"}</p>
              </Card>
              <Card className="p-4 sm:p-5">
                <p className="text-[13px] font-medium text-slate-500">Sellers com push ativo</p>
                <p className="mt-1.5 text-[24px] font-semibold tabular-nums text-slate-900">{stats ? stats.sellers.toLocaleString("pt-BR") : "—"}</p>
              </Card>
              <Card className="p-4 sm:p-5">
                <p className="text-[13px] font-medium text-slate-500">Por plataforma</p>
                <p className="mt-2.5 text-[13px] font-semibold text-slate-700">
                  {stats && Object.keys(stats.byPlatform).length
                    ? Object.entries(stats.byPlatform)
                        .map(([k, n]) => `${PLATFORM_LABEL[k] || k}: ${n}`)
                        .join(" · ")
                    : "Nenhum aparelho ainda"}
                </p>
              </Card>
            </div>

            <Card className="mb-10">
              <div role="tablist" aria-label="Notificações" className="flex gap-1 border-b border-[#E6E8EB] px-2 sm:px-5">
                {TABS.map(({ id, label, Icon }) => {
                  const active = tab === id;
                  return (
                    <button
                      key={id}
                      role="tab"
                      aria-selected={active}
                      onClick={() => goTab(id)}
                      className="relative flex shrink-0 items-center gap-2 px-3.5 py-4 text-[14px] font-semibold transition-colors"
                      style={{ color: active ? C.primary : "#64748B" }}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                      {active && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full" style={{ background: C.primary }} />}
                    </button>
                  );
                })}
              </div>
              <div className="p-4 sm:p-8">
                {token && (tab === "disparar" ? <BroadcastPanel token={token} onSent={loadStats} /> : <TemplatesPanel token={token} />)}
              </div>
            </Card>

            <p className="-mt-6 mb-10 flex items-center justify-center gap-1.5 text-center text-[12px] text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              O “enviar teste” chega nos aparelhos onde <b className="font-semibold">você</b> ativou as notificações.{" "}
              <Link href="/v1/configs/profile?tab=notificacoes" className="font-semibold underline" style={{ color: C.primary }}>
                Ativar neste aparelho
              </Link>
            </p>
          </>
        )}
      </LightShell>
    </>
  );
}

export default function NotificationsAdminPage() {
  return (
    <ProtectedRoute>
      <NotificationsAdmin />
    </ProtectedRoute>
  );
}
