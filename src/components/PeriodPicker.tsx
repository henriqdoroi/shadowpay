"use client";

/**
 * PeriodPicker — seletor de período do dashboard, no visual da ShadowPay
 * (substitui o calendário nativo do navegador).
 *
 *  - Atalhos: Hoje, Ontem, 7 dias, 30 dias, Este mês, Mês passado, Máximo
 *  - Personalizado: calendário próprio, clique no dia inicial e no final
 *  - Computador: balão ancorado no botão · Celular: folha que sobe de baixo
 *
 * Vai pra document.body via portal (os cards/topo usam overflow/backdrop).
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon, Check, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  MONTHS,
  PERIOD_PRESETS,
  addDays,
  parseYmd,
  resolvePeriod,
  startOfDay,
  ymd,
  type Period,
} from "@/lib/period";

const VIOLET = "#7C3AED";
const BORDER = "rgba(15,23,42,0.08)";
const WEEK = ["D", "S", "T", "Q", "Q", "S", "S"];

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const fmtBr = (s: string) => {
  const d = parseYmd(s);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return desktop;
}

export function PeriodPicker({
  value,
  onChange,
  block = false,
}: {
  value: Period;
  onChange: (p: Period) => void;
  /** Botão ocupando a largura toda (dentro de formulários de filtro). */
  block?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop();
  const resolved = useMemo(() => resolvePeriod(value), [value]);

  // rascunho do intervalo personalizado
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [view, setView] = useState<Date>(() => startOfMonth(new Date()));

  useEffect(() => setMounted(true), []);

  const place = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const h = panelRef.current?.offsetHeight ?? 0;
    const vh = window.innerHeight;
    let top = r.bottom + 8;
    // sem espaço embaixo: abre pra cima; se também não couber, encosta na tela
    if (h && top + h > vh - 8) top = r.top - 8 - h >= 8 ? r.top - 8 - h : Math.max(8, vh - h - 8);
    setPos({ top, right: Math.max(8, window.innerWidth - r.right) });
  };

  // mede o balão já desenhado e acerta a posição antes de aparecer na tela
  useIsoLayoutEffect(() => {
    if (open && isDesktop) place();
  }, [open, isDesktop]);

  const openPanel = () => {
    const r = resolvePeriod(value);
    if (r.start && r.end && value.preset !== "max") {
      setFrom(ymd(r.start));
      setTo(ymd(r.end));
      setView(startOfMonth(r.end));
    } else {
      setFrom(null);
      setTo(null);
      setView(startOfMonth(new Date()));
    }
    setHover(null);
    place();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  // no celular a folha trava o scroll da página
  useEffect(() => {
    if (!open || isDesktop) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isDesktop]);

  const pickPreset = (preset: Period["preset"]) => {
    onChange({ preset });
    setOpen(false);
  };

  const pickDay = (k: string) => {
    if (!from || to) {
      setFrom(k);
      setTo(null);
      return;
    }
    if (k < from) {
      setTo(from);
      setFrom(k);
    } else {
      setTo(k);
    }
  };

  const apply = () => {
    if (!from) return;
    onChange({ preset: "custom", from, to: to ?? from });
    setOpen(false);
  };

  const todayKey = ymd(startOfDay(new Date()));
  const canNext = startOfMonth(view) < startOfMonth(new Date());
  const days = useMemo(() => {
    const first = startOfMonth(view);
    const gridStart = addDays(first, -first.getDay()); // semana começa no domingo
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [view]);

  // intervalo destacado (com prévia ao passar o mouse antes do 2º clique)
  const [lo, hi] = useMemo(() => {
    const end = to ?? (from && hover ? hover : null);
    if (!from) return [null, null];
    if (!end) return [from, from];
    return from <= end ? [from, end] : [end, from];
  }, [from, to, hover]);

  const selectedDays = from && (to ?? from) ? Math.round((parseYmd(to ?? from).getTime() - parseYmd(from).getTime()) / 86_400_000) + 1 : 0;
  const summary = !from
    ? "Escolha a data inicial no calendário"
    : !to
      ? `${fmtBr(from)} — agora escolha a data final (ou aplique só esse dia)`
      : from === to
        ? `${fmtBr(from)} · 1 dia`
        : `${fmtBr(from)} até ${fmtBr(to)} · ${selectedDays} dias`;

  const presets = (
    <div className={isDesktop ? "flex w-44 shrink-0 flex-col gap-0.5 border-r p-2" : "grid grid-cols-2 gap-2"} style={isDesktop ? { borderColor: BORDER } : undefined}>
      {PERIOD_PRESETS.map((p) => {
        const active = value.preset === p.preset;
        return (
          <button
            key={p.preset}
            onClick={() => pickPreset(p.preset)}
            className={
              isDesktop
                ? "flex h-9 items-center justify-between rounded-lg px-3 text-left text-[13px] font-medium transition-colors"
                : "flex h-11 items-center justify-center rounded-xl border text-[13px] font-semibold transition-colors"
            }
            style={
              isDesktop
                ? { background: active ? "rgba(124,58,237,0.08)" : undefined, color: active ? VIOLET : "#334155" }
                : { background: active ? VIOLET : "#FFFFFF", color: active ? "#FFFFFF" : "#334155", borderColor: active ? VIOLET : BORDER }
            }
          >
            {p.label}
            {isDesktop && active && <Check className="h-4 w-4" />}
          </button>
        );
      })}
    </div>
  );

  const calendar = (
    <div className={isDesktop ? "w-[328px] p-4" : "pt-1"}>
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-[14px] font-bold capitalize text-slate-900">
          {MONTHS[view.getMonth()]} {view.getFullYear()}
        </p>
        <button
          onClick={() => canNext && setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
          disabled={!canNext}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center">
        {WEEK.map((w, i) => (
          <span key={i} className="pb-1.5 text-[11px] font-semibold text-slate-400">
            {w}
          </span>
        ))}
        {days.map((d) => {
          const k = ymd(d);
          const outside = d.getMonth() !== view.getMonth();
          const future = k > todayKey;
          const isStart = lo === k;
          const isEnd = hi === k;
          const between = !!lo && !!hi && k > lo && k < hi;
          const edge = isStart || isEnd;
          const band =
            lo && hi && lo !== hi
              ? isStart
                ? "linear-gradient(90deg, transparent 50%, rgba(124,58,237,0.10) 50%)"
                : isEnd
                  ? "linear-gradient(90deg, rgba(124,58,237,0.10) 50%, transparent 50%)"
                  : between
                    ? "rgba(124,58,237,0.10)"
                    : undefined
              : undefined;
          return (
            <div key={k} className="flex h-10 items-center justify-center" style={{ background: band }}>
              <button
                disabled={future}
                onClick={() => pickDay(k)}
                onMouseEnter={() => setHover(k)}
                aria-label={`${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`}
                aria-pressed={edge}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[13px] transition-colors disabled:cursor-not-allowed"
                style={{
                  background: edge ? VIOLET : undefined,
                  color: edge ? "#FFFFFF" : future ? "#CBD5E1" : outside ? "#94A3B8" : "#1E293B",
                  fontWeight: edge || k === todayKey ? 700 : 500,
                  boxShadow: !edge && k === todayKey ? `inset 0 0 0 1.5px ${VIOLET}` : undefined,
                }}
              >
                {d.getDate()}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-3 min-h-[34px] text-[12px] leading-snug text-slate-500">{summary}</p>
      <div className="mt-2 flex justify-end gap-2">
        <button
          onClick={() => setOpen(false)}
          className="h-10 rounded-xl px-4 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-100"
        >
          Cancelar
        </button>
        <button
          onClick={apply}
          disabled={!from}
          className="h-10 rounded-xl px-5 text-[13px] font-bold text-white transition-opacity disabled:opacity-40"
          style={{ background: VIOLET, boxShadow: "0 8px 20px -10px rgba(124,58,237,0.7)" }}
        >
          Aplicar
        </button>
      </div>
    </div>
  );

  const panel = isDesktop ? (
    <div className="fixed inset-0 z-[70]" onMouseDown={() => setOpen(false)}>
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Escolher período"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseLeave={() => setHover(null)}
        className="absolute flex max-h-[calc(100vh-16px)] max-w-[calc(100vw-16px)] overflow-y-auto rounded-2xl bg-white"
        style={{ top: pos.top, right: pos.right, border: `1px solid ${BORDER}`, boxShadow: "0 24px 60px -20px rgba(15,23,42,0.35)" }}
      >
        {presets}
        {calendar}
      </div>
    </div>
  ) : (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Escolher período">
      <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
      <div className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300" aria-hidden="true" />
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[16px] font-bold text-slate-900">Período</p>
          <button onClick={() => setOpen(false)} aria-label="Fechar" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        {presets}
        <p className="mb-1 mt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Ou escolha as datas</p>
        {calendar}
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        onClick={openPanel}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`${block ? "flex w-full" : "inline-flex max-w-full"} h-10 items-center gap-2 rounded-xl bg-white px-3.5 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50`}
        style={{ border: `1px solid ${BORDER}`, boxShadow: "0 1px 2px rgba(15,23,42,0.05)" }}
      >
        <CalendarIcon className="h-4 w-4 shrink-0" style={{ color: VIOLET }} />
        <span className={`truncate ${block ? "flex-1 text-left" : ""}`}>{resolved.label}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>
      {mounted && open && createPortal(panel, document.body)}
    </>
  );
}
