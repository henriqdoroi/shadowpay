"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Package,
  Receipt,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  Shield,
  KeyRound,
  Webhook,
  Percent,
  UserCircle2,
  IdCard,
  Sparkles,
  ShieldCheck,
  Users,
  Activity,
  Building2,
  Settings,
  LifeBuoy,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ShadowMark } from "./ShadowMark";
import { motion } from "framer-motion";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  external?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

function buildNav(isAdmin: boolean): NavGroup[] {
  const base: NavGroup[] = [
    {
      label: "Command Center",
      items: [
        { label: "Dashboard", href: "/v1/dashboard", icon: LayoutDashboard },
        { label: "Shadow AI", href: "/shadow", icon: Sparkles, badge: "AI" },
      ],
    },
    {
      label: "Vendas",
      items: [
        { label: "Produtos", href: "/v1/products", icon: Package },
        { label: "Pedidos", href: "/v1/products/sales", icon: Receipt },
        {
          label: "Recebimentos",
          href: "/v1/finance/recivements",
          icon: ArrowDownToLine,
        },
        {
          label: "Saques",
          href: "/v1/finance/withdraw",
          icon: ArrowUpFromLine,
        },
      ],
    },
    {
      label: "Inteligência",
      items: [
        { label: "Relatórios", href: "/v1/reports", icon: BarChart3 },
        {
          label: "Compliance",
          href: "/v1/finance/compliance",
          icon: Shield,
        },
      ],
    },
    {
      label: "Integrações",
      items: [
        { label: "API Keys", href: "/v1/configs/apikey", icon: KeyRound },
        { label: "Webhooks", href: "/v1/configs/webhook", icon: Webhook },
        { label: "Taxas", href: "/v1/configs/fee", icon: Percent },
      ],
    },
    {
      label: "Conta",
      items: [
        { label: "Perfil", href: "/v1/configs/profile", icon: UserCircle2 },
        { label: "KYC", href: "/v1/kyc", icon: IdCard },
      ],
    },
  ];

  if (isAdmin) {
    base.push({
      label: "Admin",
      items: [
        { label: "Painel", href: "/v2/manager", icon: ShieldCheck },
        { label: "Sellers", href: "/v2/manager/users", icon: Users },
        {
          label: "Transações",
          href: "/v2/manager/transactions",
          icon: Activity,
        },
        {
          label: "Adquirentes",
          href: "/v2/manager/adquerers",
          icon: Building2,
        },
        {
          label: "Saques admin",
          href: "/v2/manager/withdraw",
          icon: ArrowUpFromLine,
        },
        { label: "PSP Keys", href: "/v2/manager/psp-key", icon: Settings },
      ],
    });
  }

  return base;
}

export function ShadowSidebar({
  onNavigate,
}: {
  /** mobile drawer close callback */
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const groups = buildNav(!!user?.isAdministrator);

  const kycStatus = (user as any)?.kycStatus as
    | "NOT_STARTED"
    | "PENDING"
    | "APPROVED"
    | "BANNED"
    | undefined;

  const kycPill = (() => {
    switch (kycStatus) {
      case "APPROVED":
        return {
          text: "KYC verificado",
          color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
          dot: "bg-emerald-400",
        };
      case "PENDING":
        return {
          text: "KYC em análise",
          color: "text-sky-300 bg-sky-500/10 border-sky-500/20",
          dot: "bg-sky-400",
        };
      case "BANNED":
        return {
          text: "Conta suspensa",
          color: "text-rose-300 bg-rose-500/10 border-rose-500/20",
          dot: "bg-rose-400",
        };
      default:
        return {
          text: "KYC pendente",
          color: "text-amber-300 bg-amber-500/10 border-amber-500/20",
          dot: "bg-amber-400",
        };
    }
  })();

  return (
    <aside
      className="relative flex h-screen w-[280px] shrink-0 flex-col overflow-hidden border-r border-white/[0.06]"
      style={{
        background:
          "linear-gradient(180deg, rgba(8, 13, 24, 0.92) 0%, rgba(5, 7, 13, 0.96) 100%)",
        backdropFilter: "blur(30px) saturate(120%)",
      }}
    >
      {/* edge violet glow */}
      <div
        className="pointer-events-none absolute -left-px top-1/4 h-1/2 w-px"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(124, 58, 237, 0.6) 50%, transparent 100%)",
        }}
      />

      {/* Brand */}
      <Link
        href="/v1/dashboard"
        onClick={onNavigate}
        className="group relative flex h-16 items-center gap-3 border-b border-white/[0.05] px-5"
      >
        <ShadowMark size={26} />
        <div className="flex flex-col leading-tight">
          <span
            className="text-[15px] font-bold tracking-tight text-white"
            style={{ fontFamily: "'Clash Display', sans-serif" }}
          >
            ShadowPay
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
            Financial OS
          </span>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  router.pathname === item.href ||
                  router.asPath === item.href ||
                  (item.href !== "/v1/dashboard" &&
                    item.href !== "/" &&
                    router.pathname.startsWith(item.href));

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className="group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors"
                      style={{
                        color: active ? "#F8FAFC" : "#A4ACBE",
                        background: active
                          ? "linear-gradient(90deg, rgba(124, 58, 237, 0.12), rgba(124, 58, 237, 0) 80%)"
                          : "transparent",
                      }}
                    >
                      {/* Active left indicator */}
                      {active && (
                        <motion.span
                          layoutId="shadow-active-indicator"
                          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full"
                          style={{
                            background:
                              "linear-gradient(180deg, #A855F7 0%, #7C3AED 100%)",
                            boxShadow: "0 0 12px rgba(124, 58, 237, 0.6)",
                          }}
                        />
                      )}

                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          active
                            ? "text-violet-300"
                            : "text-white/45 group-hover:text-white/70"
                        }`}
                      />
                      <span className="flex-1 truncate group-hover:text-white">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={`ml-auto rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            item.badge === "AI"
                              ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {active && (
                        <ChevronRight className="h-3.5 w-3.5 text-violet-300/50" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer: status + support */}
      <div className="border-t border-white/[0.05] p-3">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{
                background:
                  "linear-gradient(135deg, #7C3AED 0%, #22D3EE 100%)",
              }}
            >
              {(user?.companyName?.[0] || "S").toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">
                {user?.companyName || "Operador"}
              </p>
              <p className="truncate text-[10px] text-white/45">
                {user?.email || "—"}
              </p>
            </div>
          </div>
          <div
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${kycPill.color}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${kycPill.dot} shadow-pulse-dot`} />
            {kycPill.text}
          </div>
        </div>

        <a
          href="https://wa.me/559991519044?text=Ol%C3%A1%20preciso%20de%20ajuda%20com%20a%20ShadowPay."
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] py-1.5 text-[11px] font-medium text-white/55 transition-colors hover:bg-white/[0.05] hover:text-white"
        >
          <LifeBuoy className="h-3.5 w-3.5" />
          Suporte rápido
        </a>
      </div>
    </aside>
  );
}
