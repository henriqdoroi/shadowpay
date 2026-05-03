"use client";

import {
  X,
  ChevronDown,
  ChevronUp,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const { user, logout } = useAuth();

  const needsKyc = !user?.isAdministrator;
  const blockedForKyc =
    !user?.isAdministrator &&
    (user?.kycStatus === "NOT_STARTED" || user?.kycStatus === "PENDING");

  const navMainItems = [
    {
      title: "Dashboard",
      items: [
        { title: "Performance", url: "/v2/manager" },
        { title: "Relatórios", url: "/v1/reports" },
      ],
    },
    {
      title: "Produtos",
      items: [
        { title: "Produtos", url: "/v1/products" },
        { title: "Vendas", url: "/v1/products/sales" },
      ],
    },
    {
      title: "Financeiro",
      items: [
        { title: "Entradas", url: "/v1/finance/recivements" },
        { title: "Saídas", url: "/v1/finance/withdraw" },
        { title: "Extornos", url: "/v1/finance/compliance" },
      ],
    },
    {
      title: "Configurações",
      requiresKycApproved: needsKyc,
      badge: blockedForKyc ? "KYC pendente" : undefined,
      items: [
        { title: "Webhook", url: "/v1/configs/webhook" },
        { title: "Credenciais API", url: "/v1/configs/apikey" },
        { title: "Taxas", url: "/v1/configs/fee" },
      ],
    },
    ...(user?.isAdministrator
      ? [
          {
            title: "Administração",
            badge: "Admin",
            items: [
              { title: "Carteira Admin", url: "/v1/dashboard/" },
              { title: "Sellers", url: "/v2/manager/users" },
              { title: "Transações", url: "/v2/manager/transactions" },
              { title: "Adquirentes", url: "/v2/manager/adquerers" },
            ],
          },
        ]
      : []),
  ];

  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [activeItem, setActiveItem] = useState<string>("");

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const handleItemClick = (url: string) => {
    setActiveItem(url);
    onClose();
  };

  // Bloqueia a rolagem da página de fundo quando o sidebar estiver aberto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          onClick={onClose} // <-- Fecha ao clicar fora
        >
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="absolute top-0 left-0 h-screen w-4/5 max-w-sm bg-zinc-900 shadow-xl flex flex-col justify-between rounded-r-xl"
            onClick={(e) => e.stopPropagation()} // <-- Evita fechar ao clicar dentro
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-zinc-800">
              <Image
                src="/safira-logo.png"
                alt="Safira Cash"
                width={140}
                height={20}
                className="object-contain"
              />
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-purple-500 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Menu */}
            <nav className="flex-1 overflow-y-auto">
              <ul className="flex flex-col p-4 space-y-2">
                {navMainItems.map((section, i) => {
                  const isOpen = openMenus.includes(section.title);
                  return (
                    <li key={i} className="text-white">
                      <button
                        onClick={() => toggleMenu(section.title)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-lg font-medium hover:bg-purple-600 active:bg-purple-700 transition"
                      >
                        <span>{section.title}</span>
                        {isOpen ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="ml-4 mt-1 space-y-1 overflow-hidden"
                          >
                            {section.items.map((sub, j) => (
                              <li key={j}>
                                <Link
                                  href={sub.url}
                                  onClick={() => handleItemClick(sub.url)}
                                  className={`block px-4 py-2 rounded-lg text-sm transition ${
                                    activeItem === sub.url
                                      ? "bg-purple-600 text-white"
                                      : "text-zinc-300 hover:bg-purple-600 active:bg-purple-700"
                                  }`}
                                >
                                  {sub.title}
                                </Link>
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Logout */}
            <div className="px-4 py-4">
              <button
                onClick={() => logout?.()}
                className="w-full flex items-center justify-between px-4 py-3 bg-zinc-800 hover:bg-purple-700 transition rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src="https://i.imgur.com/gY4OdOU.png"
                    alt="Avatar"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <span className="text-white font-medium truncate">
                    {user?.email || "Usuário"}
                  </span>
                </div>
                <LogOut className="h-5 w-5 text-white" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
