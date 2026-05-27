"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Receipt,
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { ShadowMark } from "@/components/shadow/ShadowMark";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  badge?: string;
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
        { label: "Compliance", href: "/v1/finance/compliance", icon: Shield },
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

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
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
          color: "text-emerald-700 bg-emerald-100 border-emerald-200",
          dot: "bg-emerald-500",
        };
      case "PENDING":
        return {
          text: "KYC em análise",
          color: "text-sky-700 bg-sky-100 border-sky-200",
          dot: "bg-sky-500",
        };
      case "BANNED":
        return {
          text: "Conta suspensa",
          color: "text-rose-700 bg-rose-100 border-rose-200",
          dot: "bg-rose-500",
        };
      default:
        return {
          text: "KYC pendente",
          color: "text-amber-700 bg-amber-100 border-amber-200",
          dot: "bg-amber-500",
        };
    }
  })();

  const initial = (user?.companyName?.[0] || "S").toUpperCase();

  return (
    <Sidebar
      variant="inset"
      {...props}
      style={{
        ["--sidebar-width" as any]: "280px",
        ["--sidebar" as any]: "#FFFFFF",
        ["--sidebar-foreground" as any]: "#475569",
        ["--sidebar-border" as any]: "rgba(15, 23, 42, 0.08)",
      }}
    >
      <SidebarHeader
        className="px-5 py-4"
        style={{ borderBottom: "1px solid rgba(15, 23, 42, 0.06)" }}
      >
        <Link href="/v1/dashboard" className="flex items-center gap-3">
          <ShadowMark size={26} />
          <div className="flex flex-col leading-tight">
            <span
              className="text-[15px] font-bold tracking-tight"
              style={{
                fontFamily: "'Clash Display', sans-serif",
                color: "#0F172A",
              }}
            >
              ShadowPay
            </span>
            <span
              className="text-[10px] font-medium uppercase tracking-[0.18em]"
              style={{ color: "#94A3B8" }}
            >
              Financial OS
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        {groups.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            <p
              className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: "#94A3B8" }}
            >
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  router.pathname === item.href ||
                  router.asPath === item.href ||
                  (item.href !== "/v1/dashboard" &&
                    router.pathname.startsWith(item.href));

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors"
                      style={{
                        color: active ? "#0F172A" : "#475569",
                        background: active
                          ? "rgba(124, 58, 237, 0.08)"
                          : "transparent",
                      }}
                    >
                      {active && (
                        <motion.span
                          layoutId="appsb-active-indicator"
                          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full"
                          style={{
                            background: "linear-gradient(180deg, #7C3AED 0%, #6D28D9 100%)",
                          }}
                        />
                      )}
                      <Icon
                        className="h-4 w-4 shrink-0 transition-colors"
                        style={{ color: active ? "#7C3AED" : "#94A3B8" }}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className="ml-auto rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                          style={
                            item.badge === "AI"
                              ? {
                                  borderColor: "rgba(6, 182, 212, 0.30)",
                                  background: "rgba(6, 182, 212, 0.10)",
                                  color: "#0891B2",
                                }
                              : {
                                  borderColor: "rgba(245, 158, 11, 0.30)",
                                  background: "rgba(245, 158, 11, 0.10)",
                                  color: "#B45309",
                                }
                          }
                        >
                          {item.badge}
                        </span>
                      )}
                      {active && (
                        <ChevronRight
                          className="h-3.5 w-3.5"
                          style={{ color: "rgba(124, 58, 237, 0.5)" }}
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </SidebarContent>

      <SidebarFooter
        className="p-3"
        style={{ borderTop: "1px solid rgba(15, 23, 42, 0.06)" }}
      >
        <div
          className="rounded-xl p-3"
          style={{
            background: "#F8FAFC",
            border: "1px solid rgba(15, 23, 42, 0.06)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)",
              }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-xs font-semibold"
                style={{ color: "#0F172A" }}
              >
                {user?.companyName || "Operador"}
              </p>
              <p className="truncate text-[10px]" style={{ color: "#94A3B8" }}>
                {user?.email || "—"}
              </p>
            </div>
          </div>
          <div
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${kycPill.color}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${kycPill.dot}`} />
            {kycPill.text}
          </div>
        </div>

        <a
          href="https://wa.me/559991519044?text=Ol%C3%A1%20preciso%20de%20ajuda%20com%20a%20ShadowPay."
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-medium transition-colors hover:opacity-80"
          style={{
            background: "#F8FAFC",
            border: "1px solid rgba(15, 23, 42, 0.06)",
            color: "#475569",
          }}
        >
          <LifeBuoy className="h-3.5 w-3.5" />
          Suporte rápido
        </a>
      </SidebarFooter>
    </Sidebar>
  );
}
