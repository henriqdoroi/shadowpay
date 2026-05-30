"use client";

/**
 * /v1/configs/profile — Perfil dark glassy violeta.
 * Layout 2 colunas:
 *   esq: "Minha Conta" — infos básicas read-only
 *   dir: "Dados Cadastrais" — form editável (MCC, telefone, nascimento, endereço)
 */

import { useEffect, useState } from "react";
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
import {
  DarkConfigShell,
  DarkCard,
  SectionHeader,
  DARK_T,
  darkInputCls,
  darkInputStyle,
  DarkLabel,
  StatusPill,
} from "@/components/DarkConfigShell";

const API = "https://shadowpay-api-production.up.railway.app";

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

  // form editável
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

  // fetch perfil + kyc
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
          axios.get(`${API}/api/user/kyc`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => null),
        ]);
        if (pr.data?.success) setSeller(pr.data.data);
        if (kr?.data?.success) {
          setKyc(kr.data.data);
          // hidrata form com dados existentes
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

  // formata data
  const fmtDate = (s?: string | null) => {
    if (!s) return "—";
    const d = new Date(s);
    if (isNaN(d.getTime())) return s || "—";
    return d.toLocaleDateString("pt-BR");
  };

  // formata CPF/CNPJ
  const fmtDoc = (raw?: string | null) => {
    if (!raw) return "—";
    const c = raw.replace(/\D/g, "");
    if (c.length === 11)
      return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    if (c.length === 14)
      return c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    return raw;
  };

  // formata telefone
  const fmtPhone = (v: string) => {
    const c = v.replace(/\D/g, "").slice(0, 11);
    if (c.length <= 2) return c;
    if (c.length <= 7) return `(${c.slice(0, 2)}) ${c.slice(2)}`;
    return `(${c.slice(0, 2)}) ${c.slice(2, 7)}-${c.slice(7)}`;
  };

  // lookup CEP
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
    const id = seller?.id?.slice(0, 8) || seller?.id;
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

  // ---- field component (read-only, esquerda)
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
    <div className="py-3" style={{ borderBottom: `1px solid ${DARK_T.cardBorder}` }}>
      <div
        className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: DARK_T.textMuted }}
      >
        <span style={{ color: DARK_T.primary }}>{icon}</span>
        {label}
      </div>
      <div
        className="flex items-center gap-2 text-[14px] font-medium"
        style={{ color: DARK_T.text }}
      >
        {value || "—"}
        {extra}
      </div>
    </div>
  );

  return (
    <>
      <Head>
        <title>ShadowPay — Minha Conta</title>
      </Head>
      <LightShell>
        <DarkConfigShell>
          <ProfileTabs />

          {loading ? (
            <DarkCard className="p-10 text-center" style={{ color: DARK_T.textMuted }}>
              Carregando…
            </DarkCard>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* ============ ESQUERDA — Minha Conta ============ */}
              <DarkCard className="p-6">
                <SectionHeader
                  icon={<User className="h-5 w-5" />}
                  title="Minha Conta"
                  subtitle="Informações básicas"
                />

                <div className="space-y-0">
                  <ReadField
                    icon={<User className="h-3.5 w-3.5" />}
                    label="Nome"
                    value={seller?.companyName}
                  />
                  <ReadField
                    icon={<Hash className="h-3.5 w-3.5" />}
                    label="Id/Hash da conta"
                    value={
                      <span className="font-mono text-[13px]">
                        {seller?.id?.slice(0, 8) || "—"}
                      </span>
                    }
                    extra={
                      <button
                        onClick={copyId}
                        className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-violet-500/10"
                        style={{ color: DARK_T.textMuted }}
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
                      <span>
                        {fmtDoc(seller?.cpf_cnpj)}{" "}
                        <span
                          className="ml-2 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold"
                          style={{
                            background: DARK_T.blueSoft,
                            color: DARK_T.blue,
                          }}
                        >
                          {String(seller?.cpf_cnpj || "").replace(/\D/g, "").length === 14
                            ? "Pessoa Jurídica"
                            : "Pessoa Física"}
                        </span>
                      </span>
                    }
                  />
                </div>
              </DarkCard>

              {/* ============ DIREITA — Dados Cadastrais ============ */}
              <DarkCard className="relative p-6">
                <SectionHeader
                  icon={<Pencil className="h-5 w-5" />}
                  iconBg={DARK_T.greenSoft}
                  iconColor={DARK_T.green}
                  title="Dados Cadastrais"
                  subtitle="Atualize suas informações"
                />

                {/* MCC */}
                <div className="mb-5">
                  <div
                    className="mb-2 flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-wider"
                    style={{ color: DARK_T.text2 }}
                  >
                    <Briefcase className="h-3.5 w-3.5" style={{ color: DARK_T.primary }} />
                    Categoria do Negócio (MCC)
                  </div>
                  <DarkLabel>Selecione a categoria</DarkLabel>
                  <select
                    value={form.mcc}
                    onChange={(e) => setForm({ ...form, mcc: e.target.value })}
                    className={darkInputCls}
                    style={darkInputStyle}
                  >
                    <option value="">Selecione…</option>
                    {MCC_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[11px]" style={{ color: DARK_T.textMuted }}>
                    O MCC identifica o tipo de negócio da sua empresa
                  </p>
                </div>

                <div
                  className="my-5 h-px w-full"
                  style={{ background: DARK_T.cardBorder }}
                />

                {/* Dados pessoais */}
                <div className="mb-5">
                  <div
                    className="mb-3 flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-wider"
                    style={{ color: DARK_T.text2 }}
                  >
                    <Phone className="h-3.5 w-3.5" style={{ color: DARK_T.primary }} />
                    Dados pessoais
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <DarkLabel>&nbsp;</DarkLabel>
                      <div className="relative">
                        <span
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[16px]"
                          style={{ color: DARK_T.text }}
                        >
                          🇧🇷
                        </span>
                        <input
                          value={form.phone}
                          onChange={(e) =>
                            setForm({ ...form, phone: fmtPhone(e.target.value) })
                          }
                          placeholder="+55 14 99813 9670"
                          className={darkInputCls}
                          style={{ ...darkInputStyle, paddingLeft: 44 }}
                        />
                      </div>
                    </div>
                    <div>
                      <DarkLabel>Data Nascimento</DarkLabel>
                      <div className="relative">
                        <Calendar
                          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                          style={{ color: DARK_T.primary }}
                        />
                        <input
                          type="date"
                          value={form.birthDate}
                          onChange={(e) =>
                            setForm({ ...form, birthDate: e.target.value })
                          }
                          className={darkInputCls}
                          style={{
                            ...darkInputStyle,
                            paddingLeft: 36,
                            colorScheme: "dark",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="my-5 h-px w-full"
                  style={{ background: DARK_T.cardBorder }}
                />

                {/* Endereço */}
                <div className="mb-5">
                  <div
                    className="mb-3 flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-wider"
                    style={{ color: DARK_T.text2 }}
                  >
                    <MapPin className="h-3.5 w-3.5" style={{ color: DARK_T.primary }} />
                    Endereço
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_2fr_100px]">
                    {/* CEP */}
                    <div>
                      <DarkLabel>CEP</DarkLabel>
                      <div className="relative">
                        <Search
                          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                          style={{ color: DARK_T.textMuted }}
                        />
                        <input
                          value={form.zip}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                            const fmt = v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v;
                            setForm({ ...form, zip: fmt });
                            if (v.length === 8) lookupCep(v);
                          }}
                          placeholder="00000-000"
                          className={darkInputCls}
                          style={{ ...darkInputStyle, paddingLeft: 36 }}
                        />
                        {cepLoading && (
                          <span
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px]"
                            style={{ color: DARK_T.textMuted }}
                          >
                            …
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Logradouro */}
                    <div>
                      <DarkLabel>Logradouro</DarkLabel>
                      <input
                        value={form.street}
                        onChange={(e) => setForm({ ...form, street: e.target.value })}
                        placeholder="Rua das Violetas"
                        className={darkInputCls}
                        style={darkInputStyle}
                      />
                    </div>

                    {/* Número */}
                    <div>
                      <DarkLabel>Número</DarkLabel>
                      <input
                        value={form.number}
                        onChange={(e) => setForm({ ...form, number: e.target.value })}
                        placeholder="94"
                        className={darkInputCls}
                        style={darkInputStyle}
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <DarkLabel>Bairro</DarkLabel>
                      <input
                        value={form.neighborhood}
                        onChange={(e) =>
                          setForm({ ...form, neighborhood: e.target.value })
                        }
                        placeholder="Park Residencial Convívio"
                        className={darkInputCls}
                        style={darkInputStyle}
                      />
                    </div>
                    <div>
                      <DarkLabel>Complemento</DarkLabel>
                      <input
                        value={form.complement}
                        onChange={(e) =>
                          setForm({ ...form, complement: e.target.value })
                        }
                        placeholder="Apto 12 (Opcional)"
                        className={darkInputCls}
                        style={darkInputStyle}
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px]">
                    <div>
                      <DarkLabel>Cidade</DarkLabel>
                      <input
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        placeholder="Botucatu"
                        className={darkInputCls}
                        style={darkInputStyle}
                      />
                    </div>
                    <div>
                      <DarkLabel>Estado</DarkLabel>
                      <select
                        value={form.state}
                        onChange={(e) =>
                          setForm({ ...form, state: e.target.value.toUpperCase() })
                        }
                        className={darkInputCls}
                        style={darkInputStyle}
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

                {/* SALVAR ALTERAÇÕES */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={save}
                    disabled={saving}
                    className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-[12px] font-bold uppercase tracking-[0.1em] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                    style={{
                      background: "transparent",
                      color: DARK_T.primary,
                      border: `1px solid ${DARK_T.primary}`,
                    }}
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Salvando…" : "Salvar Alterações"}
                  </button>
                </div>
              </DarkCard>
            </div>
          )}
        </DarkConfigShell>
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
