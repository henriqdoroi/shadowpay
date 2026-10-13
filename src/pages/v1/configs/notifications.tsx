"use client";

/** As notificações agora ficam em Minha conta → aba "Notificações". */
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function NotificationsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/v1/configs/profile?tab=notificacoes");
  }, [router]);
  return null;
}
