"use client";

/**
 * Peças do editor de notificações push do admin (/v2/manager/notifications):
 * cartão de cada evento (liga/desliga, título, texto, variáveis, teste) e a
 * prévia ao vivo no formato de notificação de celular.
 */
import { useRef } from "react";
import { Loader2, Send } from "lucide-react";

export const TITLE_MAX = 80;
export const BODY_MAX = 240;

export type PushKind = "sale_pending" | "sale_paid" | "withdrawal_paid";
export type PushTemplate = { enabled: boolean; title: string; body: string };
export type PushTemplates = Record<PushKind, PushTemplate>;
export type PushEventInfo = {
  kind: PushKind;
  label: string;
  description: string;
  variables: { key: string; description: string }[];
};

// Mesmos dados de exemplo e mesma regra do backend (src/push/push-templates.ts).
const SAMPLE: Record<string, string> = {
  valor: "R$ 197,00",
  liquido: "R$ 189,12",
  cliente: "Maria Souza",
  produto: "Curso Exemplo",
  loja: "Minha Loja",
};
const KNOWN = new Set(Object.keys(SAMPLE));

export function renderSample(text: string): string {
  return String(text || "")
    .replace(/\{(\w+)\}/g, (m, k: string) => (KNOWN.has(k.toLowerCase()) ? SAMPLE[k.toLowerCase()] ?? "" : m))
    .replace(/[ \t]{2,}/g, " ")
    .replace(/·\s*·/g, "·")
    .replace(/\s*·\s*(?=$|\n)/g, "")
    .replace(/^\s*·\s*/g, "")
    .trim();
}

const T = {
  primary: "#7C3AED",
  primarySoft: "rgba(124,58,237,0.08)",
  border: "rgba(15,23,42,0.08)",
};

export function PhonePreview({ title, body, enabled }: { title: string; body: string; enabled: boolean }) {
  return (
    <div
      className="relative rounded-[22px] p-3"
      style={{ background: "linear-gradient(160deg, #1E1B4B 0%, #312E81 45%, #6D28D9 100%)", opacity: enabled ? 1 : 0.45 }}
    >
      <p className="mb-2 text-center text-[11px] font-medium text-white/70">agora</p>
      <div className="flex items-start gap-2.5 rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(10px)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/pwa/icon-192.png" alt="" className="h-8 w-8 shrink-0 rounded-[9px]" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">ShadowPay</p>
            <p className="text-[10.5px] text-slate-400">agora</p>
          </div>
          <p className="mt-0.5 break-words text-[13px] font-bold leading-snug text-slate-900">{renderSample(title) || "Título"}</p>
          <p className="break-words text-[12.5px] leading-snug text-slate-700">{renderSample(body) || "Texto da notificação"}</p>
        </div>
      </div>
      {!enabled && <p className="mt-2 text-center text-[11px] font-semibold text-white">Desligada — ninguém recebe</p>}
    </div>
  );
}

export function EventCard({
  info,
  value,
  onChange,
  onTest,
  testing,
}: {
  info: PushEventInfo;
  value: PushTemplate;
  onChange: (v: PushTemplate) => void;
  onTest: () => void;
  testing: boolean;
}) {
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const lastField = useRef<"title" | "body">("body");

  const insertVar = (key: string) => {
    const field = lastField.current;
    const el = field === "title" ? titleRef.current : bodyRef.current;
    const text = value[field];
    const tag = `{${key}}`;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const max = field === "title" ? TITLE_MAX : BODY_MAX;
    const next = (text.slice(0, start) + tag + text.slice(end)).slice(0, max);
    onChange({ ...value, [field]: next });
    setTimeout(() => {
      el?.focus();
      el?.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  const input =
    "w-full rounded-xl border bg-white px-3 text-[13.5px] text-slate-800 outline-none transition-colors focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

  return (
    <section className="rounded-xl border border-[#E6E8EB] bg-white p-5 shadow-[0_1px_1px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[15px] font-bold text-slate-900">{info.label}</p>
          <p className="text-[12.5px] text-slate-500">{info.description}</p>
        </div>
        <button
          role="switch"
          aria-checked={value.enabled}
          aria-label={`${info.label}: ${value.enabled ? "ligada" : "desligada"}`}
          onClick={() => onChange({ ...value, enabled: !value.enabled })}
          className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
          style={{ background: value.enabled ? T.primary : "#CBD5E1" }}
        >
          <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all" style={{ left: value.enabled ? 22 : 2 }} />
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-[12px] font-semibold text-slate-600">Título</label>
              <span className="text-[11px] text-slate-400">
                {value.title.length}/{TITLE_MAX}
              </span>
            </div>
            <input
              ref={titleRef}
              value={value.title}
              maxLength={TITLE_MAX}
              onFocus={() => (lastField.current = "title")}
              onChange={(e) => onChange({ ...value, title: e.target.value })}
              className={`${input} h-11`}
              style={{ borderColor: T.border }}
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-[12px] font-semibold text-slate-600">Texto</label>
              <span className="text-[11px] text-slate-400">
                {value.body.length}/{BODY_MAX}
              </span>
            </div>
            <textarea
              ref={bodyRef}
              value={value.body}
              maxLength={BODY_MAX}
              rows={3}
              onFocus={() => (lastField.current = "body")}
              onChange={(e) => onChange({ ...value, body: e.target.value })}
              className={`${input} resize-none py-2.5`}
              style={{ borderColor: T.border }}
            />
          </div>
          <div>
            <p className="mb-1.5 text-[11.5px] text-slate-500">Toque para inserir no campo:</p>
            <div className="flex flex-wrap gap-1.5">
              {info.variables.map((v) => (
                <button
                  key={v.key}
                  // não tira o foco do campo (o cursor fica onde estava)
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertVar(v.key)}
                  title={v.description}
                  className="rounded-lg px-2.5 py-1 text-[12px] font-semibold transition-colors hover:bg-violet-100"
                  style={{ background: T.primarySoft, color: T.primary }}
                >
                  {`{${v.key}}`}
                  <span className="ml-1 font-normal text-slate-500">{v.description.toLowerCase()}</span>
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={onTest}
            disabled={testing}
            className="inline-flex h-9 items-center gap-2 rounded-xl px-3.5 text-[12.5px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
            style={{ border: `1px solid ${T.border}` }}
          >
            {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Enviar teste pra mim
          </button>
        </div>
        <div className="lg:self-start">
          <PhonePreview title={value.title} body={value.body} enabled={value.enabled} />
        </div>
      </div>
    </section>
  );
}
