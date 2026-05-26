"use client";

import {
  Search,
  Bell,
  LifeBuoy,
  Menu,
  LogOut,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ShadowMark } from "./ShadowMark";

interface ShadowTopbarProps {
  onOpenSidebar: () => void;
  valuesVisible?: boolean;
  onToggleValues?: () => void;
  rightExtra?: React.ReactNode;
}

export function ShadowTopbar({
  onOpenSidebar,
  valuesVisible,
  onToggleValues,
  rightExtra,
}: ShadowTopbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const initial = (user?.companyName?.[0] || "S").toUpperCase();

  return (
    <header
      className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-white/[0.06] px-3 sm:px-6"
      style={{
        background:
          "linear-gradient(180deg, rgba(5, 7, 13, 0.92) 0%, rgba(5, 7, 13, 0.75) 100%)",
        backdropFilter: "blur(20px) saturate(120%)",
      }}
    >
      {/* Mobile menu trigger + brand */}
      <div className="flex items-center gap-2 md:hidden">
        <button
          onClick={onOpenSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/70 hover:bg-white/[0.07] hover:text-white"
          aria-label="Abrir menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <ShadowMark size={22} />
      </div>

      {/* Search — full md+ */}
      <div className="hidden flex-1 md:flex md:max-w-xl">
        <div className="group relative w-full">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35 group-focus-within:text-violet-300" />
          <input
            type="text"
            placeholder="Pesquisar, criar produto, abrir checkout…"
            className="h-10 w-full rounded-xl border border-white/[0.07] bg-white/[0.03] pl-10 pr-20 text-sm text-white placeholder:text-white/35 outline-none transition-all focus:border-violet-500/40 focus:bg-white/[0.05]"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-mono text-white/45 sm:flex">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Mobile search icon */}
      <button
        className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/70 md:hidden"
        aria-label="Pesquisar"
      >
        <Search className="h-4 w-4" />
      </button>

      {/* Right cluster */}
      <div className="ml-auto hidden items-center gap-2 md:flex">
        {rightExtra}

        {/* Shadow online */}
        <button
          onClick={() => router.push("/shadow")}
          className="flex h-9 items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.05] px-3 text-xs font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/10"
          title="Shadow AI"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
          </span>
          <Sparkles className="h-3.5 w-3.5" />
          Shadow online
        </button>

        {/* Values toggle */}
        {onToggleValues && (
          <button
            onClick={onToggleValues}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/55 transition-colors hover:bg-white/[0.07] hover:text-white"
            aria-label="Alternar valores"
          >
            {valuesVisible ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/55 transition-colors hover:bg-white/[0.07] hover:text-white">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-violet-400 shadow-pulse-dot" />
        </button>

        {/* Support */}
        <a
          href="https://wa.me/559991519044?text=Ol%C3%A1%20preciso%20de%20ajuda%20com%20a%20ShadowPay."
          target="_blank"
          rel="noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/55 transition-colors hover:bg-white/[0.07] hover:text-white"
          aria-label="Suporte"
        >
          <LifeBuoy className="h-4 w-4" />
        </a>

        {/* Avatar */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-1.5 pr-3 text-xs text-white/85 transition-colors hover:bg-white/[0.07]"
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold text-white"
              style={{
                background:
                  "linear-gradient(135deg, #7C3AED 0%, #22D3EE 100%)",
              }}
            >
              {initial}
            </span>
            <span className="hidden lg:inline">
              {(user?.companyName || "Operador").slice(0, 14)}
            </span>
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setMenuOpen(false)}
              />
              <div
                className="absolute right-0 top-11 z-40 w-56 overflow-hidden rounded-xl border border-white/[0.07] bg-[#0D1322] p-1.5 shadow-2xl"
                style={{ backdropFilter: "blur(20px)" }}
              >
                <p className="border-b border-white/[0.05] px-3 py-2 text-[10px] uppercase tracking-wider text-white/35">
                  {now
                    ? new Intl.DateTimeFormat("pt-BR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "short",
                      }).format(now)
                    : ""}
                </p>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/v1/configs/profile");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/80 hover:bg-white/[0.05]"
                >
                  Perfil
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/10"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
