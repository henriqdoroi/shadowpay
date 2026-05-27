"use client";

import Head from "next/head";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";

const T = {
  bg: "#F1F3F8",
  surface: "#FFFFFF",
  inputBg: "#F8FAFC",
  text: "#0F172A",
  text2: "#475569",
  text3: "#94A3B8",
  primary: "#7C3AED",
  primaryStrong: "#6D28D9",
  border: "rgba(15, 23, 42, 0.08)",
};

const inputCls = "h-11";
const inputStyle: React.CSSProperties = {
  background: T.inputBg,
  border: `1px solid ${T.border}`,
  color: T.text,
};
const labelCls = "text-xs font-medium uppercase tracking-wider";
const labelStyle: React.CSSProperties = { color: T.text2 };

function ShadowMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="sg-register" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21" stroke="url(#sg-register)" strokeWidth="2" opacity="0.5" />
      <circle cx="24" cy="24" r="8" fill="url(#sg-register)" />
      <circle cx="24" cy="24" r="13" stroke="url(#sg-register)" strokeWidth="1.5" opacity="0.3" />
    </svg>
  );
}

interface FormData {
  companyName: string;
  email: string;
  password: string;
  cpf_cnpj: string;
  number: string;
  zipCode: string;
  companyModality: string;
  companyActivity: string;
}

