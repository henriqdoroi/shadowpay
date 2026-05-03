"use client";

import React from "react";
import { X } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { NavMain } from "@/components/nav-main";
import { useSidebar } from "@/components/ui/sidebar";

interface SidebarMobileProps {
  items: Parameters<typeof NavMain>[0]["items"];
  userKycStatus: Parameters<typeof NavMain>[0]["userKycStatus"];
}

export function SidebarMobile({ items, userKycStatus }: SidebarMobileProps) {
  const { openMobile, toggleSidebar } = useSidebar();
  if (!openMobile) return null;
  return (
    <>
      <div
        className="fixed inset-0 bg-opacity-50 z-[1000]"
        onClick={toggleSidebar}
      />
      <Sidebar
        variant="inset"
        className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 z-[1001] shadow-lg transform transition-transform duration-300"
        style={{
          transform: openMobile ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <SidebarHeader className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-bold text-lg">Menu</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </Button>
        </SidebarHeader>
        <SidebarContent className="overflow-y-auto">
          <NavMain items={items} userKycStatus={userKycStatus} />
        </SidebarContent>
      </Sidebar>
    </>
  );
}
