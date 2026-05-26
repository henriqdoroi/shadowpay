"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Package,
  Receipt,
  Wallet,
  UserCircle2,
} from "lucide-react";

const items = [
  { label: "Início", href: "/v1/dashboard", icon: LayoutDashboard },
  { label: "Produtos", href: "/v1/products", icon: Package },
  { label: "Pedidos", href: "/v1/products/sales", icon: Receipt },
  { label: "Carteira", href: "/v1/finance/withdraw", icon: Wallet },
  { label: "Perfil", href: "/v1/configs/profile", icon: UserCircle2 },
];

export function ShadowMobileNav() {
  const router = useRouter();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 h-16 border-t border-white/[0.06] md:hidden"
      style={{
        background: "rgba(5, 7, 13, 0.92)",
        backdropFilter: "blur(20px) saturate(140%)",
      }}
    >
      <ul className="flex h-full items-stretch">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            router.pathname === item.href ||
            (item.href !== "/v1/dashboard" &&
              router.pathname.startsWith(item.href));

          return (
            <li key={item.href} className="relative flex-1">
              <Link
                href={item.href}
                className="flex h-full flex-col items-center justify-center gap-0.5 px-2"
                style={{
                  color: active ? "#F8FAFC" : "#64748B",
                }}
              >
                {active && (
                  <span
                    className="absolute inset-x-6 top-0 h-[2px] rounded-b-full"
                    style={{
                      background:
                        "linear-gradient(90deg, #A855F7 0%, #22D3EE 100%)",
                      boxShadow: "0 4px 12px rgba(124, 58, 237, 0.5)",
                    }}
                  />
                )}
                <Icon
                  className={`h-5 w-5 transition-transform ${
                    active ? "text-violet-300 scale-110" : ""
                  }`}
                />
                <span className="text-[10px] font-medium tracking-tight">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
