"use client";

/**
 * usePush — estado e ações de push pras telas (toda a lógica fica em
 * src/lib/push.ts). `enable` precisa ser chamado direto no onClick.
 */
import { useCallback, useEffect, useState } from "react";
import {
  PushDeviceInfo,
  PushResult,
  PushState,
  detectPlatform,
  disablePush,
  enablePush,
  getPushState,
  listPushDevices,
  prefetchVapidKey,
  sendTestPush,
  syncPush,
  thisDeviceHint,
} from "@/lib/push";

export function usePush(token: string | null) {
  const [state, setState] = useState<PushState>("checking");
  const [busy, setBusy] = useState<null | "enable" | "test" | "disable">(null);
  const [devices, setDevices] = useState<PushDeviceInfo[] | null>(null);
  const [thisHint, setThisHint] = useState<string | null>(null);
  const [platform, setPlatform] = useState<ReturnType<typeof detectPlatform>>("other");

  const refresh = useCallback(async () => {
    setPlatform(detectPlatform());
    const st = await getPushState();
    setState(st);
    setThisHint(await thisDeviceHint());
    if (token) setDevices(await listPushDevices(token));
    // Permissão já dada: garante que este aparelho está registrado.
    if (st === "enabled" && token) {
      const r = await syncPush(token);
      if (r.ok) {
        setThisHint(await thisDeviceHint());
        setDevices(await listPushDevices(token));
      }
    }
  }, [token]);

  useEffect(() => {
    prefetchVapidKey();
    refresh();
    // volta pro app (ex.: liberou a permissão nos Ajustes) -> reavalia
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  const enable = useCallback((): Promise<PushResult> => {
    if (!token) return Promise.resolve({ ok: false, message: "Entre na sua conta para ativar." });
    setBusy("enable");
    // enablePush pede a permissão na hora (dentro do toque do usuário)
    return enablePush(token).then(async (r) => {
      await refresh();
      setBusy(null);
      return r;
    });
  }, [token, refresh]);

  const test = useCallback(async () => {
    if (!token) return { ok: false, message: "Entre na sua conta.", sent: 0, total: 0 };
    setBusy("test");
    const r = await sendTestPush(token);
    setDevices(await listPushDevices(token));
    setBusy(null);
    return r;
  }, [token]);

  const disable = useCallback(async () => {
    setBusy("disable");
    const r = await disablePush(token);
    await refresh();
    setBusy(null);
    return r;
  }, [token, refresh]);

  return { state, busy, devices, thisHint, platform, refresh, enable, test, disable };
}
