"use client";

/**
 * Endereço antigo da configuração das adquirentes — agora em PSP Keys.
 */
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function AdquerersRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/v2/manager/psp-key");
  }, [router]);
  return null;
}
