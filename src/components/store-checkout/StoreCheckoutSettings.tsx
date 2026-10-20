/**
 * Config do checkout "Loja" na edição do produto (layout de e-commerce,
 * frete e cupons). Salva sozinho em PATCH /api/products/:id/store-checkout
 * — não depende do "Salvar alterações" da página.
 */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ExternalLink, Loader2, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/lib/axiosErrors";
import { API } from "./lib";

type Coupon = { code: string; type: "percent" | "fixed"; value: string; active: boolean };
type Form = {
  enabled: boolean;
  title: string;
  headerColor: string;
  tag: string;
  variant: string;
  requireAddress: boolean;
  shippingMode: "free" | "fixed";
  shippingPrice: string;
  daysMin: string;
  daysMax: string;
  shippingLabel: string;
  coupons: Coupon[];
};

function fromSaved(raw: any, productType: string): Form {
  const physical = String(productType || "").toLowerCase().includes("sic");
  const r = raw && typeof raw === "object" ? raw : {};
  const sh = r.shipping && typeof r.shipping === "object" ? r.shipping : {};
  const enabled = r.enabled === undefined ? physical : !!r.enabled;
  return {
    enabled,
    title: r.title || "Finalize sua compra",
    headerColor: r.headerColor || "",
    tag: r.tag || "",
    variant: r.variant || "",
    requireAddress: r.requireAddress === undefined ? physical || enabled : !!r.requireAddress,
    shippingMode: sh.mode === "fixed" ? "fixed" : "free",
    shippingPrice: sh.price ? String(sh.price).replace(".", ",") : "",
    daysMin: String(sh.daysMin ?? 3),
    daysMax: String(sh.daysMax ?? 7),
    shippingLabel: sh.label || "Envio padrão",
    coupons: Array.isArray(r.coupons)
      ? r.coupons.map((c: any) => ({
          code: String(c.code || ""),
          type: c.type === "fixed" ? "fixed" : "percent",
          value: String(c.value ?? "").replace(".", ","),
          active: c.active !== false,
        }))
      : [],
  };
}

const reais = (v: string) => Number(v.replace(/\./g, "").replace(",", ".")) || 0;

