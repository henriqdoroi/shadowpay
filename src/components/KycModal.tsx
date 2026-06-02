"use client";

/**
 * KycModal — popup flutuante TRAVADO de verificação (KYC) de 7 passos.
 *
 * Aparece por cima da dashboard (fundo escuro semi-transparente) enquanto o
 * KYC não estiver APROVADO. Não fecha, não dá pra clicar atrás.
 *
 * Estados:
 *   - status APPROVED          → não renderiza nada
 *   - status PENDING (enviado) → tela "Verificação em análise" (ShadowLoader)
 *   - resto (NOT_STARTED/etc)  → wizard de 7 passos
 *
 * Salva cada passo em POST /api/user/kyc/wizard e finaliza em
 * POST /api/user/kyc/submit. Documentos vão como data URL (base64).
 *
 * Visual: Stripe + SyncPay — branco, hairlines, stepper numerado, tipografia
 * sóbria, botões sólidos violeta. Sem cara de IA.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Building2,
  MapPin,
  UserRound,
  IdCard,
  ShieldCheck,
  CreditCard,
  Briefcase,
  UploadCloud,
  FileText,
  Check,
  AlertCircle,
  Search,
  X,
} from "lucide-react";
import { ShadowLoader } from "@/components/ShadowLoader";

const API = "https://shadowpay-api-production.up.railway.app";

const PRIMARY = "#7C3AED";
const BORDER = "rgba(15,23,42,0.12)";

const STEPS = [
  { n: 1, icon: Building2, title: "Dados da empresa", sub: "Precisamos dessas informações para garantir que sua empresa está regularizada." },
  { n: 2, icon: MapPin, title: "Endereço da empresa", sub: "Informe o endereço completo da sua empresa." },
  { n: 3, icon: UserRound, title: "Dados do representante", sub: "Quem responde legalmente pela empresa e autoriza movimentações." },
  { n: 4, icon: MapPin, title: "Endereço do representante", sub: "Endereço completo do representante legal." },
  { n: 5, icon: IdCard, title: "Confirme sua identidade", sub: "Envie seus documentos pessoais para validar sua conta de forma segura." },
  { n: 6, icon: CreditCard, title: "Conta para recebimentos", sub: "Informe onde deseja receber os valores processados via ShadowPay." },
  { n: 7, icon: Briefcase, title: "Nos conte sobre o seu negócio", sub: "Essas informações nos ajudam a entender o perfil da sua operação." },
];

const COMPANY_TYPES = ["MEI (Microempreendedor Individual)", "ME (Microempresa)", "EIRELI", "LTDA", "S.A.", "Outro"];
const PIX_TYPES = ["Email", "CPF", "CNPJ", "Telefone", "Chave aleatória"];
const BUSINESS_TYPES = ["E-commerce", "Infoproduto", "Serviços", "SaaS / Software", "Dropshipping", "Assinatura", "Outro"];
const PRODUCT_INTERESTS = ["Conta digital", "Checkout", "Link de pagamento", "API de pagamentos", "Tudo"];

type Form = {
  // 1 empresa
  contratoSocialUrl: string;
  companyType: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  // 2 endereço empresa
  addressZip: string; addressStreet: string; addressNumber: string;
  addressNeighborhood: string; addressComplement: string; addressCity: string; addressState: string;
  // 3 representante
  repName: string; repCpf: string; repBirthDate: string; repPhone: string;
  // 4 endereço representante
  repAddressZip: string; repAddressStreet: string; repAddressNumber: string;
  repAddressNeighborhood: string; repAddressComplement: string; repAddressCity: string; repAddressState: string;
  // 5 docs
  documentFrontUrl: string; documentBackUrl: string; selfieUrl: string; facePhotoUrl: string;
  // 6 pix
  pixKeyType: string; pixKey: string; destinatarioDoc: string;
  // 7 negócio
  monthlyRevenue: string; avgTicket: string; businessType: string; productInterest: string; siteUrl: string;
};

const EMPTY: Form = {
  contratoSocialUrl: "", companyType: "", razaoSocial: "", nomeFantasia: "", cnpj: "",
  addressZip: "", addressStreet: "", addressNumber: "", addressNeighborhood: "", addressComplement: "", addressCity: "", addressState: "",
  repName: "", repCpf: "", repBirthDate: "", repPhone: "",
  repAddressZip: "", repAddressStreet: "", repAddressNumber: "", repAddressNeighborhood: "", repAddressComplement: "", repAddressCity: "", repAddressState: "",
  documentFrontUrl: "", documentBackUrl: "", selfieUrl: "", facePhotoUrl: "",
  pixKeyType: "", pixKey: "", destinatarioDoc: "",
  monthlyRevenue: "", avgTicket: "", businessType: "", productInterest: "", siteUrl: "",
};

// máscaras
const onlyDigits = (v: string) => v.replace(/\D/g, "");
const maskCnpj = (v: string) => onlyDigits(v).slice(0, 14).replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
const maskCpf = (v: string) => onlyDigits(v).slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1-$2");
const maskCep = (v: string) => onlyDigits(v).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
const maskPhone = (v: string) => { const d = onlyDigits(v).slice(0, 11); if (d.length <= 10) return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2"); return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2"); };
const maskMoney = (v: string) => { const n = Number(onlyDigits(v)) / 100; return n ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : ""; };
const moneyToNumber = (v: string) => Number(onlyDigits(v)) / 100;

export default function KycModal({ onApproved }: { onApproved?: () => void }) {
  const [status, setStatus] = useState<string>("LOADING");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cepLoading, setCepLoading] = useState<"company" | "rep" | null>(null);

  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // trava o scroll do body enquanto o modal está aberto
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // carrega estado do KYC + prefill
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const r = await axios.get(`${API}/api/user/kyc`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 12000, // nunca prende o usuário no loader se a API travar
        });
        const d = r.data?.data || {};
        const st = String(d.status || "NOT_STARTED");
        setStatus(st);
        if (st === "APPROVED") { onApproved?.(); return; }
        const emp = d.empresa || {}, en = d.endereco || {}, rep = d.representante || {}, re = d.repEndereco || {}, doc = d.documentos || {}, rec = d.recebimento || {}, neg = d.negocio || {};
        setForm((f) => ({
          ...f,
          contratoSocialUrl: doc.contratoSocialUrl || "",
          companyType: emp.companyType || "",
          razaoSocial: emp.razaoSocial || "",
          nomeFantasia: emp.nomeFantasia || "",
          cnpj: emp.cnpj ? maskCnpj(emp.cnpj) : "",
          addressZip: en.zip ? maskCep(en.zip) : "", addressStreet: en.street || "", addressNumber: en.number || "",
          addressNeighborhood: en.neighborhood || "", addressComplement: en.complement || "", addressCity: en.city || "", addressState: en.state || "",
          repName: rep.repName || "", repCpf: rep.repCpf ? maskCpf(rep.repCpf) : "",
          repBirthDate: rep.repBirthDate ? String(rep.repBirthDate).slice(0, 10) : "", repPhone: rep.repPhone ? maskPhone(rep.repPhone) : "",
          repAddressZip: re.zip ? maskCep(re.zip) : "", repAddressStreet: re.street || "", repAddressNumber: re.number || "",
          repAddressNeighborhood: re.neighborhood || "", repAddressComplement: re.complement || "", repAddressCity: re.city || "", repAddressState: re.state || "",
          documentFrontUrl: doc.documentFrontUrl || "", documentBackUrl: doc.documentBackUrl || "", selfieUrl: doc.selfieUrl || "", facePhotoUrl: doc.facePhotoUrl || "",
          pixKeyType: rec.pixKeyType || "", pixKey: rec.pixKey || "", destinatarioDoc: rec.destinatarioDoc ? maskCnpj(rec.destinatarioDoc) : "",
          monthlyRevenue: neg.monthlyRevenue ? Number(neg.monthlyRevenue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "",
          avgTicket: neg.avgTicket ? Number(neg.avgTicket).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "",
          businessType: neg.businessType || "", productInterest: neg.productInterest || "", siteUrl: neg.siteUrl || "",
        }));
      } catch {
        setStatus("NOT_STARTED");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lookupCep = async (cep: string, which: "company" | "rep") => {
    const c = onlyDigits(cep);
    if (c.length !== 8) return;
    setCepLoading(which);
    try {
      const j = await fetch(`https://viacep.com.br/ws/${c}/json/`).then((r) => r.json());
      if (j && !j.erro) {
        if (which === "company") setForm((f) => ({ ...f, addressStreet: j.logradouro || f.addressStreet, addressNeighborhood: j.bairro || f.addressNeighborhood, addressCity: j.localidade || f.addressCity, addressState: j.uf || f.addressState }));
        else setForm((f) => ({ ...f, repAddressStreet: j.logradouro || f.repAddressStreet, repAddressNeighborhood: j.bairro || f.repAddressNeighborhood, repAddressCity: j.localidade || f.repAddressCity, repAddressState: j.uf || f.repAddressState }));
      }
    } catch { /* silencioso */ } finally { setCepLoading(null); }
  };

  // payload por passo
  const stepPayload = (s: number): Record<string, any> => {
    switch (s) {
      case 1: return { contratoSocialUrl: form.contratoSocialUrl, companyType: form.companyType, razaoSocial: form.razaoSocial, nomeFantasia: form.nomeFantasia, cnpj: onlyDigits(form.cnpj) };
      case 2: return { addressZip: onlyDigits(form.addressZip), addressStreet: form.addressStreet, addressNumber: form.addressNumber, addressNeighborhood: form.addressNeighborhood, addressComplement: form.addressComplement, addressCity: form.addressCity, addressState: form.addressState };
      case 3: return { repName: form.repName, repCpf: onlyDigits(form.repCpf), repBirthDate: form.repBirthDate || null, repPhone: onlyDigits(form.repPhone) };
      case 4: return { repAddressZip: onlyDigits(form.repAddressZip), repAddressStreet: form.repAddressStreet, repAddressNumber: form.repAddressNumber, repAddressNeighborhood: form.repAddressNeighborhood, repAddressComplement: form.repAddressComplement, repAddressCity: form.repAddressCity, repAddressState: form.repAddressState };
      case 5: return { documentFrontUrl: form.documentFrontUrl, documentBackUrl: form.documentBackUrl, selfieUrl: form.selfieUrl, facePhotoUrl: form.facePhotoUrl };
      case 6: return { pixKeyType: form.pixKeyType, pixKey: form.pixKey };
      case 7: return { monthlyRevenue: moneyToNumber(form.monthlyRevenue), avgTicket: moneyToNumber(form.avgTicket), businessType: form.businessType, productInterest: form.productInterest, siteUrl: form.siteUrl };
      default: return {};
    }
  };

  const validateStep = (s: number): string | null => {
    if (s === 1) { if (!form.razaoSocial.trim()) return "Informe a razão social."; if (onlyDigits(form.cnpj).length !== 14) return "CNPJ inválido."; if (!form.companyType) return "Selecione o tipo de empresa."; }
    if (s === 2) { if (onlyDigits(form.addressZip).length !== 8) return "CEP inválido."; if (!form.addressNumber.trim()) return "Informe o número."; }
    if (s === 3) { if (!form.repName.trim()) return "Informe o nome do representante."; if (onlyDigits(form.repCpf).length !== 11) return "CPF inválido."; }
    if (s === 4) { if (onlyDigits(form.repAddressZip).length !== 8) return "CEP inválido."; if (!form.repAddressNumber.trim()) return "Informe o número."; }
    if (s === 5) { if (!form.documentFrontUrl || !form.documentBackUrl || !form.selfieUrl || !form.facePhotoUrl) return "Envie os 4 itens."; }
    if (s === 6) { if (!form.pixKeyType) return "Escolha o tipo de chave Pix."; if (!form.pixKey.trim()) return "Informe a chave Pix."; }
    return null;
  };

  const save = async (s: number) => {
    const token = localStorage.getItem("token");
    await axios.post(`${API}/api/user/kyc/wizard`, stepPayload(s), { headers: { Authorization: `Bearer ${token}` } });
  };

  const next = async () => {
    const err = validateStep(step);
    if (err) { toast.error(err); return; }
    setSaving(true);
    try { await save(step); setStep((s) => Math.min(7, s + 1)); }
    catch { toast.error("Não consegui salvar. Tente de novo."); }
    finally { setSaving(false); }
  };

  const finish = async () => {
    setSubmitting(true);
    try {
      await save(7);
      const token = localStorage.getItem("token");
      const r = await axios.post(`${API}/api/user/kyc/submit`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (r.data?.success) {
        if (typeof window !== "undefined") (window as any).__shadowKycStatus = "PENDING";
        setStatus("PENDING");
      } else {
        toast.error(r.data?.message || "Faltam informações.");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Erro ao enviar.");
    } finally { setSubmitting(false); }
  };

  if (status === "LOADING") return <Backdrop><ShadowLoader size={72} /></Backdrop>;
  if (status === "APPROVED") return null;

  // ---- Estado: enviado, aguardando análise ----
  if (status === "PENDING") {
    return (
      <Backdrop>
        <div className="w-full max-w-[440px] rounded-2xl bg-white px-8 py-12 text-center" style={cardShadow}>
          <ShadowLoader size={92} />
          <p className="mt-6 text-[18px] font-bold tracking-[-0.01em] text-slate-900">Verificação em análise</p>
          <p className="mx-auto mt-2 max-w-[320px] text-[13.5px] leading-relaxed text-slate-500">
            Recebemos seus dados! Nossa equipe está conferindo tudo. Assim que for aprovada, sua conta libera automaticamente.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold" style={{ background: "rgba(245,158,11,0.10)", color: "#B45309" }}>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "#F59E0B" }} />
            Aguardando aprovação
          </div>
        </div>
      </Backdrop>
    );
  }

  // ---- Wizard ----
  const cur = STEPS[step - 1]!;
  return (
    <Backdrop>
      <div className="flex max-h-[92vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl bg-white" style={cardShadow}>
        {/* Header */}
        <div className="shrink-0 px-7 pt-6">
          <p className="text-[20px] font-bold tracking-[-0.01em] text-slate-900">Verificação</p>
          <div className="mt-4 h-px" style={{ background: "rgba(15,23,42,0.08)" }} />
          {/* Stepper */}
          <div className="flex items-center justify-center py-5">
            {STEPS.map((s, i) => {
              const done = step > s.n, active = step === s.n;
              return (
                <div key={s.n} className="flex items-center">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[12.5px] font-bold transition-colors"
                    style={{
                      background: done ? PRIMARY : active ? PRIMARY : "#EEF1F6",
                      color: done || active ? "#fff" : "#94A3B8",
                      boxShadow: active ? "0 0 0 4px rgba(124,58,237,0.14)" : "none",
                    }}
                  >
                    {done ? <Check className="h-4 w-4" /> : s.n}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span className="h-[2px] w-4 sm:w-6" style={{ background: step > s.n ? PRIMARY : "#E6E8EB" }} />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[16px] font-bold text-slate-900">{cur.title}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-400">{cur.sub}</p>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-5">
          {step === 1 && (
            <div className="space-y-4">
              <Upload label="Contrato Social" value={form.contratoSocialUrl} accept="application/pdf,image/*" onChange={(v) => set("contratoSocialUrl", v)} />
              <Select label="Tipo de empresa" value={form.companyType} onChange={(v) => set("companyType", v)} options={COMPANY_TYPES} placeholder="Selecione o tipo" />
              <Field label="Razão Social"><Input value={form.razaoSocial} onChange={(v) => set("razaoSocial", v)} placeholder="Razão social da empresa" /></Field>
              <Field label="Nome fantasia"><Input value={form.nomeFantasia} onChange={(v) => set("nomeFantasia", v)} placeholder="Nome fantasia" /></Field>
              <Field label="CNPJ"><Input value={form.cnpj} onChange={(v) => set("cnpj", maskCnpj(v))} placeholder="00.000.000/0000-00" inputMode="numeric" /></Field>
            </div>
          )}

          {step === 2 && (
            <AddressBlock
              prefix="address" form={form} set={set}
              cepLoading={cepLoading === "company"} onCep={(v) => lookupCep(v, "company")}
            />
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Field label="Nome completo do representante"><Input value={form.repName} onChange={(v) => set("repName", v)} placeholder="Nome completo" /></Field>
              <Field label="CPF do representante"><Input value={form.repCpf} onChange={(v) => set("repCpf", maskCpf(v))} placeholder="000.000.000-00" inputMode="numeric" /></Field>
              <Field label="Data de nascimento"><Input value={form.repBirthDate} onChange={(v) => set("repBirthDate", v)} type="date" /></Field>
              <Field label="Telefone"><Input value={form.repPhone} onChange={(v) => set("repPhone", maskPhone(v))} placeholder="(00) 00000-0000" inputMode="tel" /></Field>
            </div>
          )}

          {step === 4 && (
            <AddressBlock
              prefix="repAddress" form={form} set={set}
              cepLoading={cepLoading === "rep"} onCep={(v) => lookupCep(v, "rep")}
            />
          )}

          {step === 5 && (
            <div className="space-y-4">
              <Upload label="Frente do documento" value={form.documentFrontUrl} accept="image/*" onChange={(v) => set("documentFrontUrl", v)} />
              <Upload label="Verso do documento" value={form.documentBackUrl} accept="image/*" onChange={(v) => set("documentBackUrl", v)} />
              <Upload label="Selfie segurando o documento" value={form.selfieUrl} accept="image/*" onChange={(v) => set("selfieUrl", v)} />
              <Upload label="Foto de perfil do rosto" value={form.facePhotoUrl} accept="image/*" onChange={(v) => set("facePhotoUrl", v)} />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.18)" }}>
                <AlertCircle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-rose-500" />
                <p className="text-[12.5px] leading-snug text-rose-700">
                  <b>Alerta</b><br />a chave Pix para recebimento dos saques deve estar vinculada ao mesmo CPF/CNPJ cadastrado na conta!
                </p>
              </div>
              <Select label="Tipo de chave PIX" value={form.pixKeyType} onChange={(v) => set("pixKeyType", v)} options={PIX_TYPES} placeholder="Escolha uma opção" />
              <Field label="Chave PIX"><Input value={form.pixKey} onChange={(v) => set("pixKey", v)} placeholder="Digite a chave PIX" /></Field>
              <Field label="CPF ou CNPJ do destinatário">
                <div className="flex h-11 w-full items-center rounded-lg px-3 text-[13.5px] text-slate-500" style={{ border: `1px solid ${BORDER}`, background: "#F8FAFC" }}>
                  {form.destinatarioDoc || "—"}
                </div>
              </Field>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <Field label="Faturamento médio mensal"><Input value={form.monthlyRevenue} onChange={(v) => set("monthlyRevenue", maskMoney(v))} placeholder="R$ 0,00" inputMode="numeric" /></Field>
              <Field label="Ticket médio"><Input value={form.avgTicket} onChange={(v) => set("avgTicket", maskMoney(v))} placeholder="R$ 0,00" inputMode="numeric" /></Field>
              <Select label="Tipo de negócio" value={form.businessType} onChange={(v) => set("businessType", v)} options={BUSINESS_TYPES} placeholder="Selecione o tipo de negócio" />
              <Select label="Produtos de Interesse" value={form.productInterest} onChange={(v) => set("productInterest", v)} options={PRODUCT_INTERESTS} placeholder="Selecione o produto de interesse" />
              <Field label="URL do site (opcional)"><Input value={form.siteUrl} onChange={(v) => set("siteUrl", v)} placeholder="https://seusite.com.br" /></Field>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2.5 border-t px-7 py-4" style={{ borderColor: "rgba(15,23,42,0.08)" }}>
          {step > 1 && (
            <button onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={saving || submitting}
              className="h-10 rounded-lg px-5 text-[13.5px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50" style={{ border: `1px solid ${BORDER}` }}>
              Voltar
            </button>
          )}
          {step < 7 ? (
            <button onClick={next} disabled={saving}
              className="h-10 rounded-lg px-6 text-[13.5px] font-semibold text-white transition-opacity disabled:opacity-60" style={{ background: PRIMARY }}>
              {saving ? "Salvando…" : "Continuar"}
            </button>
          ) : (
            <button onClick={finish} disabled={submitting}
              className="h-10 rounded-lg px-6 text-[13.5px] font-semibold text-white transition-opacity disabled:opacity-60" style={{ background: PRIMARY }}>
              {submitting ? "Enviando…" : "Finalizar"}
            </button>
          )}
        </div>
      </div>
    </Backdrop>
  );
}

/* ===================== UI helpers ===================== */
const cardShadow: React.CSSProperties = { boxShadow: "0 24px 64px -12px rgba(15,23,42,0.45), 0 0 0 1px rgba(15,23,42,0.04)" };

function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(5px)", WebkitBackdropFilter: "blur(5px)" }}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", inputMode }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; inputMode?: any }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      inputMode={inputMode}
      className="h-11 w-full rounded-lg px-3 text-[13.5px] text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
      style={{ border: `1px solid ${BORDER}`, background: "#fff" }}
    />
  );
}

function Select({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <Field label={label}>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full appearance-none rounded-lg px-3 pr-9 text-[13.5px] outline-none transition-colors focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
          style={{ border: `1px solid ${BORDER}`, background: "#fff", color: value ? "#1e293b" : "#94a3b8" }}
        >
          <option value="" disabled>{placeholder || "Selecione"}</option>
          {options.map((o) => <option key={o} value={o} style={{ color: "#1e293b" }}>{o}</option>)}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▾</span>
      </div>
    </Field>
  );
}

function Upload({ label, value, onChange, accept }: { label: string; value: string; onChange: (v: string) => void; accept?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const has = !!value;

  const read = (file?: File) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { toast.error("Arquivo muito grande (máx 15MB)."); return; }
    const fr = new FileReader();
    fr.onload = () => onChange(String(fr.result || ""));
    fr.readAsDataURL(file);
  };

  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-medium text-slate-600">{label}</label>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => read(e.target.files?.[0])} />
      {has ? (
        <div className="flex items-center gap-3 rounded-xl px-3.5 py-3" style={{ border: `1px solid ${BORDER}`, background: "#fff" }}>
          {value.startsWith("data:image") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "rgba(124,58,237,0.10)", color: PRIMARY }}><FileText className="h-5 w-5" /></span>
          )}
          <span className="flex-1 truncate text-[13px] font-medium text-slate-700">Arquivo enviado</span>
          <button onClick={() => onChange("")} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-rose-500" aria-label="Remover"><X className="h-4 w-4" /></button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); read(e.dataTransfer.files?.[0]); }}
          className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl py-6 text-[13px] font-medium transition-colors"
          style={{ border: `1.5px dashed ${over ? PRIMARY : "rgba(124,58,237,0.35)"}`, background: over ? "rgba(124,58,237,0.04)" : "rgba(124,58,237,0.02)", color: PRIMARY }}
        >
          <UploadCloud className="h-5 w-5" />
          Clique ou arraste seu arquivo aqui!
        </button>
      )}
    </div>
  );
}

