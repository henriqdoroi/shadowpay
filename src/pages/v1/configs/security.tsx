"use client";

/** Senha e 2FA agora ficam em Minha conta → Perfil → "Segurança". */
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function SecurityRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/v1/configs/profile?secao=seguranca");
  }, [router]);
  return null;
}