export default function StoreCheckoutSettings({ productId }: { productId: string }) {
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;
    const token = localStorage.getItem("token");
    axios
      .get(`${API}/products/${productId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        const p = r.data?.data?.product ?? r.data?.data ?? {};
        const cfg = p.checkoutConfig || {};
        setForm(fromSaved(cfg.storeCheckout, cfg.productType || p.productType || ""));
      })
      .catch((e) => setLoadError(apiErrorMessage(e, "Não foi possível carregar a configuração do checkout.")));
  }, [productId]);

  if (loadError) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-red-600">{loadError}</CardContent>
      </Card>
    );
  }
  if (!form) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-6 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando checkout loja...
        </CardContent>
      </Card>
    );
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const setCoupon = (i: number, patch: Partial<Coupon>) =>
    set(
      "coupons",
      form.coupons.map((c, j) => (j === i ? { ...c, ...patch } : c)),
    );

  const save = async () => {
    const bad = form.coupons.find((c) => !c.code.trim() || !(reais(c.value) > 0) || (c.type === "percent" && reais(c.value) > 100));
    if (bad) {
      toast.error("Cada cupom precisa de código e valor (porcentagem até 100).");
      return;
    }
    if (form.shippingMode === "fixed" && !(reais(form.shippingPrice) > 0)) {
      toast.error("Informe o valor do frete fixo.");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const r = await axios.patch(
        `${API}/products/${productId}/store-checkout`,
        {
          storeCheckout: {
            enabled: form.enabled,
            title: form.title,
            headerColor: form.headerColor,
            tag: form.tag,
            variant: form.variant,
            requireAddress: form.requireAddress,
            shipping: {
              mode: form.shippingMode,
              price: reais(form.shippingPrice),
              daysMin: Number(form.daysMin) || 0,
              daysMax: Number(form.daysMax) || 0,
              label: form.shippingLabel,
            },
            coupons: form.coupons.map((c) => ({ code: c.code, type: c.type, value: reais(c.value), active: c.active })),
          },
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setForm(fromSaved(r.data?.data, ""));
      toast.success("Checkout loja salvo.");
    } catch (e) {
      toast.error(apiErrorMessage(e, "Não foi possível salvar o checkout loja."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" /> Checkout loja (e-commerce)
        </CardTitle>
        <CardDescription>
          Layout de loja no celular: endereço de entrega, frete, cupom e barra fixa com o total. Os valores são
          calculados no servidor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="sc-enabled">Usar o checkout loja</Label>
            <p className="text-xs text-slate-500">Produto físico já usa este modelo por padrão.</p>
          </div>
          <Switch id="sc-enabled" checked={form.enabled} onCheckedChange={(v) => set("enabled", v)} />
        </div>

        {form.enabled && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sc-title">Título do topo</Label>
                <Input id="sc-title" maxLength={40} value={form.title} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sc-color">Cor do topo (sua marca)</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    aria-label="Escolher cor"
                    className="h-9 w-12 cursor-pointer rounded border"
                    value={form.headerColor || "#2968c8"}
                    onChange={(e) => set("headerColor", e.target.value)}
                  />
                  <Input
                    id="sc-color"
                    placeholder="Cor principal do produto"
                    value={form.headerColor}
                    onChange={(e) => set("headerColor", e.target.value.trim())}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sc-tag">Etiqueta (opcional)</Label>
                <Input id="sc-tag" maxLength={24} placeholder="Ex.: Lançamento" value={form.tag} onChange={(e) => set("tag", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sc-variant">Variação (opcional)</Label>
                <Input id="sc-variant" maxLength={60} placeholder="Ex.: Cor: Preto" value={form.variant} onChange={(e) => set("variant", e.target.value)} />
              </div>
            </div>

            <div className="space-y-4 rounded-xl border p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="sc-address">Pedir endereço de entrega</Label>
                  <p className="text-xs text-slate-500">Desligue para produtos digitais.</p>
                </div>
                <Switch id="sc-address" checked={form.requireAddress} onCheckedChange={(v) => set("requireAddress", v)} />
              </div>
              {form.requireAddress && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Frete</Label>
                    <div className="flex gap-2">
                      {(["free", "fixed"] as const).map((m) => (
                        <Button
                          key={m}
                          type="button"
                          variant={form.shippingMode === m ? "default" : "outline"}
                          className="flex-1 cursor-pointer"
                          onClick={() => set("shippingMode", m)}
                        >
                          {m === "free" ? "Grátis" : "Valor fixo"}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {form.shippingMode === "fixed" && (
                    <div className="space-y-2">
                      <Label htmlFor="sc-ship-price">Valor do frete (R$)</Label>
                      <Input
                        id="sc-ship-price"
                        inputMode="decimal"
                        placeholder="19,90"
                        value={form.shippingPrice}
                        onChange={(e) => set("shippingPrice", e.target.value.replace(/[^\d,]/g, ""))}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="sc-ship-label">Nome do envio</Label>
                    <Input id="sc-ship-label" maxLength={60} value={form.shippingLabel} onChange={(e) => set("shippingLabel", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="sc-dmin">Prazo mín. (dias)</Label>
                      <Input id="sc-dmin" inputMode="numeric" value={form.daysMin} onChange={(e) => set("daysMin", e.target.value.replace(/\D/g, ""))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sc-dmax">Prazo máx. (dias)</Label>
                      <Input id="sc-dmax" inputMode="numeric" value={form.daysMax} onChange={(e) => set("daysMax", e.target.value.replace(/\D/g, ""))} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Cupons de desconto</Label>
                  <p className="text-xs text-slate-500">Os códigos ficam só no servidor — o checkout nunca os mostra.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => set("coupons", [...form.coupons, { code: "", type: "percent", value: "", active: true }])}
                >
                  <Plus className="mr-1 h-4 w-4" /> Cupom
                </Button>
              </div>
              {form.coupons.length === 0 && <p className="text-sm text-slate-500">Nenhum cupom criado.</p>}
              {form.coupons.map((c, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <Input
                    aria-label="Código"
                    className="min-w-[140px] flex-1 uppercase"
                    placeholder="CODIGO"
                    maxLength={30}
                    value={c.code}
                    onChange={(e) => setCoupon(i, { code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })}
                  />
                  <select
                    aria-label="Tipo"
                    className="h-9 rounded-md border px-2 text-sm"
                    value={c.type}
                    onChange={(e) => setCoupon(i, { type: e.target.value as Coupon["type"] })}
                  >
                    <option value="percent">%</option>
                    <option value="fixed">R$</option>
                  </select>
                  <Input
                    aria-label="Valor"
                    className="w-24"
                    inputMode="decimal"
                    placeholder={c.type === "percent" ? "10" : "20,00"}
                    value={c.value}
                    onChange={(e) => setCoupon(i, { value: e.target.value.replace(/[^\d,]/g, "") })}
                  />
                  <Switch aria-label="Ativo" checked={c.active} onCheckedChange={(v) => setCoupon(i, { active: v })} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remover cupom"
                    className="cursor-pointer"
                    onClick={() => set("coupons", form.coupons.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={save} disabled={saving} className="cursor-pointer">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar checkout loja
          </Button>
          <a
            href={`/v1/checkout/${productId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-violet-700 hover:underline"
          >
            Abrir checkout <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
