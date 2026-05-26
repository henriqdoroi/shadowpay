import Head from "next/head";
import { Target } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import { ComingSoon } from "@/components/ComingSoon";
import ShadowPanel from "@/components/ShadowPanel";

export default function PixelsPage() {
  return (
    <ProtectedRoute>
      <Head>
        <title>ShadowPay — Pixels</title>
      </Head>
      <LightShell>
        <ComingSoon
          subtitle="Integrações"
          title="Pixels"
          description="Conecte Meta Pixel, Google Tag Manager, TikTok Pixel e UTMify diretamente nos seus checkouts. Acompanhe conversão em tempo real e otimize anúncios sem código."
          icon={<Target className="h-7 w-7" />}
          accent="#3B82F6"
          eta="Em breve"
        />
      </LightShell>
      <ShadowPanel />
    </ProtectedRoute>
  );
}
