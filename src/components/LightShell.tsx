"use client";

import { ReactNode, useState, useEffect, useMemo, type CSSProperties } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search,
  Bell,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Package,
  Wallet,
  ArrowUpFromLine,
  ShieldAlert,
  BarChart3,
  LineChart,
  Receipt,
  Plug,
  Building2,
  Megaphone,
  Workflow,
  Settings,
  Code,
  Target,
  Globe,
  UserCircle2,
  Shield,
  BellRing,
  Percent,
  IdCard,
  ShieldCheck,
  LogOut,
  Eye,
  EyeOff,
  MoreHorizontal,
  Headphones,
  ListCollapse,
  Users,
  Activity,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";

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
  children?: NavItem[];
  /** rotas extras que também marcam esse item como ativo */
  alsoMatches?: string[];
};
type NavGroup = { label: string; items: NavItem[] };

/* Ícone do PIX (4 setas em pinwheel, estilo da marca) — serve como indicador
   do método PIX no menu. Usa currentColor pra herdar a cor do item. */
function PixIcon({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path d="M13.2 4.8 L19.2 4.8 L19.2 10.8 L16.2 7.8 Z" />
      <path d="M19.2 13.2 L19.2 19.2 L13.2 19.2 L16.2 16.2 Z" />
      <path d="M10.8 19.2 L4.8 19.2 L4.8 13.2 L7.8 16.2 Z" />
      <path d="M4.8 10.8 L4.8 4.8 L10.8 4.8 L7.8 7.8 Z" />
    </svg>
  );
}

/* Menu em LISTA ÚNICA (flat), sem seções — estilo FlevoPay/BravoPay.
   Removidos: Relatórios, UTMs, Tracking, Pixels (pixel agora fica dentro
   do produto). "Vendas" virou "Transações"; "Adquirentes" virou "Nominal". */
function buildNav(isAdmin: boolean): NavItem[] {
  const items: NavItem[] = [
    { label: "Dashboard", href: "/v1/dashboard", icon: LayoutDashboard },
    { label: "Transações", href: "/v1/products/sales", icon: Receipt },
    { label: "Financeiro", href: "/v1/finance", icon: Wallet },
    { label: "Produtos", href: "/v1/products", icon: Package },
    { label: "Domínios", href: "/v1/integrations/domains", icon: Globe },
    { label: "Integrações", href: "/v1/integrations", icon: Plug },
    {
      label: "Nominal",
      href: isAdmin ? "/v2/manager/adquerers" : "/v1/integrations/acquirers",
      icon: PixIcon,
    },
    { label: "Automações", href: "/v1/automation", icon: Workflow },
    { label: "API & Docs", href: "/v1/configs/apikey", icon: Code },
  ];

  if (isAdmin) {
    items.push(
      { label: "Painel", href: "/v2/manager", icon: ShieldCheck },
      { label: "Sellers", href: "/v2/manager/users", icon: Users },
      { label: "Todas transações", href: "/v2/manager/transactions", icon: Activity },
      { label: "Saques admin", href: "/v2/manager/withdraw", icon: ArrowUpFromLine },
      { label: "PSP Keys", href: "/v2/manager/psp-key", icon: Settings },
    );
  }

  return items;
}

/* Active-state matcher: exact or descendant path (with /v1/products excluded
   from matching /v1/products/sales since they belong to different sections now). */
