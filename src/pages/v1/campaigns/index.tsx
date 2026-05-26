import Head from "next/head";
import { Megaphone } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import { ComingSoon } from "@/components/ComingSoon";
import ShadowPanel from "@/components/ShadowPanel";

export default function CampaignsPage() {
  return (
    <ProtectedRoute>
      <Head>
        <title>ShadowPay — Campanhas</title>
      </Head>
      <LightShell>
        <ComingSoon
          subtitle="Inteligência"
          title="Campanhas"
          description="Crie e gerencie campanhas de remarketing, recuperação de carrinho e order bumps inteligentes. Conecte-se a Meta Ads, Google Ads e TikTok para escalar a operação."
          icon={<Megaphone className="h-7 w-7" />}
          accent="#7C3AED"
          eta="Em breve"
        />
      </LightShell>
      <ShadowPanel />
    </ProtectedRoute>
  );
}
