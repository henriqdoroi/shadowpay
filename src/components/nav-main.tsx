"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { useRouter } from "next/router";
import Link from "next/link";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
  userKycStatus,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
    disabled?: boolean;
    badge?: string;
    items?: { title: string; url: string }[];
    requiresKycApproved?: boolean; // Nova propriedade para verificar KYC
  }[];
  userKycStatus: "PENDING" | "APPROVED" | "BANNED" | "NOT_STARTED"; // Status do KYC do usuário
}) {
  const router = useRouter();
  const [openSections, setOpenSections] = useState<string[]>([]);

  const isUrlActive = (url: string) => {
    if (url === "#") return false;
    return router.asPath === url || router.asPath.startsWith(url + "/");
  };

  const hasActiveSubItem = (item: any) => {
    return item.items?.some((subItem: any) => isUrlActive(subItem.url));
  };

  useEffect(() => {
    const activeItems = items
      .filter((item) => hasActiveSubItem(item) || isUrlActive(item.url))
      .map((item) => item.title);
    setOpenSections(activeItems);
  }, [router.asPath, items]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu Safira</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isItemActive = isUrlActive(item.url);
          const hasActiveSub = hasActiveSubItem(item);
          const isOpen = openSections.includes(item.title);
          const Icon = item.icon;

          // Define se o item deve estar desabilitado (ex: requer KYC e não aprovado)
          const isDisabled =
            (item.requiresKycApproved && userKycStatus !== "APPROVED") ||
            item.disabled === true; // Também respeita a flag disabled

          return (
            <Collapsible
              key={item.title}
              asChild
              open={isOpen}
              onOpenChange={(open) => {
                // Bloqueia abrir submenu se estiver desabilitado
                if (!isDisabled) {
                  setOpenSections((prev) =>
                    open
                      ? [...prev.filter((t) => t !== item.title), item.title]
                      : prev.filter((t) => t !== item.title)
                  );
                }
              }}
            >
              <SidebarMenuItem>
                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        className={`flex items-center justify-between w-full cursor-pointer px-2 py-1 rounded-md transition-colors duration-200
                          ${
                            hasActiveSub
                              ? "text-[#6114fa] bg-[#6114fa]/10 font-semibold"
                              : "text-foreground hover:bg-[#6114fa]/10 hover:text-[#6114fa]"
                          }
                          ${
                            isDisabled
                              ? "cursor-not-allowed opacity-60 pointer-events-none"
                              : ""
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon
                            className={`w-4 h-4 ${
                              hasActiveSub ? "text-[#6114fa]" : ""
                            }`}
                          />
                          <span className="text-left">{item.title}</span>
                          {item.badge && (
                            <span className="text-xs text-muted-foreground font-normal">
                              ({item.badge})
                            </span>
                          )}
                        </div>

                        <ChevronRight
                          className={`transition-transform duration-200 w-4 h-4 ${
                            isOpen ? "rotate-90" : ""
                          }`}
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    {/* Só renderiza o submenu se NÃO estiver desabilitado */}
                    {!isDisabled && (
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => {
                            const isSubItemActive = isUrlActive(subItem.url);
                            return (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  className={`block cursor-pointer rounded-md px-3 py-2 transition-all duration-150
                                    ${
                                      isSubItemActive
                                        ? "text-white bg-[#6114fa] font-semibold shadow-md"
                                        : "text-foreground hover:bg-[#6114fa]/10 hover:text-[#6114fa] hover:shadow-sm hover:scale-[1.02]"
                                    }`}
                                >
                                  <Link href={subItem.url} legacyBehavior passHref>
                                    <a className="block w-full">{subItem.title}</a>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </>
                ) : (
                  <SidebarMenuButton
                    asChild
                    className={`flex items-center justify-between w-full cursor-pointer px-3 py-2 rounded-lg transition-all duration-200
                      ${
                        hasActiveSub
                          ? "text-white bg-[#6114fa] font-semibold shadow-md"
                          : "text-foreground hover:bg-[#6114fa]/10 hover:text-[#6114fa] hover:shadow-sm hover:scale-[1.02]"
                      }
                      ${
                        isDisabled
                          ? "cursor-not-allowed opacity-60 pointer-events-none"
                          : ""
                      }`}
                  >
                    <a
                      href={isDisabled ? undefined : item.url}
                      onClick={(e) => {
                        if (isDisabled) e.preventDefault();
                      }}
                      className={`flex items-center gap-2 flex-1 ${
                        isDisabled ? "pointer-events-none cursor-not-allowed" : ""
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          hasActiveSub ? "text-white" : ""
                        }`}
                      />
                      <span className={isItemActive ? "text-[#6114fa]" : ""}>
                        {item.title}
                      </span>
                      {item.badge && (
                        <span className="text-xs text-muted-foreground font-normal">
                          ({item.badge})
                        </span>
                      )}
                    </a>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
