"use client";

/**
 * /v1/configs/profile — Perfil tema light.
 *
 * Layout 2 colunas inspirado no mockup:
 *   esq: "Minha Conta" — infos básicas read-only com ícones violeta
 *   dir: "Dados Cadastrais" — form editável (MCC, telefone, data,
 *        endereço completo) com ícone verde
 */

import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import axios from "axios";
import { toast } from "sonner";
import {
  User,
  Pencil,
  Cake,
  Mail,
  IdCard,
  Hash,
  Copy,
  Briefcase,
  Phone,
  Calendar,
  MapPin,
  Save,
  Search,
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import { ProfileTabs } from "@/components/ProfileTabs";
import ShadowPanel from "@/components/ShadowPanel";

const API = "https://shadowpay-api-production.up.railway.app";

const T = {
  card: "#FFFFFF",
  border: "rgba(15,23,42,0.08)",
  borderSoft: "rgba(15,23,42,0.06)",
  text: "#0F172A",
  text2: "#475569",
  textMuted: "#94A3B8",
  primary: "#7C3AED",
  primarySoft: "rgba(124,58,237,0.10)",
  green: "#10B981",
  greenSoft: "rgba(16,185,129,0.12)",
  blue: "#06B6D4",
  blueSoft: "rgba(6,182,212,0.12)",
  amber: "#F59E0B",
  amberSoft: "rgba(245,158,11,0.12)",
  inputBg: "#F8FAFC",
  inputBorder: "rgba(15,23,42,0.10)",
};

const MCC_OPTIONS = [
  "Comércio Direto - Catálogo/Serviços de Marketing - 5964",
  "Comércio Eletrônico - 5734",
  "Educação - Cursos Online - 8299",
  "Saúde e Bem-estar - 7298",
  "Restaurantes e Alimentação - 5812",
  "Vestuário - 5651",
  "Tecnologia - Software - 7372",
  "Beleza e Estética - 7298",
  "Imobiliária - 6513",
  "Outros",
];

function ProfileContent() {
  const [seller, setSeller] = useState<any>(null);
  const [kyc, setKyc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const [form, setForm] = useState({
    mcc: "",
    phone: "",
    birthDate: "",
    zip: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const [pr, kr] = await Promise.all([
          axios.get(`${API}/api/user/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios
            .get(`${API}/api/user/kyc`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch(() => null),
        ]);
        if (pr.data?.success) setSeller(pr.data.data);
        if (kr?.data?.success) {
          setKyc(kr.data.data);
          const dc = kr.data.data.dadosCadastrais || {};
          const en = kr.data.data.endereco || {};
          setForm({
            mcc: dc.mcc || "",
            phone: dc.phone || "",
            birthDate: dc.dataNascimentoAbertura
              ? new Date(dc.dataNascimentoAbertura).toISOString().slice(0, 10)
              : "",
            zip: en.zip || "",
            street: en.street || "",
            number: en.number || "",
            complement: en.complement || "",
            neighborhood: en.neighborhood || "",
            city: en.city || "",
            state: en.state || "",
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fmtDate = (s?: string | null) => {
    if (!s) return "—";
    const d = new Date(s);
    if (isNaN(d.getTime())) return s || "—";
    return d.toLocaleDateString("pt-BR");
  };

  const fmtDoc = (raw?: string | null) => {
    if (!raw) return "—";
    const c = raw.replace(/\D/g, "");
    if (c.length === 11)
      return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    if (c.length === 14)
      return c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    return raw;
  };

  const fmtPhone = (v: string) => {
    const c = v.replace(/\D/g, "").slice(0, 11);
    if (c.length <= 2) return c;
    if (c.length <= 7) return `(${c.slice(0, 2)}) ${c.slice(2)}`;
    return `(${c.slice(0, 2)}) ${c.slice(2, 7)}-${c.slice(7)}`;
  };

  const lookupCep = async (cep: string) => {
    const c = cep.replace(/\D/g, "");
    if (c.length !== 8) return;
    setCepLoading(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${c}/json/`);
      const j = await r.json();
      if (j && !j.erro) {
        setForm((f) => ({
          ...f,
          street: j.logradouro || f.street,
          neighborhood: j.bairro || f.neighborhood,
          city: j.localidade || f.city,
          state: j.uf || f.state,
        }));
      } else {
        toast.error("CEP não encontrado");
      }
    } catch {
      toast.error("Erro ao consultar CEP");
    } finally {
      setCepLoading(false);
    }
  };

  const copyId = () => {
    const id = seller?.id?.slice(0, 12) || seller?.id || "";
    navigator.clipboard.writeText(id);
    toast.success("ID copiado");
  };

  const save = async () => {
    if (!form.zip || form.zip.replace(/\D/g, "").length !== 8) {
      toast.error("Informe um CEP válido.");
      return;
    }
    if (!form.number.trim()) {
      toast.error("Informe o número.");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const r = await axios.post(
        `${API}/api/user/kyc/address`,
        {
          zip: form.zip,
          street: form.street,
          number: form.number,
          complement: form.complement,
          neighborhood: form.neighborhood,
          city: form.city,
          state: form.state,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        toast.success("Alterações salvas!");
      } else {
        toast.error(r.data?.message || "Erro ao salvar.");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  // ---- componentes locais ----
  const SectionIcon = ({
    children,
    bg,
    color,
  }: {
    children: React.ReactNode;
    bg: string;
    color: string;
  }) => (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
      style={{
        background: bg,
        color,
      }}
    >
      {children}
    </div>
  );

  const ReadField = ({
    icon,
    label,
    value,
    extra,
  }: {
    icon: React.ReactNode;
    label: string;
    value?: React.ReactNode;
    extra?: React.ReactNode;
  }) => (
    <div
      className="py-3.5"
      style={{ borderBottom: `1px solid ${T.borderSoft}` }}
    >
      <div
        className="mb-1 flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-wider"
        style={{ color: T.textMuted }}
      >
        <span style={{ color: T.primary }}>{icon}</span>
        {label}
      </div>
      <div
        className="flex items-center gap-2 text-[13.5px] font-semibold"
        style={{ color: T.text }}
      >
        {value || "—"}
        {extra}
      </div>
    </div>
  );

  const inputCls =
    "h-11 w-full rounded-xl border bg-white px-3 text-[13px] outline-none transition-colors focus:border-violet-300 focus:ring-2 focus:ring-violet-100";

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label
      className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider"
      style={{ color: T.textMuted }}
    >
      {children}
    </label>
  );

  return (
    <>
      <Head>
        <title>ShadowPay — Perfil</title>
      </Head>
      <LightShell>
        <ProfileTabs />

        {loading ? (
          <div
            className="rounded-2xl p-10 text-center text-sm text-slate-500"
            style={{
              background: T.card,
              border: `1px solid ${T.borderSoft}`,
            }}
          >
            Carregando…
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* ============ ESQUERDA — Minha Conta ============ */}
            <div
              className="rounded-2xl p-4 sm:p-6"
              style={{
                background: T.card,
                border: `1px solid ${T.borderSoft}`,
                boxShadow:
                  "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
              }}
            >
              <div className="mb-5 flex items-center gap-3">
                <SectionIcon bg={T.primarySoft} color={T.primary}>
                  <User className="h-5 w-5" />
                </SectionIcon>
                <div>
                  <p className="text-[16px] font-bold text-slate-900">
                    Minha Conta
                  </p>
                  <p className="text-[12px] text-slate-500">
                    Informações básicas
                  </p>
                </div>
              </div>

              <div className="space-y-0">
                <ReadField
                  icon={<User className="h-3.5 w-3.5" />}
                  label="Nome"
                  value={seller?.companyName}
                />
                <ReadField
                  icon={<Hash className="h-3.5 w-3.5" />}
                  label="ID / Hash da conta"
                  value={
                    <span className="font-mono text-[12.5px]">
                      {seller?.id?.slice(0, 10) || "—"}
                    </span>
                  }
                  extra={
                    <button
                      onClick={copyId}
                      className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-violet-50 hover:text-violet-600"
                      aria-label="Copiar ID"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  }
                />
                <ReadField
                  icon={<Cake className="h-3.5 w-3.5" />}
                  label="Data de Nascimento"
                  value={fmtDate(kyc?.dadosCadastrais?.dataNascimentoAbertura)}
                />
                <ReadField
                  icon={<Mail className="h-3.5 w-3.5" />}
                  label="E-mail"
                  value={seller?.email}
                />
                <ReadField
                  icon={<IdCard className="h-3.5 w-3.5" />}
                  label="Documento"
                  value={
                    <span className="flex items-center gap-2">
                      <span>{fmtDoc(seller?.cpf_cnpj)}</span>
                      <span
                        className="inline-block rounded-md px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          background: T.blueSoft,
                          color: T.blue,
                        }}
                      >
                        {String(seller?.cpf_cnpj || "").replace(/\D/g, "")
                          .length === 14
                          ? "Pessoa Jurídica"
                          : "Pessoa Física"}
                      </span>
                    </span>
                  }
                />
              </div>
            </div>

            {/* ============ DIREITA — Dados Cadastrais ============ */}
            <div
              className="rounded-2xl p-4 sm:p-6"
              style={{
                background: T.card,
                border: `1px solid ${T.borderSoft}`,
                boxShadow:
                  "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
              }}
            >
              <div className="mb-5 flex items-center gap-3">
                <SectionIcon bg={T.greenSoft} color={T.green}>
                  <Pencil className="h-5 w-5" />
                </SectionIcon>
                <div>
                  <p className="text-[16px] font-bold text-slate-900">
                    Dados Cadastrais
                  </p>
                  <p className="text-[12px] text-slate-500">
                    Atualize suas informações
                  </p>
                </div>
              </div>

              {/* MCC */}
              <div className="mb-5">
                <div
                  className="mb-2 flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-wider"
                  style={{ color: T.text2 }}
                >
                  <Briefcase
                    className="h-3.5 w-3.5"
                    style={{ color: T.primary }}
                  />
                  Categoria do Negócio (MCC)
                </div>
                <Label>Selecione a categoria</Label>
                <select
                  value={form.mcc}
                  onChange={(e) => setForm({ ...form, mcc: e.target.value })}
                  className={inputCls}
                  style={{ borderColor: T.inputBorder }}
                >
                  <option value="">Selecione…</option>
                  {MCC_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <p
                  className="mt-1.5 text-[11px]"
                  style={{ color: T.textMuted }}
                >
                  O MCC identifica o tipo de negócio da sua empresa
                </p>
              </div>

              <div
                className="my-5 h-px w-full"
                style={{ background: T.borderSoft }}
              />

              {/* Dados pessoais */}
              <div className="mb-5">
                <div
                  className="mb-3 flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-wider"
                  style={{ color: T.text2 }}
                >
                  <Phone
                    className="h-3.5 w-3.5"
                    style={{ color: T.primary }}
                  />
                  Dados pessoais
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label>Telefone</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[16px]">
                        🇧🇷
                      </span>
                      <input
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: fmtPhone(e.target.value) })
                        }
                        placeholder="+55 14 99813 9670"
                        className={inputCls}
                        style={{
                          borderColor: T.inputBorder,
                          paddingLeft: 44,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Data Nascimento</Label>
                    <div className="relative">
                      <Calendar
                        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                        style={{ color: T.primary }}
                      />
                      <input
                        type="date"
                        value={form.birthDate}
                        onChange={(e) =>
                          setForm({ ...form, birthDate: e.target.value })
                        }
                        className={inputCls}
                        style={{ borderColor: T.inputBorder, paddingLeft: 36 }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="my-5 h-px w-full"
                style={{ background: T.borderSoft }}
              />

              {/* Endereço */}
              <div className="mb-5">
                <div
                  className="mb-3 flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-wider"
                  style={{ color: T.text2 }}
                >
                  <MapPin
                    className="h-3.5 w-3.5"
                    style={{ color: T.primary }}
                  />
                  Endereço
                </div>

                <div className="mb-3">
                  <Label>CEP</Label>
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                      style={{ color: T.textMuted }}
                    />
                    <input
                      value={form.zip}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                        const fmt =
                          v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v;
                        setForm({ ...form, zip: fmt });
                        if (v.length === 8) lookupCep(v);
                      }}
                      placeholder="00000-000"
                      className={inputCls}
                      style={{ borderColor: T.inputBorder, paddingLeft: 36 }}
                    />
                    {cepLoading && (
                      <span
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px]"
                        style={{ color: T.textMuted }}
                      >
                        …
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px]">
                  <div>
                    <Label>Logradouro</Label>
                    <input
                      value={form.street}
                      onChange={(e) =>
                        setForm({ ...form, street: e.target.value })
                      }
                      placeholder="Rua das Violetas"
                      className={inputCls}
                      style={{ borderColor: T.inputBorder }}
                    />
                  </div>
                  <div>
                    <Label>Número</Label>
                    <input
                      value={form.number}
                      onChange={(e) =>
                        setForm({ ...form, number: e.target.value })
                      }
                      placeholder="94"
                      className={inputCls}
                      style={{ borderColor: T.inputBorder }}
                    />
                  </div>
                </div>

                <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label>Bairro</Label>
                    <input
                      value={form.neighborhood}
                      onChange={(e) =>
                        setForm({ ...form, neighborhood: e.target.value })
                      }
                      placeholder="Park Residencial Convívio"
                      className={inputCls}
                      style={{ borderColor: T.inputBorder }}
                    />
                  </div>
                  <div>
                    <Label>Complemento (opcional)</Label>
                    <input
                      value={form.complement}
                      onChange={(e) =>
                        setForm({ ...form, complement: e.target.value })
                      }
                      placeholder="Apto 12"
                      className={inputCls}
                      style={{ borderColor: T.inputBorder }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_100px]">
                  <div>
                    <Label>Cidade</Label>
                    <input
                      value={form.city}
                      onChange={(e) =>
                        setForm({ ...form, city: e.target.value })
                      }
                      placeholder="Botucatu"
                      className={inputCls}
                      style={{ borderColor: T.inputBorder }}
                    />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <select
                      value={form.state}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          state: e.target.value.toUpperCase(),
                        })
                      }
                      className={inputCls}
                      style={{ borderColor: T.inputBorder }}
                    >
                      <option value="">UF</option>
                      {[
                        "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT",
                        "MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO",
                        "RR","SC","SP","SE","TO",
                      ].map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div
                className="my-5 h-px w-full"
                style={{ background: T.borderSoft }}
              />

              {/* SALVAR */}
              <div className="flex justify-end">
                <button
                  onClick={save}
                  disabled={saving}
                  className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-[12.5px] font-bold uppercase tracking-wider transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                  style={{
                    background: T.primary,
                    color: "#FFFFFF",
                    boxShadow: "0 8px 20px -8px rgba(124,58,237,0.55)",
                  }}
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Salvando…" : "Salvar Alterações"}
                </button>
              </div>
            </div>
          </div>
        )}
      </LightShell>
      <ShadowPanel />
    </>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