function isActive(pathname: string, href: string, alsoMatches: string[] = []): boolean {
  if (pathname === href) return true;
  if (alsoMatches.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  if (href === "/v1/products") return false; // grupo Produtos NÃO casa com /v1/products/sales (Vendas)
  if (href === "/v1/dashboard") return false;
  if (href === "/v1/finance") {
    // /v1/finance/withdraw etc. ainda existe como redirect — marca o nav.
    return pathname.startsWith("/v1/finance");
  }
  return pathname.startsWith(href + "/");
}

/**
 * Logo da marca na sidebar — renderizada como CSS `background-image`
 * (NUNCA um `<img>`). Seleção, arraste, long-press (iOS) e menu de contexto
 * ficam bloqueados, então o caminho casual de "salvar imagem" não existe:
 * pra quem olha, parece feita no código. (DevTools ainda enxerga a URL —
 * é impossível esconder 100% no client — mas ninguém "pega" a logo clicando.)
 */
function BrandLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      role="img"
      aria-label="ShadowPay"
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      className="pointer-events-auto select-none"
      style={
        {
          width: collapsed ? 40 : 178,
          height: collapsed ? 40 : 48,
          backgroundImage: `url(${collapsed ? "/logoshadowpay.png" : "/logo-menu-white.jpg"})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          // white-bg JPEG some sem deixar retângulo no menu branco
          mixBlendMode: "multiply",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
          WebkitUserDrag: "none",
          transition: "width 0.22s cubic-bezier(0.22,1,0.36,1)",
        } as CSSProperties
      }
    />
  );
}

export function LightShell({
  children,
  valuesVisible,
  onToggleValues,
}: LightShellProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [footerMenuOpen, setFooterMenuOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const sidebarWidth = sidebarCollapsed ? 76 : 260;

  // Evita mismatch hidratação no botão de tema
  useEffect(() => setMounted(true), []);
  const isDark = mounted && (resolvedTheme || theme) === "dark";

  // Fecha o drawer mobile quando troca de rota
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.pathname]);

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

  const nav = useMemo(
    () => buildNav(!!user?.isAdministrator),
    [user?.isAdministrator]
  );

  const toggleExpanded = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const initial = (user?.companyName?.[0] || "S").toUpperCase();


  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        background: "#F1F3F8",
        color: T.text,
        fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {/* ============================================================
          SIDEBAR (FIXED — never scrolls com o conteúdo)
          ============================================================ */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden flex-col md:flex"
        style={{
          width: sidebarWidth,
          background: "#FFFFFF",
          borderRight: "1px solid #E6E8EB",
          transition: "width 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* Brand — logo protegida (CSS background, sem <img>, não selecionável) */}
        <Link
          href="/v1/dashboard"
          className="relative flex items-center justify-center px-4 py-5"
          style={{ minHeight: 78 }}
        >
          <BrandLogo collapsed={sidebarCollapsed} />
        </Link>

        {/* Nav — lista única (flat), sem seções */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-0.5">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = isActive(
                router.pathname,
                item.href,
                item.alsoMatches
              );
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={sidebarCollapsed ? item.label : undefined}
                    className="group flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-colors"
                    style={{
                      padding: sidebarCollapsed ? "10px" : "8px 12px",
                      justifyContent: sidebarCollapsed ? "center" : "flex-start",
                      background: active ? T.primaryBg : "transparent",
                      color: active ? T.primary : T.text2,
                    }}
                  >
                    <Icon
                      className="h-4 w-4 shrink-0"
                      style={{ color: active ? T.primary : T.textMuted }}
                    />
                    {!sidebarCollapsed && (
                      <span className="flex-1 truncate">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ===== Footer estilo SyncPay (perfil + ••• + Compactar) ===== */}
        <div className="mt-auto px-3 pb-3">
          <div className="relative">
            {/* Menu do ••• (abre pra cima) */}
            {footerMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setFooterMenuOpen(false)}
                />
                <div
                  className="absolute bottom-full left-0 z-50 mb-2 w-[212px] overflow-hidden rounded-xl bg-white py-1"
                  style={{
                    border: "1px solid rgba(15,23,42,0.08)",
                    boxShadow: "0 16px 40px rgba(15,23,42,0.18)",
                  }}
                >
                  <a
                    href="https://wa.me/559991519044?text=Ol%C3%A1%20preciso%20de%20ajuda%20com%20a%20ShadowPay."
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setFooterMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <Headphones className="h-[18px] w-[18px] text-slate-500" />
                    Suporte
                  </a>
                  <Link
                    href="/v1/configs/profile"
                    onClick={() => setFooterMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <UserCircle2 className="h-[18px] w-[18px] text-slate-500" />
                    Perfil
                  </Link>
                  <button
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                    className="flex w-full items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <Moon className="h-[18px] w-[18px] text-slate-500" />
                    <span className="flex-1 text-left">Modo claro</span>
                    <span
                      className="relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full transition-colors"
                      style={{ background: isDark ? "#7C3AED" : "#CBD5E1" }}
                    >
                      <span
                        className="absolute h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform"
                        style={{
                          transform: isDark
                            ? "translateX(16px)"
                            : "translateX(2px)",
                        }}
                      />
                    </span>
                  </button>
                  <div className="mx-2 my-1 h-px bg-slate-100" />
                  <button
                    onClick={() => {
                      setFooterMenuOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <LogOut className="h-[18px] w-[18px] text-slate-500" />
                    Sair
                  </button>
                </div>
              </>
            )}

            {/* Linha do perfil */}
            {!sidebarCollapsed ? (
              <div
                className={`flex items-center gap-2 rounded-lg px-1 py-1 transition-colors ${
                  footerMenuOpen ? "bg-slate-50" : ""
                }`}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white"
                  style={{ background: "#7C3AED" }}
                >
                  {initial}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-slate-800">
                  {user?.companyName || "Operador"}
                </span>
                <button
                  onClick={() => setFooterMenuOpen((v) => !v)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-700"
                  aria-label="Mais opções"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setFooterMenuOpen((v) => !v)}
                className="mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold text-white"
                style={{ background: "#7C3AED" }}
                title={user?.companyName || "Operador"}
                aria-label="Conta"
              >
                {initial}
              </button>
            )}
          </div>

          {/* Divisor + Compactar (recolher menu) */}
          <div className="my-2 h-px" style={{ background: "rgba(15,23,42,0.06)" }} />
          <button
            onClick={() => setSidebarCollapsed((v) => !v)}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
            title={sidebarCollapsed ? "Expandir menu" : "Compactar menu"}
          >
            <ListCollapse className="h-[18px] w-[18px] shrink-0" />
            {!sidebarCollapsed && <span>Compactar</span>}
          </button>
        </div>
      </aside>

      {/* ============================================================
          DRAWER MOBILE — mesma sidebar mas como overlay (slide da esquerda)
          ============================================================ */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(2px)" }}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-72 flex-col"
            style={{
              background: "#FFFFFF",
              boxShadow: "12px 0 32px rgba(15,23,42,0.15)",
            }}
          >
            {/* Header drawer */}
            <div className="flex items-center justify-between px-4 py-4">
              <Link
                href="/v1/dashboard"
                className="flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <BrandLogo collapsed={false} />
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 pb-4">
              <ul className="space-y-0.5">
                {nav.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(
                    router.pathname,
                    item.href,
                    item.alsoMatches
                  );
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13.5px] font-medium"
                        style={{
                          background: active ? T.primaryBg : "transparent",
                          color: active ? T.primary : T.text2,
                        }}
                      >
                        <Icon
                          className="h-4 w-4 shrink-0"
                          style={{ color: active ? T.primary : T.textMuted }}
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* footer logout */}
            <div className="border-t px-3 py-3" style={{ borderColor: T.border }}>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-rose-500 hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ============================================================
          MAIN COLUMN — shifts pra direita da sidebar fixa
          ============================================================ */}
      <div
        className="relative flex min-h-screen min-w-0 flex-col md:ml-[var(--sidebar-w)]"
        style={
          {
            ["--sidebar-w" as any]: `${sidebarWidth}px`,
            transition: "margin-left 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
            background: "#FFFFFF",
            boxShadow:
              "-12px 0 28px -16px rgba(15, 23, 42, 0.10), -2px 0 8px rgba(15, 23, 42, 0.05)",
          } as React.CSSProperties
        }
      >
        {/* (toggle de recolher agora é o botão "Compactar" no rodapé da sidebar) */}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* ============================================================
              TOPBAR
              ============================================================ */}
          <header
            className="sticky top-0 z-40 flex h-16 items-center gap-3 px-3 md:px-8"
            style={{
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(12px)",
              borderBottom: `1px solid ${T.border}`,
            }}
          >
            {/* Hamburger mobile */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
              style={{ border: `1px solid ${T.border}` }}
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden max-w-2xl flex-1 sm:block">
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

              {/* Toggle tema (sol/lua) */}
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-slate-50"
                style={{
                  border: `1px solid ${T.border}`,
                  color: isDark ? "#94A3B8" : "#F59E0B",
                }}
                aria-label="Alternar tema"
                title={isDark ? "Mudar para claro" : "Mudar para escuro"}
              >
                {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
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
                        "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)",
                    }}
                  >
                    {initial}
                  </div>
                  <div className="hidden text-left leading-tight md:block">
                    <p className="text-[12px] font-semibold text-slate-800">
                      {(user?.companyName || "Operador").slice(0, 16)}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {user?.isAdministrator ? "Administrador" : "Seller Bronze"}
                    </p>
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
          {/* Conteúdo centralizado com max-width (igual FlevoPay: 1400px),
              deixando as margens laterais em telas largas. */}
          <main className="px-3 py-5 sm:px-4 sm:py-6 md:px-8 md:py-8 pb-24 md:pb-8">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
