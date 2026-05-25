"use client";

import * as React from "react";
import {
  AppWindowMac,
  BookHeart,
  LifeBuoy,
  PiggyBank,
  Settings2,
  ShoppingCart,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
function ShadowMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="sg-sidebar" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#A855F7" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21" stroke="url(#sg-sidebar)" strokeWidth="2" opacity="0.6" />
      <circle cx="24" cy="24" r="8" fill="url(#sg-sidebar)" />
      <circle cx="24" cy="24" r="13" stroke="url(#sg-sidebar)" strokeWidth="1.5" opacity="0.35" />
    </svg>
  );
}

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navSecondary: [
    {
      title: "Suporte",
      url: "https://wa.me/559991519044?text=Ol%C3%A1%20Preciso%20de%20ajuda%20com%20minha%20conta%20safira%20cash.",
      icon: LifeBuoy,
    },
    {
      title: "Documentação",
      url: "https://safira-cash.readme.io/reference",
      icon: BookHeart,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  const needsKyc = !user?.isAdministrator;
  const blockedForKyc =
    !user?.isAdministrator &&
    (user?.kycStatus === "NOT_STARTED" || user?.kycStatus === "PENDING");

  // Configuração dinâmica do menu baseada no tipo de usuário
  const navMainItems = [
    {
      title: "Dashboard",
      url: " ",
      icon: AppWindowMac,
      items: [
        {
          title: "Performance",
          url: "/v2/manager",
        },
        {
          title: "Relatórios",
          url: "/v1/reports",
        },
      ],
    },
    {
      title: "Produtos",
      url: " ",
      icon: ShoppingCart,
      disabled: false, //COLOQUE TRUE
      // badge: "Em breve",
      items: [
        {
          title: "Produtos",
          url: "/v1/products",
        },
        {
          title: "Vendas",
          url: "/v1/products/sales",
        }
      ]
    },
    {
      title: "Financeiro",
      url: " ",
      icon: PiggyBank,
      items: [
        {
          title: "Entradas",
          url: "/v1/finance/recivements",
        },
        {
          title: "Saídas",
          url: "/v1/finance/withdraw",
        },
        {
          title: "Extornos",
          url: "/v1/finance/compliance",
        },
      ],
    },
    {
      title: "Configurações",
      url: " ",
      icon: Settings2,
      requiresKycApproved: needsKyc,
      items: [
        {
          title: "Webhook",
          url: "/v1/configs/webhook",
        },
        {
          title: "Credênciais API",
          url: "/v1/configs/apikey",
        },
        {
          title: "Taxas",
          url: "/v1/configs/fee",
        },
      ],
      ...(blockedForKyc
        ? {
            badge: "KYC pendente",
            title: "Configurações",
          }
        : {}),
    },
    ...(user?.isAdministrator
      ? [
          {
            title: "Administração",
            url: " ",
            icon: Shield,
            badge: "Admin",
            items: [
              {
                title: "Carteira Admin",
                url: "/v1/dashboard/",
              },
              {
                title: "Sellers",
                url: "/v2/manager/users",
              },
              {
                title: "Transações",
                url: "/v2/manager/transactions",
              },
              {
                title: "Adquirentes",
                url: "/v2/manager/adquerers",
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-center gap-2.5 py-2">
            <ShadowMark size={26} />
            <span className="text-display text-base font-bold tracking-tight text-white">
              ShadowPay
            </span>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={navMainItems}
          userKycStatus={user?.kycStatus || "NOT_STARTED"}
        />
        <NavSecondary items={data.navSecondary} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