export default function Register() {
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    email: "",
    password: "",
    cpf_cnpj: "",
    number: "",
    zipCode: "",
    companyModality: "",
    companyActivity: "",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const router = useRouter();
  const { register, isLoading } = useAuth();

  // Máscaras
  const applyCpfcnpjMask = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    if (cleanValue.length <= 11) {
      return cleanValue
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      return cleanValue
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
    }
  };
  const applyCepMask = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    return cleanValue.replace(/(\d{5})(\d)/, "$1-$2").replace(/(-\d{3})\d+?$/, "$1");
  };
  const applyPhoneMask = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    return cleanValue
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };
  const removeMask = (value: string) => value.replace(/\D/g, "");

  // Validações
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string) =>
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
  const validateCpfCnpj = (value: string) => {
    const v = removeMask(value);
    if (v.length === 11) {
      let sum = 0;
      let rest;
      if (/^(\d)\1+$/.test(v)) return false;
      for (let i = 1; i <= 9; i++) sum += parseInt(v.substring(i - 1, i)) * (11 - i);
      rest = (sum * 10) % 11;
      if (rest === 10 || rest === 11) rest = 0;
      if (rest !== parseInt(v.substring(9, 10))) return false;
      sum = 0;
      for (let i = 1; i <= 10; i++) sum += parseInt(v.substring(i - 1, i)) * (12 - i);
      rest = (sum * 10) % 11;
      if (rest === 10 || rest === 11) rest = 0;
      return rest === parseInt(v.substring(10, 11));
    } else if (v.length === 14) {
      let length = v.length - 2;
      let numbers = v.substring(0, length);
      const digits = v.substring(length);
      let sum = 0;
      let pos = length - 7;
      for (let i = length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
      }
      let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
      if (result !== parseInt(digits.charAt(0))) return false;
      length = length + 1;
      numbers = v.substring(0, length);
      sum = 0;
      pos = length - 7;
      for (let i = length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
      }
      result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
      return result === parseInt(digits.charAt(1));
    }
    return false;
  };
  const validateCep = async (cep: string) => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      return !data.erro;
    } catch {
      return false;
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    let maskedValue = value;
    if (field === "cpf_cnpj") maskedValue = applyCpfcnpjMask(value);
    else if (field === "zipCode") maskedValue = applyCepMask(value);
    else if (field === "number") maskedValue = applyPhoneMask(value);
    setFormData((prev) => ({ ...prev, [field]: maskedValue }));
  };
  const handleSelectChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast.error("Você deve aceitar os termos de uso e política de privacidade.");
      return;
    }
    if (!validateEmail(formData.email)) {
      toast.error("E-mail inválido.");
      return;
    }
    if (!validatePassword(formData.password)) {
      toast.error(
        "A senha deve ter no mínimo 8 caracteres, incluindo 1 letra maiúscula, 1 número e 1 símbolo.",
      );
      return;
    }
    if (!validateCpfCnpj(formData.cpf_cnpj)) {
      toast.error("CPF/CNPJ inválido.");
      return;
    }
    const cepValid = await validateCep(removeMask(formData.zipCode));
    if (!cepValid) {
      toast.error("CEP inválido.");
      return;
    }

    const dataToSend = {
      companyName: formData.companyName,
      email: formData.email,
      password: formData.password,
      cpf_cnpj: removeMask(formData.cpf_cnpj),
      number: removeMask(formData.number),
      zipCode: removeMask(formData.zipCode),
      companyModality: formData.companyModality,
      companyActivity: formData.companyActivity,
    };

    const result = await register(dataToSend);
    if (result.success) {
      toast.success("Conta criada com sucesso! Redirecionando...");
      if ("Notification" in window && Notification.permission === "default") {
        try {
          const permission = await Notification.requestPermission();
          if (permission === "granted") toast.success("Notificações ativadas!");
          else toast("Notificações não ativadas.");
        } catch (err) {
          console.error("Erro ao solicitar permissão de notificação", err);
        }
      }
      router.push("/v1/dashboard");
    } else {
      toast.error(result.error || "Erro ao criar conta. Tente novamente.");
    }
  };

  return (
    <>
      <Head>
        <title>ShadowPay — Criar conta</title>
      </Head>

      <div
        className="relative min-h-screen w-full overflow-hidden"
        style={{
          fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
          background: T.bg,
          color: T.text,
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-30%] h-[600px] w-[800px] -translate-x-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 60%)",
            filter: "blur(40px)",
          }}
        />

        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg"
          >
            <div className="mb-7 flex flex-col items-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-[0_8px_24px_-12px_rgba(124,58,237,0.4),0_2px_8px_rgba(15,23,42,0.06)]">
                <ShadowMark size={36} />
              </div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif", color: T.text }}
              >
                ShadowPay
              </h1>
              <div
                className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.3em]"
                style={{ color: T.text3 }}
              >
                <ShieldCheck className="h-3 w-3" style={{ color: T.primary }} />
                Crie sua infraestrutura
              </div>
            </div>

            <div
              className="rounded-2xl p-7"
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                boxShadow:
                  "0 1px 2px rgba(15,23,42,0.04), 0 12px 32px -12px rgba(15,23,42,0.12)",
              }}
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="razao-social" className={labelCls} style={labelStyle}>
                    Razão social
                  </Label>
                  <Input
                    id="razao-social"
                    type="text"
                    placeholder="Nome da empresa"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    className={inputCls}
                    style={inputStyle}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className={labelCls} style={labelStyle}>
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={inputCls}
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="whatsapp" className={labelCls} style={labelStyle}>
                      WhatsApp
                    </Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={formData.number}
                      onChange={(e) => handleInputChange("number", e.target.value)}
                      className={inputCls}
                      style={inputStyle}
                      maxLength={15}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className={labelCls} style={labelStyle}>
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={inputCls}
                    style={inputStyle}
                    minLength={6}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="cpf_cnpj" className={labelCls} style={labelStyle}>
                      CPF/CNPJ
                    </Label>
                    <Input
                      id="cpf_cnpj"
                      type="text"
                      placeholder="00.000.000/0000-00"
                      value={formData.cpf_cnpj}
                      onChange={(e) => handleInputChange("cpf_cnpj", e.target.value)}
                      className={inputCls}
                      style={inputStyle}
                      maxLength={18}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cep" className={labelCls} style={labelStyle}>
                      CEP
                    </Label>
                    <Input
                      id="cep"
                      type="text"
                      placeholder="00000-000"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange("zipCode", e.target.value)}
                      className={inputCls}
                      style={inputStyle}
                      maxLength={9}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className={labelCls} style={labelStyle}>
                      Tipo de empresa
                    </Label>
                    <Select
                      value={formData.companyModality}
                      onValueChange={(value) => handleSelectChange("companyModality", value)}
                    >
                      <SelectTrigger className="h-11 w-full" style={inputStyle}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEI">MEI</SelectItem>
                        <SelectItem value="LTDA">LTDA</SelectItem>
                        <SelectItem value="SA">SA</SelectItem>
                        <SelectItem value="EIRELI">EIRELI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls} style={labelStyle}>
                      Ramo de atuação
                    </Label>
                    <Select
                      value={formData.companyActivity}
                      onValueChange={(value) => handleSelectChange("companyActivity", value)}
                    >
                      <SelectTrigger className="h-11 w-full" style={inputStyle}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IGAMING">iGaming</SelectItem>
                        <SelectItem value="ECOMMERCE">E-Commerce</SelectItem>
                        <SelectItem value="TECHNOLOGY">Tech</SelectItem>
                        <SelectItem value="SAAS">SAAS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-1">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                    className="mt-0.5 shrink-0"
                  />
                  <Label
                    htmlFor="terms"
                    className="flex-1 text-sm leading-relaxed"
                    style={{ color: T.text2 }}
                  >
                    Li e aceito os{" "}
                    <Link
                      href="https://safiracash.com.br/termos"
                      className="underline hover:opacity-80"
                      style={{ color: T.primary }}
                    >
                      Termos de Uso
                    </Link>{" "}
                    e a{" "}
                    <Link
                      href="https://safiracash.com.br/privacidade"
                      className="underline hover:opacity-80"
                      style={{ color: T.primary }}
                    >
                      Política de Privacidade
                    </Link>
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="group relative h-11 w-full overflow-hidden rounded-xl border-0 font-semibold transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
                  style={{
                    background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
                    color: "#FFFFFF",
                    boxShadow: "0 12px 28px -12px rgba(124,58,237,0.5)",
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Criando conta…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Criar conta
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1" style={{ background: T.border }} />
                <span
                  className="text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: T.text3 }}
                >
                  ou
                </span>
                <div className="h-px flex-1" style={{ background: T.border }} />
              </div>

              <p className="text-center text-sm" style={{ color: T.text2 }}>
                Já tem uma conta?{" "}
                <Link
                  href="/auth/jwt/login"
                  className="font-medium hover:opacity-80"
                  style={{ color: T.primary }}
                >
                  Fazer login
                </Link>
              </p>
            </div>

            <p
              className="mt-6 text-center text-[10px] uppercase tracking-[0.3em]"
              style={{ color: T.text3 }}
            >
              Elite Financial Infrastructure
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}
