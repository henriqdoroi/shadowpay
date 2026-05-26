"use client";

import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Bricolage_Grotesque } from "next/font/google";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import Head from "next/head";

import { useRouter } from "next/router";
import { useEffect } from "react";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-bricolage",
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
      className={`${bricolage.variable} flex min-h-screen w-full overflow-x-hidden`}
    >
      {/* Cada página renderiza seu próprio AppSidebar (desktop) e
          shadcn Sidebar Sheet (mobile drawer) via SidebarProvider.
          Nada de NavBottom/SidebarMobile antigos — substituídos pelos
          ShadowMobileNav e ShadowTopbar dentro do ShadowShell. */}
      <main className="flex-grow">
        <Component {...pageProps} />
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
        <link rel="icon" type="image/png" href="/icon-safira.png" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Manifest PWA */}
        <link rel="manifest" href="/manifest.json" />

        <link rel="apple-touch-icon" href="/icon-safira.png" />

        <link
          rel="apple-touch-startup-image"
          href="/safira-logo.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/safira-logo.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/safira-logo.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/safira-logo.png"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/safira-logo.png"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"
        />

        {/* Meta tags para iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Safira Cash" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        {/* Cor da barra de status no Android e iOS */}
        <meta name="theme-color" content="#0F172A" />
      </Head>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
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
