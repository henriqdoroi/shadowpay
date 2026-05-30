"use client";

/**
 * Tabs do agrupamento "Perfil" — tema dark glassy violeta.
 *
 * Aparece no topo de /v1/configs/profile, /security, /notifications,
 * /v1/kyc, /v1/configs/integrations e /v1/configs/split.
 */
import Link from "next/link";
import { useRouter } from "next/router";
import {
  User,
  FileText,
  Bell,
  Code2,
  GitBranch,
  ShieldCheck,
} from "lucide-react";

const TABS = [
  { label: "MINHA CONTA", href: "/v1/configs/profile", icon: User },
  {
    label: "DOCUMENTOS",
    href: "/v1/kyc",
    icon: FileText,
    matches: ["/v1/kyc/"],
  },
  {
    label: "NOTIFICAÇÕES",
    href: "/v1/configs/notifications",
    icon: Bell,
  },
  {
    label: "INTEGRAÇÕES",
    href: "/v1/configs/integrations",
    icon: Code2,
  },
  {
    label: "SPLIT",
    href: "/v1/configs/split",
    icon: GitBranch,
  },
  {
    label: "SEGURANÇA",
    href: "/v1/configs/security",
    icon: ShieldCheck,
  },
];

export function ProfileTabs() {
  const router = useRouter();
  const isActive = (href: string, matches?: string[]) => {
    if (router.pathname === href) return true;
    return matches?.some((m) => router.pathname.startsWith(m)) ?? false;
  };

  return (
    <div className="mb-6 flex w-full justify-center overflow-x-auto">
      <div
        className="inline-flex items-center gap-1 rounded-2xl p-1.5"
        style={{
          background: "rgba(15, 11, 28, 0.85)",
          border: "1px solid rgba(139, 92, 246, 0.18)",
          boxShadow:
            "0 0 0 1px rgba(139,92,246,0.05), 0 18px 48px -16px rgba(139,92,246,0.25)",
        }}
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = isActive(t.href, t.matches);
          return (
            <Link
              key={t.href}
              href={t.href}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] transition-all duration-200 whitespace-nowrap"
              style={
                active
                  ? {
                      background:
                        "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
                      color: "#FFFFFF",
                      boxShadow:
                        "0 0 0 1px rgba(139,92,246,0.5), 0 8px 24px -8px rgba(139,92,246,0.55)",
                    }
                  : {
                      background: "transparent",
                      color: "#94A3B8",
                    }
              }
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
