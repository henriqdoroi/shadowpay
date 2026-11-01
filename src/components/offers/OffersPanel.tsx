"use client";

/**
 * Checkouts (ofertas) de um produto — aba "Checkouts" de Editar produto.
 *
 * Cada checkout tem preço, link e visual próprios (Checkout Builder). O
 * principal abre no link /v1/checkout/:productId; os outros em `?o=:id`.
 * API: /api/products/:id/offers (lista, cria, duplica, ativa, principal, exclui).
 */
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { toast } from "sonner";
import { Copy, CopyPlus, Crown, ExternalLink, Loader2, Paintbrush, Plus, Trash2 } from "lucide-react";
import { Button, Card, Switch } from "@/components/account/ui";
import { StatusBadge } from "@/components/PanelBits";
import { useAuth } from "@/contexts/AuthContext";
import { apiErrorMessage } from "@/lib/axiosErrors";
import { TEMPLATES, brlCents } from "@/lib/checkoutConfig";

const API = "https://shadowpay-backend.onrender.com";

type OfferRow = {
  id: string;
  productId: string;
  internalName: string;
  active: boolean;
  isDefault: boolean;
  effectivePriceCents: number;
  priceCents: number | null;
  template: string;
  legacy: boolean;
  upsellUrl: string | null;
  backRedirectUrl: string | null;
  stats: { paid: number; revenue: number };
};

function templateLabel(t: string, legacy: boolean) {
  if (legacy) return "Clássico";
  return TEMPLATES.find((x) => x.key === t)?.label ?? t;
}

export default function OffersPanel({ productId }: { productId: string }) {
  const router = useRouter();
  const { token } = useAuth();
  const [rows, setRows] = useState<OfferRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const r = await axios.get(`${API}/api/products/${productId}/offers`, { headers: { Authorization: `Bearer ${token}` } });
      setRows(r.data?.data ?? []);
    } catch (e) {
      toast.error(apiErrorMessage(e, "Não consegui carregar os checkouts."));
      setRows([]);
    }
  }, [productId, token]);

  useEffect(() => {
    load();
  }, [load]);

  const linkOf = (o: OfferRow) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}/v1/checkout/${o.productId}${o.isDefault ? "" : `?o=${o.id}`}`;
  const openBuilder = (id: string) => router.push(`/v1/products/builder/${productId}/${id}`);

  const run = async (key: string, fn: () => Promise<unknown>, ok?: string) => {
    setBusy(key);
    try {
      await fn();
      if (ok) toast.success(ok);
      await load();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Não deu certo. Tente de novo."));
    } finally {
      setBusy(null);
    }
  };

  const create = async (duplicateFrom?: string) => {
    setBusy(duplicateFrom ? `dup-${duplicateFrom}` : "new");
    try {
      const r = await axios.post(`${API}/api/products/${productId}/offers`, duplicateFrom ? { duplicateFrom } : {}, auth);
      const id = r.data?.data?.id;
      if (!duplicateFrom && id) {
        openBuilder(id);
        return;
      }
      toast.success("Checkout duplicado.");
      await load();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Não consegui criar o checkout."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-semibold text-slate-900">Checkouts e links</h2>
          <p className="mt-0.5 text-[13px] text-slate-500">
            Cada checkout tem o seu preço, link e visual. Use vários pra testar preço, headline e oferta.
          </p>
        </div>
        <Button loading={busy === "new"} icon={<Plus className="h-4 w-4" />} onClick={() => create()}>
          Novo checkout
        </Button>
      </div>

      {rows == null ? (
        <div className="flex items-center gap-2 py-8 text-[14px] text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando checkouts…
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((o) => (
            <div key={o.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[14.5px] font-semibold text-slate-900">{o.internalName}</p>
                {o.isDefault && (
                  <StatusBadge tone="violet" plain>
                    <Crown className="h-3 w-3" /> Principal
                  </StatusBadge>
                )}
                <StatusBadge tone={o.active ? "green" : "gray"}>{o.active ? "Ativo" : "Desativado"}</StatusBadge>
                <span className="text-[12.5px] text-slate-500">Template: {templateLabel(o.template, o.legacy)}</span>
                <span className="flex-1" />
                <Switch
                  checked={o.active}
                  disabled={o.isDefault || busy === `act-${o.id}`}
                  label={o.active ? "Desativar checkout" : "Ativar checkout"}
                  onChange={(v) =>
                    run(`act-${o.id}`, () => axios.post(`${API}/api/products/${productId}/offers/${o.id}/status`, { active: v }, auth))
                  }
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
                <div>
                  <p className="text-slate-500">Preço</p>
                  <p className="font-semibold tabular-nums text-slate-900">
                    {brlCents(o.effectivePriceCents)}
                    {o.priceCents == null && <span className="ml-1 font-normal text-slate-400">(do produto)</span>}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Vendas pagas</p>
                  <p className="font-semibold tabular-nums text-slate-900">{o.stats.paid}</p>
                </div>
                <div>
                  <p className="text-slate-500">Faturamento</p>
                  <p className="font-semibold tabular-nums text-slate-900">{brlCents(Math.round(o.stats.revenue * 100))}</p>
                </div>
                <div>
                  <p className="text-slate-500">Depois de pagar</p>
                  <p className="truncate font-medium text-slate-700">{o.upsellUrl ? "Upsell próprio" : "Do produto"}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-slate-600">{linkOf(o)}</span>
                <button
                  type="button"
                  aria-label="Copiar link"
                  onClick={() => navigator.clipboard?.writeText(linkOf(o)).then(() => toast.success("Link copiado."))}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200/70"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <a href={linkOf(o)} target="_blank" rel="noopener noreferrer" aria-label="Abrir checkout" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200/70">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button className="h-9 px-3.5 text-[12.5px]" icon={<Paintbrush className="h-4 w-4" />} onClick={() => openBuilder(o.id)}>
                  Abrir no builder
                </Button>
                <Button
                  variant="outline"
                  className="h-9 px-3.5 text-[12.5px]"
                  loading={busy === `dup-${o.id}`}
                  icon={<CopyPlus className="h-4 w-4" />}
                  onClick={() => create(o.id)}
                >
                  Duplicar
                </Button>
                {!o.isDefault && (
                  <Button
                    variant="outline"
                    className="h-9 px-3.5 text-[12.5px]"
                    loading={busy === `def-${o.id}`}
                    icon={<Crown className="h-4 w-4" />}
                    onClick={() =>
                      run(`def-${o.id}`, () => axios.post(`${API}/api/products/${productId}/offers/${o.id}/default`, {}, auth), "Agora este é o checkout principal.")
                    }
                  >
                    Tornar principal
                  </Button>
                )}
                {!o.isDefault && (
                  <Button
                    variant="danger"
                    className="h-9 px-3.5 text-[12.5px]"
                    loading={busy === `del-${o.id}`}
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={() => {
                      if (!window.confirm(`Excluir o checkout "${o.internalName}"? O link dele para de vender.`)) return;
                      run(`del-${o.id}`, () => axios.delete(`${API}/api/products/${productId}/offers/${o.id}`, auth), "Checkout excluído.");
                    }}
                  >
                    Excluir
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