function AddressBlock({ prefix, form, set, cepLoading, onCep }: { prefix: "address" | "repAddress"; form: Form; set: (k: keyof Form, v: string) => void; cepLoading: boolean; onCep: (v: string) => void }) {
  const k = (suffix: string) => `${prefix}${suffix}` as keyof Form;
  return (
    <div className="space-y-4">
      <Field label="CEP">
        <div className="relative">
          <Input value={form[k("Zip")]} onChange={(v) => { set(k("Zip"), maskCep(v)); if (onlyDigits(v).length === 8) onCep(v); }} placeholder="00000-000" inputMode="numeric" />
          {cepLoading && <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-pulse text-violet-400" />}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Rua"><Input value={form[k("Street")]} onChange={(v) => set(k("Street"), v)} placeholder="Rua" /></Field>
        <Field label="Número"><Input value={form[k("Number")]} onChange={(v) => set(k("Number"), v)} placeholder="Nº" /></Field>
        <Field label="Bairro"><Input value={form[k("Neighborhood")]} onChange={(v) => set(k("Neighborhood"), v)} placeholder="Bairro" /></Field>
        <Field label="Complemento"><Input value={form[k("Complement")]} onChange={(v) => set(k("Complement"), v)} placeholder="Digite aqui..." /></Field>
        <Field label="Cidade"><Input value={form[k("City")]} onChange={(v) => set(k("City"), v)} placeholder="Cidade" /></Field>
        <Field label="Estado"><Input value={form[k("State")]} onChange={(v) => set(k("State"), v.toUpperCase().slice(0, 2))} placeholder="UF" /></Field>
      </div>
    </div>
  );
}
