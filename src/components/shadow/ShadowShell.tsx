"use client";

import { ReactNode, useEffect, useState } from "react";
import { ShadowSidebar } from "./ShadowSidebar";
import { ShadowTopbar } from "./ShadowTopbar";
import { ShadowMobileNav } from "./ShadowMobileNav";
import { X } from "lucide-react";

interface ShadowShellProps {
  children: ReactNode;
  /** optional 320px panel rendered to the right of main content on xl+ */
  rightPanel?: ReactNode;
  /** topbar right cluster extension */
  topbarRight?: ReactNode;
  valuesVisible?: boolean;
  onToggleValues?: () => void;
}

export function ShadowShell({
  children,
  rightPanel,
  topbarRight,
  valuesVisible,
  onToggleValues,
}: ShadowShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // lock scroll when drawer open
  useEffect(() => {
    if (drawerOpen) document.body.classList.add("no-scroll");
    else document.body.classList.remove("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, [drawerOpen]);

  return (
    <div className="relative flex min-h-screen w-full bg-[#05070D] text-white">
      {/* Sidebar — desktop */}
      <div className="hidden md:block">
        <div className="sticky top-0 h-screen">
          <ShadowSidebar />
        </div>
      </div>

      {/* Sidebar — mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 animate-in slide-in-from-left duration-300">
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.05] text-white/70 hover:bg-white/[0.10]"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
            <ShadowSidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <ShadowTopbar
          onOpenSidebar={() => setDrawerOpen(true)}
          valuesVisible={valuesVisible}
          onToggleValues={onToggleValues}
          rightExtra={topbarRight}
        />

        {/* Main area + optional right panel */}
        <div
          className={`flex-1 ${
            rightPanel ? "xl:grid xl:grid-cols-[1fr_340px]" : ""
          }`}
        >
          <main className="min-w-0 px-4 pb-24 pt-6 sm:px-6 lg:px-8 md:pb-10">
            {children}
          </main>

          {rightPanel && (
            <aside
              className="hidden border-l border-white/[0.06] px-5 py-6 xl:block"
              style={{
                background:
                  "linear-gradient(180deg, rgba(8, 13, 24, 0.5) 0%, transparent 100%)",
              }}
            >
              <div className="sticky top-20">{rightPanel}</div>
            </aside>
          )}
        </div>
      </div>

      <ShadowMobileNav />
    </div>
  );
}
