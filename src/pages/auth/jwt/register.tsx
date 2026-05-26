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
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Radio } from "lucide-react";

const COLORS = { bg0: "#050816", bg1: "#0B1020", violet: "#8B5CF6", blue: "#3B82F6", indigo: "#6366F1" };
const inputCls =
  "h-11 border-white/10 bg-white/[0.04] text-white placeholder:text-white/30 focus-visible:border-[#8B5CF6] focus-visible:ring-[#8B5CF6]/25";
const labelCls = "text-xs font-medium uppercase tracking-wider text-white/50";

function ShadowMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="sg-register" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#A855F7" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21" stroke="url(#sg-register)" strokeWidth="2" opacity="0.6" />
      <circle cx="24" cy="24" r="8" fill="url(#sg-register)" />
      <circle cx="24" cy="24" r="13" stroke="url(#sg-register)" strokeWidth="1.5" opacity="0.35" />
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
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { register, isLoading } = useAuth();

  useEffect(() => setMounted(true), []);

  const particles = useMemo(
    () =>
      Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 2,
        delay: Math.random() * 5,
        duration: 6 + Math.random() * 8,
      })),
    [],
  );

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
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&f[]=satoshi@400,500,700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div
        className="relative min-h-screen w-full overflow-hidden text-white"
        style={{
          fontFamily: "'Satoshi', system-ui, sans-serif",
          background: `radial-gradient(1100px 650px at 50% -10%, ${COLORS.bg1} 0%, ${COLORS.bg0} 55%, #02030A 100%)`,
        }}
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-15%] h-[560px] w-[560px] -translate-x-1/2 rounded-full blur-[120px]"
          style={{ background: `radial-gradient(circle, ${COLORS.violet}50, transparent 60%)` }}
          animate={{ opacity: [0.4, 0.65, 0.4], scale: [1, 1.08, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute bottom-[-20%] right-[-10%] h-[480px] w-[480px] rounded-full blur-[120px]"
          style={{ background: `radial-gradient(circle, ${COLORS.blue}3a, transparent 60%)` }}
          animate={{ opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(800px 600px at 50% 30%, #000 30%, transparent 75%)",
          }}
        />
        {mounted &&
          particles.map((p) => (
            <motion.span
              key={p.id}
              aria-hidden
              className="pointer-events-none absolute rounded-full"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: p.size,
                height: p.size,
                background: "rgba(255,255,255,0.5)",
                boxShadow: "0 0 6px rgba(139,92,246,0.8)",
              }}
              animate={{ y: [0, -20, 0], opacity: [0, 0.7, 0] }}
              transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}

        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg"
          >
            <div className="mb-7 flex flex-col items-center">
              <div className="relative mb-4 flex items-center justify-center">
                <motion.div
                  className="absolute h-24 w-24 rounded-full blur-2xl"
                  style={{ background: `radial-gradient(circle, ${COLORS.violet}, transparent 65%)` }}
                  animate={{ opacity: [0.5, 0.9, 0.5], scale: [0.95, 1.1, 0.95] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <div
                  className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/15"
                  style={{
                    background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.16), rgba(255,255,255,0.02) 55%)",
                    boxShadow: "inset 0 0 24px rgba(139,92,246,0.4), 0 0 50px -12px rgba(139,92,246,0.6)",
                  }}
                >
                  <ShadowMark size={30} />
                </div>
              </div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                ShadowPay
              </h1>
              <div className="mt-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">
                <Radio className="h-3 w-3" style={{ color: COLORS.violet }} />
                Crie sua infraestrutura
              </div>
            </div>

            <div
              className="rounded-2xl border border-white/[0.08] p-7 backdrop-blur-xl"
              style={{ background: "rgba(255,255,255,0.03)", boxShadow: "0 30px 80px -40px rgba(139,92,246,0.5)" }}
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="razao-social" className={labelCls}>Razão social</Label>
                  <Input
                    id="razao-social"
                    type="text"
                    placeholder="Nome da empresa"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email" className={labelCls}>E-mail</Label>
                    <Input id="email" type="email" placeholder="seu@email.com" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} className={inputCls} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className={labelCls}>WhatsApp</Label>
                    <Input id="whatsapp" type="tel" placeholder="(11) 99999-9999" value={formData.number} onChange={(e) => handleInputChange("number", e.target.value)} className={inputCls} maxLength={15} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className={labelCls}>Senha</Label>
                  <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={(e) => handleInputChange("password", e.target.value)} className={inputCls} minLength={6} required />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cpf_cnpj" className={labelCls}>CPF/CNPJ</Label>
                    <Input id="cpf_cnpj" type="text" placeholder="00.000.000/0000-00" value={formData.cpf_cnpj} onChange={(e) => handleInputChange("cpf_cnpj", e.target.value)} className={inputCls} maxLength={18} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep" className={labelCls}>CEP</Label>
                    <Input id="cep" type="text" placeholder="00000-000" value={formData.zipCode} onChange={(e) => handleInputChange("zipCode", e.target.value)} className={inputCls} maxLength={9} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className={labelCls}>Tipo de empresa</Label>
                    <Select value={formData.companyModality} onValueChange={(value) => handleSelectChange("companyModality", value)}>
                      <SelectTrigger className="h-11 w-full border-white/10 bg-white/[0.04] text-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#0B1020] text-white">
                        <SelectItem value="MEI">MEI</SelectItem>
                        <SelectItem value="LTDA">LTDA</SelectItem>
                        <SelectItem value="SA">SA</SelectItem>
                        <SelectItem value="EIRELI">EIRELI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className={labelCls}>Ramo de atuação</Label>
                    <Select value={formData.companyActivity} onValueChange={(value) => handleSelectChange("companyActivity", value)}>
                      <SelectTrigger className="h-11 w-full border-white/10 bg-white/[0.04] text-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#0B1020] text-white">
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
                    className="mt-0.5 shrink-0 border-white/20 data-[state=checked]:border-[#8B5CF6] data-[state=checked]:bg-[#8B5CF6]"
                  />
                  <Label htmlFor="terms" className="flex-1 text-sm leading-relaxed text-white/55">
                    Li e aceito os{" "}
                    <Link href="https://safiracash.com.br/termos" className="text-[#A855F7] underline hover:text-[#C084FC]">Termos de Uso</Link>{" "}
                    e a{" "}
                    <Link href="https://safiracash.com.br/privacidade" className="text-[#A855F7] underline hover:text-[#C084FC]">Política de Privacidade</Link>
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="group relative h-11 w-full overflow-hidden rounded-xl border-0 font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
                  style={{
                    background: `linear-gradient(120deg, ${COLORS.violet}, ${COLORS.indigo})`,
                    boxShadow: "0 14px 36px -12px rgba(139,92,246,0.7)",
                  }}
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" aria-hidden />
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Criando conta…</span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">Criar conta <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
                  )}
                </Button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">ou</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <p className="text-center text-sm text-white/45">
                Já tem uma conta?{" "}
                <Link href="/auth/jwt/login" className="font-medium text-[#A855F7] hover:text-[#C084FC]">
                  Fazer login
                </Link>
              </p>
            </div>

            <p className="mt-6 text-center text-[10px] uppercase tracking-[0.3em] text-white/20">
              Elite Financial Infrastructure
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}
