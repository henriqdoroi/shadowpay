"use client";

import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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

  // 🔒 Bloqueia scroll quando o componente estiver montado
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // ✅ Funções auxiliares
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
    return cleanValue
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{3})\d+?$/, "$1");
  };

  const applyPhoneMask = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    return cleanValue
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const removeMask = (value: string) => value.replace(/\D/g, "");

  // ✅ Validações
  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = (password: string) =>
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);

  const validateCpfCnpj = (value: string) => {
    const v = removeMask(value);
    if (v.length === 11) {
      // Validação de CPF
      let sum = 0;
      let rest;
      if (/^(\d)\1+$/.test(v)) return false;
      for (let i = 1; i <= 9; i++)
        sum += parseInt(v.substring(i - 1, i)) * (11 - i);
      rest = (sum * 10) % 11;
      if (rest === 10 || rest === 11) rest = 0;
      if (rest !== parseInt(v.substring(9, 10))) return false;
      sum = 0;
      for (let i = 1; i <= 10; i++)
        sum += parseInt(v.substring(i - 1, i)) * (12 - i);
      rest = (sum * 10) % 11;
      if (rest === 10 || rest === 11) rest = 0;
      return rest === parseInt(v.substring(10, 11));
    } else if (v.length === 14) {
      // Validação de CNPJ
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
      toast.error(
        "Você deve aceitar os termos de uso e política de privacidade."
      );
      return;
    }

    if (!validateEmail(formData.email)) {
      toast.error("E-mail inválido.");
      return;
    }

    if (!validatePassword(formData.password)) {
      toast.error(
        "A senha deve ter no mínimo 8 caracteres, incluindo 1 letra maiúscula, 1 número e 1 símbolo."
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
          if (permission === "granted") {
            toast.success("Notificações ativadas!");
          } else {
            toast("Notificações não ativadas.");
          }
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-800">
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
        linear-gradient(rgba(155, 92, 251, 0.3) 1px, transparent 1px),
        linear-gradient(90deg, rgba(155, 92, 251, 0.3) 1px, transparent 1px)
      `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Blur Effects */}
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#9b5cfb]/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-[#9b5cfb]/20 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-11 flex flex-col lg:flex-row items-center justify-center min-h-screen px-4 pt-4 pb-8">
        {/* Logo (esquerda em desktop) */}
        <div className="hidden lg:flex lg:w-2/5 items-center justify-center">
          <Image
            src="/safira-logo.png"
            alt="Safira Cash Logo"
            width={320}
            height={90}
            className="w-72 lg:w-80 h-auto"
          />
        </div>

        {/* Formulário (direita em desktop) */}
        <div className="w-full max-w-md lg:max-w-lg flex-1">
          <Card className="bg-neutral-800/50 border-neutral-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-center text-white text-xl">
                Crie sua conta!
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {/* Razão social */}
                <div className="space-y-2">
                  <Label htmlFor="razao-social" className="text-white">
                    Razão social
                  </Label>
                  <Input
                    id="razao-social"
                    type="text"
                    placeholder="Digite a razão social"
                    value={formData.companyName}
                    onChange={(e) =>
                      handleInputChange("companyName", e.target.value)
                    }
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/60 focus:border-[#6114fa] focus:ring-[#6114fa]/20"
                    required
                  />
                </div>

                {/* Email e WhatsApp */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Digite seu e-mail"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/60 focus:border-[#6114fa] focus:ring-[#6114fa]/20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="text-white">
                      WhatsApp
                    </Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={formData.number}
                      onChange={(e) =>
                        handleInputChange("number", e.target.value)
                      }
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/60 focus:border-[#6114fa] focus:ring-[#6114fa]/20"
                      maxLength={15}
                      required
                    />
                  </div>
                </div>

                {/* Senha */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/60 focus:border-[#6114fa] focus:ring-[#6114fa]/20"
                    minLength={6}
                    required
                  />
                </div>

                {/* CPF/CNPJ e CEP */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf_cnpj" className="text-white">
                      CPF/CNPJ
                    </Label>
                    <Input
                      id="cpf_cnpj"
                      type="text"
                      placeholder="00.000.000/0000-00"
                      value={formData.cpf_cnpj}
                      onChange={(e) =>
                        handleInputChange("cpf_cnpj", e.target.value)
                      }
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/60 focus:border-[#6114fa] focus:ring-[#6114fa]/20"
                      maxLength={18}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep" className="text-white">
                      CEP
                    </Label>
                    <Input
                      id="cep"
                      type="text"
                      placeholder="00000-000"
                      value={formData.zipCode}
                      onChange={(e) =>
                        handleInputChange("zipCode", e.target.value)
                      }
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/60 focus:border-[#6114fa] focus:ring-[#6114fa]/20"
                      maxLength={9}
                      required
                    />
                  </div>
                </div>

                {/* Tipo de Empresa e Ramo de atuação */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Tipo de Empresa</Label>
                    <Select
                      value={formData.companyModality}
                      onValueChange={(value) =>
                        handleSelectChange("companyModality", value)
                      }
                    >
                      <SelectTrigger className="bg-white/5 border-white/20 text-white h-10 w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-neutral-700">
                        <SelectItem value="MEI" className="text-white">
                          MEI
                        </SelectItem>
                        <SelectItem value="LTDA" className="text-white">
                          LTDA
                        </SelectItem>
                        <SelectItem value="SA" className="text-white">
                          SA
                        </SelectItem>
                        <SelectItem value="EIRELI" className="text-white">
                          EIRELI
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Ramo de atuação</Label>
                    <Select
                      value={formData.companyActivity}
                      onValueChange={(value) =>
                        handleSelectChange("companyActivity", value)
                      }
                    >
                      <SelectTrigger className="bg-white/5 border-white/20 text-white h-10 w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-neutral-700">
                        <SelectItem value="IGAMING" className="text-white">
                          iGaming
                        </SelectItem>
                        <SelectItem value="ECOMMERCE" className="text-white">
                          E-Commerce
                        </SelectItem>
                        <SelectItem value="TECHNOLOGY" className="text-white">
                          Tech
                        </SelectItem>
                        <SelectItem value="SAAS" className="text-white">
                          SAAS
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Checkbox de termos */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) =>
                      setTermsAccepted(checked as boolean)
                    }
                    className="border-white/20 data-[state=checked]:bg-[#6114fa] data-[state=checked]:border-[#6114fa] mt-0.5 flex-shrink-0"
                  />
                  <Label
                    htmlFor="terms"
                    className="text-sm text-white leading-relaxed flex-1"
                  >
                    Li e aceito os{" "}
                    <Link
                      href="https://safiracash.com.br/termos"
                      className="text-[#6114fa] hover:text-[#6114fa/80] transition-colors underline"
                    >
                      Termos de Uso
                    </Link>{" "}
                    e{" "}
                    <Link
                      href="https://safiracash.com.br/privacidade"
                      className="text-[#6114fa] hover:text-[#6114fa/80] transition-colors underline"
                    >
                      Política de Privacidade
                    </Link>
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#6114fa] hover:bg-[#6114fa/80] text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? "Criando conta..." : "Criar conta"}
                </Button>
              </CardContent>
            </form>
            <CardFooter className="flex flex-col space-y-4">
              <div className="flex items-center w-full">
                <Separator className="flex-1 bg-neutral-600" />
                <span className="px-4 text-sm text-neutral-400">ou</span>
                <Separator className="flex-1 bg-neutral-600" />
              </div>
              <div className="text-center">
                <span className="text-sm text-neutral-400">
                  Já tem uma conta?{" "}
                </span>
                <Link
                  href="/auth/jwt/login"
                  className="text-sm text-[#6114fa] hover:text-[#6114fa/80] transition-colors"
                >
                  Fazer login
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
