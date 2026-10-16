"use client";

import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import Head from "next/head";

import { useRouter } from "next/router";
import { useEffect } from "react";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import KycGate from "@/components/KycGate";
import { installAxiosErrorNormalizer } from "@/lib/axiosErrors";
import { registerServiceWorker } from "@/lib/push";
import { initInstallPrompt } from "@/lib/install";

// Erros do backend vêm em { error: { message } } — normaliza pra todas as
// telas lerem `e.response.data.message` e mostrarem o motivo real.
installAxiosErrorNormalizer();

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

function AppContent({ Component, pageProps }: AppProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  // Fecha sidebar mobile quando muda para desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) {
        setOpenMobile(false);
      }
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [setOpenMobile]);

  // Registra o Service Worker da PWA (silencioso — o push só é ativado por
  // um toque do seller; ver src/lib/push.ts).
  useEffect(() => {
    registerServiceWorker();
    // guarda o "instalar app" do navegador pro botão em Minha conta
    initInstallPrompt();
  }, []);

  // Acorda o backend assim que o site abre (Render free "dorme" após ~15min
  // de inatividade). Reduz/elimina o cold-start no 1o login/cadastro, pois o
  // servidor já vai estar de pé enquanto a pessoa digita. Fire-and-forget.
  useEffect(() => {
    if (typeof window === "undefined") return;
    fetch("https://shadowpay-backend.onrender.com/", {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (isLoading || !user) return;

    const handleRouteChange = (url: string) => {
      if (user.isAdministrator && (url === "/" || url === "/login")) {
        router.replace("/v2/manager");
      } else if (!user.isAdministrator && (url === "/" || url === "/login")) {
        router.replace("/v1/dashboard");
      }
    };

    handleRouteChange(router.pathname);

    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [user, isLoading, router]);

  return (
    <div
      className={`${inter.variable} ${jetbrainsMono.variable} flex min-h-screen w-full overflow-x-hidden`}
      style={{ fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Cada página renderiza seu próprio AppSidebar (desktop) e
          shadcn Sidebar Sheet (mobile drawer) via SidebarProvider.
          Nada de NavBottom/SidebarMobile antigos — substituídos pelos
          ShadowMobileNav e ShadowTopbar dentro do ShadowShell. */}
      {/* min-w-0: sem isso o <main> (item flex) não encolhe abaixo do conteúdo
          — uma tabela larga empurrava o layout inteiro e cortava a direita. */}
      <main className="min-w-0 flex-grow">
        <KycGate>
          <Component {...pageProps} />
        </KycGate>
      </main>
      <Toaster />
    </div>
  );
}

export default function App(props: AppProps) {
  return (
    <>
      <Head>
        <title>ShadowPay — Elite Financial Infrastructure</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        {/* Favicon padrão e fallback */}
        <link rel="icon" type="image/png" href="/logoshadowpay.png" />
        <link rel="shortcut icon" href="/pwa/icon-192.png" />

        {/* Manifest PWA */}
        <link rel="manifest" href="/manifest.json" />

        <link rel="apple-touch-icon" sizes="180x180" href="/pwa/apple-touch-icon.png" />

        {/* Tela de abertura do app no iPhone: fundo da marca (theme-color);
            as imagens antigas eram de outra marca. */}

        {/* Cor da barra de status no Android e iOS — usa violeta da marca */}
        <meta name="theme-color" content="#7C3AED" />

        {/* PWA install — força nome curto e cor no iOS */}
        <meta name="apple-mobile-web-app-title" content="ShadowPay" />
        <meta name="application-name" content="ShadowPay" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </Head>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <AuthProvider>
          <SidebarProvider>
            <AppContent {...props} />
          </SidebarProvider>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}
