import { useCallback, useEffect, useState } from "react";

/**
 * "Olho" da barra do topo: mostra/esconde os valores em R$ do painel.
 * A escolha fica salva neste navegador e vale pra todas as páginas — quem
 * usa este hook (barra do topo, dashboard, financeiro...) fica sincronizado.
 */
const KEY = "shadowpay:valuesHidden";
const EVENT = "shadowpay:values-visibility";
// Sem localStorage (ex.: aba anônima bloqueada), vale enquanto a página estiver aberta.
let memoryVisible: boolean | null = null;

function readVisible(): boolean {
  try {
    const v = window.localStorage.getItem(KEY);
    if (v !== null) return v !== "1";
  } catch {
    /* usa a memória */
  }
  return memoryVisible ?? true;
}

export function useValuesVisible(): [boolean, () => void] {
  // Começa visível (igual ao HTML do servidor) e lê a escolha salva depois.
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const sync = () => setVisible(readVisible());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback(() => {
    const next = !readVisible();
    memoryVisible = next;
    try {
      window.localStorage.setItem(KEY, next ? "0" : "1");
    } catch {
      /* fica só na memória */
    }
    window.dispatchEvent(new Event(EVENT)); // atualiza todos que usam o hook
  }, []);

  return [visible, toggle];
}
