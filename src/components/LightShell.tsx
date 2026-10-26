"use client";

import { ReactNode, useState, useEffect, useMemo, type CSSProperties } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationsBell } from "@/components/NotificationsBell";
import { InstallAppButton } from "@/components/InstallAppButton";
import {
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
  Code,
  Target,
  Globe,
  UserCircle2,
  Shield,
  BellRing,
  KeyRound,
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
import { useValuesVisible } from "@/lib/useValuesVisible";

/* Painel em UMA superfície só (menu, topo e conteúdo sem linhas dividindo).
   Impacto no estilo dos gateways de referência (BravoPay, Lovy Bot,
   InvictusPay): uma cor só — o roxo da marca — com brilho no saldo e no item
   ativo. O brilho fica em classes (panel.css), não em estilo inline. */
const T = {
  surface: "#FFFFFF",
  text: "#111827",
  text2: "#4B5563",
  textMuted: "#9CA3AF",
  primary: "#7C3AED",
  brandGradient: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
  quietBg: "#F6F6F8",
  border: "#ECECF0",
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

/* Ícone do PIX (logo oficial) — indicador do método PIX no menu.
   Usa currentColor pra herdar a cor do item. */
function PixIcon({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path d="M242.4 292.5c5.4-5.4 14.7-5.4 20.1 0l77 77c14.2 14.2 33.1 22 53.1 22h15.1l-97.1 97.1c-30.3 30.3-79.5 30.3-109.8 0l-97.5-97.5h9.3c20 0 38.9-7.8 53.1-22l76.7-76.6zm20.1-73.6c-5.6 5.4-14.6 5.6-20.1 0l-76.7-76.7c-14.2-15.1-33.1-22-53.1-22h-9.3l97.6-97.6c30.3-30.2 79.5-30.2 109.8 0l97.1 97.1h-15.2c-20 0-38.9 7.8-53.1 22l-77 77.2zM112.6 142.7c13.8 0 26.5 5.6 37.1 15.4l76.7 76.7c7.2 6.3 16.6 10.8 26.1 10.8s18.9-4.5 26.1-10.8l77-77c9.8-9.7 23.3-15.3 37.1-15.3h37.7l58.3 58.3c30.3 30.3 30.3 79.5 0 109.8l-58.3 58.3h-37.7c-13.8 0-27.3-5.6-37.1-15.4l-77-77c-13.9-13.9-38.2-13.9-52.1.1l-76.7 76.7c-10.6 9.7-23.3 15.3-37.1 15.3H80.8l-58.2-58.3c-30.2-30.3-30.2-79.5 0-109.8l58.2-58.2h31.8z" />
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
    // Nominal: a mesma tela pra todos (admin configura as chaves em PSP Keys)
    { label: "Nominal", href: "/v1/integrations/acquirers", icon: PixIcon },
    { label: "Automações", href: "/v1/automation", icon: Workflow },
    { label: "API & Docs", href: "/v1/configs/apikey", icon: Code },
  ];

  if (isAdmin) {
    items.push(
      { label: "Painel", href: "/v2/manager", icon: ShieldCheck },
      { label: "Sellers", href: "/v2/manager/users", icon: Users },
      { label: "Todas transações", href: "/v2/manager/transactions", icon: Activity },
      { label: "Saques admin", href: "/v2/manager/withdraw", icon: ArrowUpFromLine },
      { label: "Notificações", href: "/v2/manager/notifications", icon: BellRing },
      { label: "PSP Keys", href: "/v2/manager/psp-key", icon: KeyRound },
    );
  }

  return items;
}

/* Active-state matcher: exact or descendant path. Quando mais de um item casa
   (ex.: Produtos e Transações em /v1/products/sales), pickActiveHref escolhe
   o mais específico. */
function isActive(pathname: string, href: string, alsoMatches: string[] = []): boolean {
  if (pathname === href) return true;
  if (alsoMatches.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  if (href === "/v1/dashboard") return false;
  if (href === "/v1/finance") {
    // /v1/finance/withdraw etc. ainda existe como redirect — marca o nav.
    return pathname.startsWith("/v1/finance");
  }
  return pathname.startsWith(href + "/");
}

/* Só UM item do menu fica ativo: o que casa com a rota de forma mais
   específica (caminho mais longo). Ex.: em /v1/integrations/acquirers casam
   "Integrações" (/v1/integrations) e "Nominal" — só o Nominal acende. Idem
   Domínios e, no admin, Sellers/Nominal etc. não acendem junto do "Painel". */
function pickActiveHref(pathname: string, items: NavItem[]): string | null {
  let best: { href: string; len: number } | null = null;
  for (const it of items) {
    if (!isActive(pathname, it.href, it.alsoMatches)) continue;
    const len = Math.max(
      ...[it.href, ...(it.alsoMatches || [])]
        .filter((p) => pathname === p || pathname.startsWith(p + "/"))
        .map((p) => p.length),
      0,
    );
    if (!best || len > best.len) best = { href: it.href, len };
  }
  return best?.href ?? null;
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
      className="sp-logo pointer-events-auto select-none"
      data-collapsed={collapsed ? "true" : "false"}
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

/* Metas de faturamento (placas): a barra mostra o caminho até a próxima. */
// Mesmas placas da campanha do dashboard (100K, 500K, 1M, 2M) + a primeira, 10K.
const REVENUE_GOALS = [10_000, 100_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000];

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

function fmtGoal(goal: number): string {
  return goal >= 1_000_000 ? `R$ ${goal / 1_000_000}M` : `R$ ${goal / 1_000}K`;
}

/** Pílula "FATURAMENTO ▬▬▬ R$ 622,25 / R$ 10K" do centro da barra do topo. */
function RevenueGoal({ value, hidden }: { value: number | null; hidden: boolean }) {
  const v = value ?? 0;
  const goal = REVENUE_GOALS.find((g) => v < g) ?? REVENUE_GOALS[REVENUE_GOALS.length - 1]!;
  const pct = Math.min(100, (v / goal) * 100);
  // um pedacinho mínimo pra aparecer quando já tem venda
  const width = v > 0 ? Math.max(pct, 2.5) : 0;
  return (
    <Link
      href="/v1/dashboard"
      title={`Faturamento (vendas pagas). Próxima meta: ${fmtGoal(goal)}`}
      className="sp-goal flex h-9 min-w-0 max-w-full items-center gap-3 rounded-lg px-3.5 transition-colors"
      style={{ background: T.quietBg }}
    >
      <span className="sp-goal-label hidden text-[12.5px] font-medium lg:inline" style={{ color: "#6B7280" }}>
        Faturamento
      </span>
      <span
        className="sp-goal-track relative h-1.5 w-28 shrink-0 overflow-hidden rounded-full lg:w-44 xl:w-52"
        style={{ background: "#E7E0FA" }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label="Progresso até a próxima meta de faturamento"
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${width}%`,
            background: T.brandGradient,
            transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </span>
      <span className="sp-goal-value whitespace-nowrap text-[13px] font-semibold tabular-nums" style={{ color: T.text }}>
        {value == null ? "—" : hidden ? "R$ ••••" : brl(v)}
        <span className="font-normal" style={{ color: T.textMuted }}>
          {" / "}
          {fmtGoal(goal)}
        </span>
      </span>
    </Link>
  );
}

export function LightShell({
  children,
  valuesVisible,
  onToggleValues,
}: LightShellProps) {
  const router = useRouter();
  const { user, logout, token } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [footerMenuOpen, setFooterMenuOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const sidebarWidth = sidebarCollapsed ? 76 : 260;

  // Saldo disponível (card no topo da sidebar, estilo BravoPay). Começa pelo
  // wallet do user (instantâneo) e atualiza via /api/user/dashboard-stats.
  const [balance, setBalance] = useState<number | null>(() => {
    const w = (user as any)?.wallet?.[0]?.balance;
    return w != null && !isNaN(Number(w)) ? Number(w) : null;
  });
  // Faturamento (soma das vendas pagas) — pílula do centro da barra do topo.
  const [revenue, setRevenue] = useState<number | null>(null);
  useEffect(() => {
    if (!token) return;
    fetch("https://shadowpay-backend.onrender.com/api/user/dashboard-stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d?.success) return;
        setBalance(Number(d.data?.currentBalance) || 0);
        setRevenue(Number(d.data?.grossRevenue) || 0);
      })
      .catch(() => {});
  }, [token]);

  // Olho: a página pode controlar (dashboard/financeiro); nas outras a barra
  // usa a mesma escolha salva no navegador.
  const [ownVisible, toggleOwnVisible] = useValuesVisible();
  const visible = valuesVisible ?? ownVisible;
  const toggleValues = onToggleValues ?? toggleOwnVisible;
  const fmtBRL = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v || 0);

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
  const activeHref = pickActiveHref(router.pathname, nav);

  const toggleExpanded = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const initial = (user?.companyName?.[0] || "S").toUpperCase();
  const avatarUrl = user?.avatarUrl || null;


  return (
    <div
      className="sp-shell relative min-h-screen w-full"
      style={{
        background: T.surface,
        color: T.text,
        fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {/* ============================================================
          SIDEBAR (FIXED — never scrolls com o conteúdo). Mesma cor do
          conteúdo e sem borda: a tela é uma peça só.
          ============================================================ */}
      <aside
        className="sp-sidebar fixed inset-y-0 left-0 z-30 hidden flex-col md:flex"
        style={{
          width: sidebarWidth,
          background: T.surface,
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

        {/* Saldo disponível — o bloco roxo da marca (sem brilho/degradê) */}
        {!sidebarCollapsed ? (
          <Link
            href="/v1/finance"
            className="sp-balance sp-glow mx-3 mb-4 block rounded-2xl px-4 py-3.5 transition-colors"
            style={{ background: T.brandGradient }}
          >
            <p className="text-[12.5px] font-medium" style={{ color: "rgba(255,255,255,0.78)" }}>
              Saldo disponível
            </p>
            <p
              className="sp-balance-value mt-1 text-[20px] font-semibold leading-tight tabular-nums"
              style={{
                color: "#FFFFFF",
                fontFamily:
                  "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
              }}
            >
              {!visible
                ? "••••••"
                : balance == null
                ? "—"
                : fmtBRL(balance)}
            </p>
          </Link>
        ) : (
          <Link
            href="/v1/finance"
            title="Saldo disponível"
            className="sp-balance sp-glow mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: T.brandGradient, color: "#FFFFFF" }}
          >
            <Wallet className="h-4 w-4" />
          </Link>
        )}

        {/* Nav — lista única (flat), sem seções */}
        <nav className="flex-1 overflow-y-auto px-3 py-1">
          <ul className="space-y-px">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = item.href === activeHref;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={sidebarCollapsed ? item.label : undefined}
                    data-active={active ? "true" : "false"}
                    className={`sp-nav-item group flex items-center gap-3 rounded-xl text-[14px] font-medium transition-colors ${active ? "sp-glow-sm" : ""}`}
                    style={{
                      padding: sidebarCollapsed ? "10px" : "9px 12px",
                      justifyContent: sidebarCollapsed ? "center" : "flex-start",
                      background: active ? T.brandGradient : "transparent",
                      color: active ? "#FFFFFF" : T.text2,
                      fontWeight: active ? 600 : 500,
                    }}
                  >
                    <Icon
                      className="h-[17px] w-[17px] shrink-0"
                      style={{ color: active ? "#FFFFFF" : T.textMuted }}
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
                    border: `1px solid ${T.border}`,
                    boxShadow: "0 8px 24px rgba(17,24,39,0.08)",
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
                    <span className="flex-1 text-left">Modo escuro</span>
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
                className={`flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors ${
                  footerMenuOpen ? "bg-[#F6F6F8]" : ""
                }`}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" draggable={false} />
                ) : (
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white"
                    style={{ background: T.primary }}
                  >
                    {initial}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-[14px] font-medium" style={{ color: T.text }}>
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
                className="mx-auto flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-[13px] font-semibold text-white"
                style={{ background: "#7C3AED" }}
                title={user?.companyName || "Operador"}
                aria-label="Conta"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" draggable={false} />
                ) : (
                  initial
                )}
              </button>
            )}
          </div>

          {/* Compactar (recolher menu) — sem linha divisória */}
          <button
            onClick={() => setSidebarCollapsed((v) => !v)}
            className={`mt-1 flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] font-medium text-[#6B7280] transition-colors hover:bg-[#F6F6F8] hover:text-[#111827] ${
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
            className="sp-sidebar flex h-full w-72 flex-col"
            style={{
              background: T.surface,
              boxShadow: "8px 0 24px rgba(17,24,39,0.10)",
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
                  const active = item.href === activeHref;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        data-active={active ? "true" : "false"}
                        className={`sp-nav-item flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium ${active ? "sp-glow-sm" : ""}`}
                        style={{
                          background: active ? T.brandGradient : "transparent",
                          color: active ? "#FFFFFF" : T.text2,
                          fontWeight: active ? 600 : 500,
                        }}
                      >
                        <Icon
                          className="h-[18px] w-[18px] shrink-0"
                          style={{ color: active ? "#FFFFFF" : T.textMuted }}
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* footer logout */}
            <div className="px-3 py-3">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-[14px] font-medium text-[#B42318] hover:bg-[#FEF3F2]"
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
        className="sp-main relative flex min-h-screen min-w-0 flex-col md:ml-[var(--sidebar-w)]"
        style={
          {
            ["--sidebar-w" as any]: `${sidebarWidth}px`,
            transition: "margin-left 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
            background: T.surface,
          } as React.CSSProperties
        }
      >
        {/* (toggle de recolher agora é o botão "Compactar" no rodapé da sidebar) */}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* ============================================================
              TOPBAR
              ============================================================ */}
          {/* FIXA no topo (não "sticky": no celular o overflow-x do body
              quebra o sticky). O espaço abaixo reserva a altura dela. */}
          <header
            className="sp-topbar fixed inset-x-0 top-0 z-40 flex items-center gap-1 px-3 md:left-[var(--sidebar-w)] md:px-6"
            style={{
              height: "calc(3.5rem + env(safe-area-inset-top, 0px))",
              paddingTop: "env(safe-area-inset-top, 0px)",
              // mesmo branco do conteúdo, sem linha nem sombra embaixo
              background: T.surface,
              transition: "left 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {/* Hamburger mobile */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#4B5563] transition-colors hover:bg-[#F1F1F4] hover:text-[#111827] md:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Esquerda: olho (esconde valores) + tema */}
            <button
              onClick={toggleValues}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F1F1F4] hover:text-[#111827]"
              aria-label={visible ? "Esconder valores" : "Mostrar valores"}
              title={visible ? "Esconder valores" : "Mostrar valores"}
            >
              {visible ? <Eye className="h-[18px] w-[18px]" /> : <EyeOff className="h-[18px] w-[18px]" />}
            </button>
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F1F1F4] hover:text-[#111827]"
              aria-label={isDark ? "Mudar para o tema claro" : "Mudar para o tema escuro"}
              title={isDark ? "Mudar para claro" : "Mudar para escuro"}
            >
              {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>

            {/* Centro: faturamento rumo à próxima meta */}
            <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex" style={{ marginTop: "calc(env(safe-area-inset-top, 0px) / 2)" }}>
              <RevenueGoal value={revenue} hidden={!visible} />
            </div>

            {/* Direita: sino + foto */}
            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              {/* Baixar o app (PWA) — some quando já está aberto pelo app */}
              <InstallAppButton variant="icon" />
              {/* Sino: abre o painel de notificações push deste aparelho */}
              <NotificationsBell borderColor={T.border} primary={T.primary} variant="plain" />

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="sp-avatar-ring flex h-8 w-8 items-center justify-center overflow-hidden rounded-full transition-opacity hover:opacity-85"
                  aria-label="Conta"
                  title={user?.companyName || "Conta"}
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" draggable={false} />
                  ) : (
                    <span
                      className="flex h-full w-full items-center justify-center text-[13px] font-semibold text-white"
                      style={{ background: T.primary }}
                    >
                      {initial}
                    </span>
                  )}
                </button>
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div
                      className="absolute right-0 top-11 z-40 w-56 overflow-hidden rounded-xl bg-white p-1.5"
                      style={{ border: `1px solid ${T.border}`, boxShadow: "0 8px 24px rgba(17,24,39,0.08)" }}
                    >
                      <div className="px-3 pb-2 pt-1.5">
                        <p className="truncate text-[13px] font-semibold text-slate-800">
                          {user?.companyName || "Operador"}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {user?.isAdministrator ? "Administrador" : "Seller Bronze"}
                        </p>
                      </div>
                      <div className="mx-2 mb-1 h-px bg-slate-100" />
                      {now && (
                        <p className="px-3 py-1.5 text-[12px] text-slate-400 first-letter:uppercase">
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
                      <InstallAppButton variant="menu" />
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
          <div
            aria-hidden="true"
            className="shrink-0"
            style={{ height: "calc(3.5rem + env(safe-area-inset-top, 0px))" }}
          />

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
