import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, X, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API = "https://shadowpay-api-production.up.railway.app/api";
const VIOLET = "#8B5CF6";

type Msg = { role: "user" | "shadow"; text: string };

function ShadowMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="sg-panel" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#A855F7" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21" stroke="url(#sg-panel)" strokeWidth="2" opacity="0.6" />
      <circle cx="24" cy="24" r="8" fill="url(#sg-panel)" />
      <circle cx="24" cy="24" r="13" stroke="url(#sg-panel)" strokeWidth="1.5" opacity="0.35" />
    </svg>
  );
}

export default function ShadowPanel() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "shadow", text: "Infraestrutura online. Em que posso te ajudar?" },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/shadow/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((j) => setOnline(Boolean(j?.data?.online)))
      .catch(() => setOnline(false));
  }, [token]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  const send = async () => {
    const message = input.trim();
    if (!message || loading || !token) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: message }]);
    setLoading(true);
    try {
      const res = await fetch(`${API}/shadow/ask`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      const j = await res.json();
      const reply =
        j?.data?.reply ||
        "Tive uma instabilidade no núcleo. Tente de novo em instantes.";
      if (typeof j?.data?.online === "boolean") setOnline(j.data.online);
      setMessages((m) => [...m, { role: "shadow", text: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "shadow", text: "Sem conexão com o núcleo. Verifique sua rede." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div style={{ fontFamily: "'Satoshi', system-ui, sans-serif" }}>
      {/* Botão flutuante */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-white/15"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.16), rgba(11,16,32,0.9) 60%)",
          boxShadow: "0 0 40px -8px rgba(139,92,246,0.8)",
        }}
        aria-label="Abrir Shadow AI"
      >
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: `0 0 0 0 ${VIOLET}` }}
          animate={{ boxShadow: [`0 0 0 0 rgba(139,92,246,0.5)`, `0 0 0 12px rgba(139,92,246,0)`] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
        />
        <ShadowMark size={26} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-6 z-50 flex h-[30rem] w-[22rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-white/[0.1] text-white backdrop-blur-2xl"
            style={{
              background: "rgba(11,16,32,0.92)",
              boxShadow: "0 40px 100px -40px rgba(139,92,246,0.7)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <ShadowMark size={22} />
                <div>
                  <div className="text-sm font-semibold leading-none" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                    Shadow
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: online === false ? "#F59E0B" : "#34D399" }}
                    />
                    {online === false ? "Offline" : "Online"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mensagens */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "text-white"
                        : "border border-white/[0.08] bg-white/[0.04] text-white/85"
                    }`}
                    style={
                      m.role === "user"
                        ? { background: "linear-gradient(120deg, #8B5CF6, #6366F1)" }
                        : undefined
                    }
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 text-sm text-white/50">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> pensando…
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-white/[0.08] p-3">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 focus-within:border-[#8B5CF6]">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Fale com a Shadow…"
                  className="flex-1 bg-transparent py-1 text-sm text-white placeholder:text-white/30 focus:outline-none"
                />
                <button
                  onClick={send}
                  disabled={loading || !input.trim()}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white transition-opacity disabled:opacity-40"
                  style={{ background: "linear-gradient(120deg, #8B5CF6, #6366F1)" }}
                  aria-label="Enviar"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
