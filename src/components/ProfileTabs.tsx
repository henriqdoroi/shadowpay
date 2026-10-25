"use client";

/**
 * Atalhos da área "Minha conta" no topo da verificação (/v1/kyc).
 * Perfil e Notificações são abas de /v1/configs/profile.
 */
import Link from "next/link";
import { useRouter } from "next/router";
import { UserCircle2, BellRing, IdCard } from "lucide-react";

const TABS = [
  { label: "Perfil", href: "/v1/configs/profile", icon: UserCircle2 },
  { label: "Notificações", href: "/v1/configs/profile?tab=notificacoes", icon: BellRing },
  {
    label: "Verificação",
    href: "/v1/kyc",
    icon: IdCard,
    matches: ["/v1/kyc/"],
  },
];

export function ProfileTabs() {
  const router = useRouter();
  const isActive = (href: string, matches?: string[]) => {
    if (router.pathname === href) return true;
    return matches?.some((m) => router.pathname.startsWith(m)) ?? false;
  };

  return (
    <div className="mb-6 w-full sm:flex sm:justify-center">
      <div
        className="grid w-full grid-cols-3 gap-0.5 rounded-xl p-1 sm:inline-flex sm:w-auto sm:items-center sm:gap-1 sm:p-1.5"
        style={{
          background: "#FFFFFF",
          border: "1px solid #ECECF0",
        }}
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = isActive(t.href, t.matches);
          return (
            <Link
              key={t.href}
              href={t.href}
              className="flex min-w-0 items-center justify-center gap-1 overflow-hidden rounded-xl px-1.5 py-2 text-[11px] font-semibold transition-colors sm:gap-2 sm:px-5 sm:text-[13px]"
              style={{
                background: active ? "rgba(124,58,237,0.08)" : "transparent",
                color: active ? "#7C3AED" : "#475569",
              }}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span className="truncate">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
