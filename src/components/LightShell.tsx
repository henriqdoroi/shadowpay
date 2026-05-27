"use client";

import { ReactNode, useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ShadowLogo } from "@/components/shadow/ShadowLogo";
import {
  Search,
  Bell,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  LayoutDashboard,
  Package,
  Receipt,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  Megaphone,
  Workflow,
  Sparkles,
  Webhook as WebhookIcon,
  Code,
  Target,
  Globe,
  UserCircle2,
  Shield,
  BellRing,
  LifeBuoy,
  ShieldCheck,
  LogOut,
  Eye,
  EyeOff,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  Activity,
  Building2,
  Settings,
} from "lucide-react";

const T = {
  text: "#0F172A",
  text2: "#475569",
  textMuted: "#94A3B8",
  primary: "#7C3AED",
  primaryBg: "rgba(124, 58, 237, 0.08)",
  border: "rgba(15, 23, 42, 0.06)",
};

interface LightShellProps {
  children: ReactNode;
  /** "eye" toggle in the topbar to mask currency values */
  valuesVisible?: boolean;
  onToggleValues?: () => void;
}

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
};
type NavGroup = { label: string; items: NavItem[] };

function buildNav(isAdmin: boolean): NavGroup[] {
  const groups: NavGroup[] = [
    {
      label: "Command Center",
      items: [
        { label: "Dashboard", href: "/v1/dashboard", icon: LayoutDashboard },
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
        { label: "Campanhas", href: "/v1/campaigns", icon: Megaphone },
        { label: "Automação", href: "/v1/automation", icon: Workflow },
        { label: "Shadow AI", href: "/shadow", icon: Sparkles },
      ],
    },
    {
      label: "Integrações",
      items: [
        { label: "Webhooks", href: "/v1/configs/webhook", icon: WebhookIcon },
        { label: "API & Docs", href: "/v1/configs/apikey", icon: Code },
        {
          label: "Pixels",
          href: "/v1/integrations/pixels",
          icon: Target,
        },
        {
          label: "Domínios",
          href: "/v1/integrations/domains",
          icon: Globe,
        },
      ],
    },
    {
      label: "Configurações",
      items: [
        { label: "Conta", href: "/v1/configs/profile", icon: UserCircle2 },
        {
          label: "Segurança",
          href: "/v1/configs/security",
          icon: Shield,
        },
        {
          label: "Notificações",
          href: "/v1/configs/notifications",
          icon: BellRing,
        },
      ],
    },
  ];

  if (isAdmin) {
    groups.push({
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

  return groups;
}

export function LightShell({
  children,
  valuesVisible,
  onToggleValues,
}: LightShellProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const sidebarWidth = sidebarCollapsed ? 76 : 260;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("shadowpay:sidebarCollapsed");
    if (saved === "true") setSidebarCollapsed(true);
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      "shadowpay:sidebarCollapsed",
      String(sidebarCollapsed)
    );
  }, [sidebarCollapsed]);

  const nav = buildNav(!!user?.isAdministrator);
  const initial = (user?.companyName?.[0] || "S").toUpperCase();

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
          color: "text-emerald-700 bg-emerald-50",
        };
      case "PENDING":
        return { text: "KYC em análise", color: "text-sky-700 bg-sky-50" };
      case "BANNED":
        return { text: "Conta suspensa", color: "text-rose-700 bg-rose-50" };
      default:
        return {
          text: "KYC pendente",
          color: "text-amber-700 bg-amber-50",
        };
    }
  })();

  return (
    <div
      className="relative flex min-h-screen w-full"
      style={{
        background: "#F1F3F8",
        color: T.text,
        fontFamily: "'Satoshi', 'Inter', sans-serif",
      }}
    >
      {/* ============================================================
          SIDEBAR
          ============================================================ */}
      <aside
        className="sticky top-0 z-30 hidden h-screen shrink-0 flex-col md:flex"
        style={{
          width: sidebarWidth,
          background: "#F1F3F8",
          transition: "width 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* Brand */}
        <Link
          href="/v1/dashboard"
          className="relative flex flex-col items-center gap-2 px-4 py-5"
          style={{ minHeight: 120 }}
        >
          <ShadowLogo size={sidebarCollapsed ? 56 : 110} />
          {!sidebarCollapsed && (
            <div className="text-center leading-tight">
              <div
                className="text-[13px] font-bold tracking-[0.18em] text-slate-700"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                SHADOWPAY
              </div>
              <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.30em] text-slate-400">
                Financial OS
              </div>
            </div>
          )}
        </Link>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {nav.map((group) => (
            <div key={group.label} className="mb-5 last:mb-0">
              {!sidebarCollapsed && (
                <p
                  className="px-3 pb-2 text-[9.5px] font-bold uppercase tracking-[0.20em]"
                  style={{ color: T.textMuted }}
                >
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = router.pathname === item.href;
                  return (
                    <li key={`${group.label}-${item.label}`}>
                      <Link
                        href={item.href}
                        title={sidebarCollapsed ? item.label : undefined}
                        className="group flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-colors"
                        style={{
                          padding: sidebarCollapsed ? "10px" : "8px 12px",
                          justifyContent: sidebarCollapsed
                            ? "center"
                            : "flex-start",
                          background: active ? T.primaryBg : "transparent",
                          color: active ? T.primary : T.text2,
                        }}
                      >
                        <Icon
                          className="h-4 w-4 shrink-0"
                          style={{
                            color: active ? T.primary : T.textMuted,
                          }}
                        />
                        {!sidebarCollapsed && (
                          <span className="flex-1 truncate">{item.label}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="px-3 pb-3">
          {!sidebarCollapsed ? (
            <>
              <div
                className="rounded-xl p-3"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(15,23,42,0.06)",
                  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{
                      background:
                        "linear-gradient(135deg, #7C3AED 0%, #22D3EE 100%)",
                    }}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-slate-900">
                      {user?.companyName || "Operador"}
                    </p>
                    <p className="truncate text-[10px] text-slate-500">
                      Seller Bronze
                    </p>
                  </div>
                </div>
                <div
                  className={`mt-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${kycPill.color}`}
                >
                  <ShieldCheck className="h-2.5 w-2.5" />
                  {kycPill.text}
                </div>
                <p className="mt-2 text-[10px] text-slate-500">
                  Próximo repasse{" "}
                  <span className="font-semibold text-slate-700">
                    25 Mai 2026
                  </span>
                </p>
              </div>

              <a
                href="https://wa.me/559991519044?text=Ol%C3%A1%20preciso%20de%20ajuda%20com%20a%20ShadowPay."
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-medium text-slate-500 transition-colors hover:bg-white hover:text-slate-700"
              >
                <LifeBuoy className="h-3.5 w-3.5" />
                Suporte 24/7
              </a>
            </>
          ) : (
            <div
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{
                background:
                  "linear-gradient(135deg, #7C3AED 0%, #22D3EE 100%)",
              }}
              title={user?.companyName || "Operador"}
            >
              {initial}
            </div>
          )}
        </div>
      </aside>

      {/* ============================================================
          MAIN COLUMN
          ============================================================ */}
      <div
        className="relative flex min-h-screen min-w-0 flex-1 flex-col"
        style={{
          background: "#FFFFFF",
          boxShadow:
            "-12px 0 28px -16px rgba(15, 23, 42, 0.10), -2px 0 8px rgba(15, 23, 42, 0.05)",
        }}
      >
        {/* Toggle button */}
        <button
          onClick={() => setSidebarCollapsed((v) => !v)}
          className="absolute top-7 z-40 hidden h-7 w-7 items-center justify-center rounded-full transition-all hover:scale-110 md:flex"
          style={{
            left: -14,
            background: "#FFFFFF",
            border: "1px solid rgba(15,23,42,0.08)",
            boxShadow: "0 2px 6px rgba(15,23,42,0.10)",
            color: "#475569",
          }}
          aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-3.5 w-3.5" />
          ) : (
            <PanelLeftClose className="h-3.5 w-3.5" />
          )}
        </button>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* ============================================================
              TOPBAR
              ============================================================ */}
          <header
            className="sticky top-0 z-40 flex h-16 items-center gap-3 px-4 md:px-8"
            style={{
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(12px)",
              borderBottom: `1px solid ${T.border}`,
            }}
          >
            <div className="max-w-2xl flex-1">
              <div
                className="group relative flex h-10 items-center rounded-xl px-3"
                style={{
                  background: "#F1F2F6",
                  border: `1px solid ${T.border}`,
                }}
              >
                <Search className="mr-2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar, criar produto, abrir checkout..."
                  className="flex-1 bg-transparent text-[13px] text-slate-700 placeholder-slate-400 outline-none"
                />
                <kbd
                  className="ml-2 hidden items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[10px] sm:flex"
                  style={{
                    background: "white",
                    border: `1px solid ${T.border}`,
                    color: T.text2,
                  }}
                >
                  Ctrl K
                </kbd>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/shadow"
                className="hidden h-9 items-center gap-2 rounded-xl px-3 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:flex"
                style={{ border: `1px solid ${T.border}` }}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Shadow online
                <svg
                  width="44"
                  height="14"
                  viewBox="0 0 44 14"
                  className="ml-1"
                  fill="none"
                >
                  <path
                    d="M0 7 L8 7 L10 3 L14 11 L18 5 L22 9 L26 4 L30 8 L34 7 L44 7"
                    stroke={T.primary}
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>

              {onToggleValues && (
                <button
                  onClick={onToggleValues}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                  style={{ border: `1px solid ${T.border}` }}
                  aria-label="Alternar valores"
                >
                  {valuesVisible ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
              )}

              <a
                href="https://wa.me/559991519044?text=Ol%C3%A1%20preciso%20de%20ajuda%20com%20a%20ShadowPay."
                target="_blank"
                rel="noreferrer"
                className="hidden h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 sm:flex"
                style={{ border: `1px solid ${T.border}` }}
              >
                <MessageCircle className="h-4 w-4" />
              </a>
              <button
                className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                style={{ border: `1px solid ${T.border}` }}
              >
                <Bell className="h-4 w-4" />
                <span
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ background: T.primary }}
                >
                  3
                </span>
              </button>
              <button
                className="hidden h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 sm:flex"
                style={{ border: `1px solid ${T.border}` }}
              >
                <HelpCircle className="h-4 w-4" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex h-10 items-center gap-2 rounded-xl pl-1 pr-3 transition-colors hover:bg-slate-50"
                  style={{ border: `1px solid ${T.border}` }}
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{
                      background:
                        "linear-gradient(135deg, #7C3AED 0%, #22D3EE 100%)",
                    }}
                  >
                    {initial}
                  </div>
                  <div className="hidden text-left leading-tight md:block">
                    <p className="text-[12px] font-semibold text-slate-800">
                      {(user?.companyName || "Operador").slice(0, 16)}
                    </p>
                    <p className="text-[10px] text-slate-500">Seller Bronze</p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div
                      className="absolute right-0 top-12 z-40 w-48 overflow-hidden rounded-xl bg-white p-1.5 shadow-xl"
                      style={{ border: `1px solid ${T.border}` }}
                    >
                      {now && (
                        <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-400">
                          {new Intl.DateTimeFormat("pt-BR", {
                            weekday: "long",
                            day: "2-digit",
                            month: "short",
                          }).format(now)}
                        </p>
                      )}
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          router.push("/v1/configs/profile");
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        <UserCircle2 className="h-3.5 w-3.5" />
                        Perfil
                      </button>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-500 hover:bg-rose-50"
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

          {/* ============================================================
              MAIN
              ============================================================ */}
          <main className="px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
