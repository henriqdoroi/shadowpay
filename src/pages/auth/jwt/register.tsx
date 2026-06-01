"use client";

/**
 * /auth/jwt/register — cadastro enxuto estilo SyncPay (tema white).
 *
 * Coleta só: Nome completo, E-mail, Telefone (WhatsApp), Senha, Confirmar.
 * CNPJ / endereço / dados da empresa entram depois no KYC obrigatório
 * (popup travado que aparece no dashboard).
 */

import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

const PRIMARY = "#7C3AED";
const BORDER = "rgba(15,23,42,0.12)";

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length === 3) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneDigits = phone.replace(/\D/g, "");
    if (!name.trim()) return toast.error("Informe seu nome completo.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return toast.error("Informe um e-mail válido.");
    if (phoneDigits.length < 10) return toast.error("Informe um telefone válido.");
    if (password.length < 8)
      return toast.error("A senha precisa de pelo menos 8 caracteres.");
    if (password !== confirm) return toast.error("As senhas não coincidem.");
    if (!agree) return toast.error("Você precisa aceitar os termos.");

    setLoading(true);
    const res = await register({
      companyName: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      number: phoneDigits,
    });
    setLoading(false);

    if (res.success) {
      toast.success("Conta criada! Vamos concluir sua verificação.");
      router.push("/v1/dashboard");
    } else {
      toast.error(res.error || "Erro ao criar conta.");
    }
  };

  const fieldWrap: React.CSSProperties = {
    border: `1px solid ${BORDER}`,
    background: "#FFFFFF",
  };

  return (
    <>
      <Head>
        <title>ShadowPay — Criar conta</title>
      </Head>
      <main className="flex min-h-screen w-full items-start justify-center bg-white px-4 py-10 sm:items-center">
        <div className="w-full max-w-[440px]">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-menu-white.jpg"
              alt="ShadowPay"
              className="h-9 w-auto select-none"
              style={{ mixBlendMode: "multiply" }}
              draggable={false}
            />
          </div>

          <h1 className="text-center text-[26px] font-bold tracking-[-0.01em] text-slate-900">
            Crie sua conta
          </h1>
          <p className="mt-1.5 text-center text-[14px] text-slate-400">
            Preencha os dados abaixo para começar
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {/* Nome */}
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-slate-600">
                Nome Completo
              </label>
              <div
                className="flex h-12 items-center gap-2.5 rounded-lg px-3"
                style={fieldWrap}
              >
                <User className="h-[18px] w-[18px] shrink-0 text-slate-400" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Elon Musk"
                  className="h-full flex-1 bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-slate-400"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* E-mail */}
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-slate-600">
                E-mail
              </label>
              <div
                className="flex h-12 items-center gap-2.5 rounded-lg px-3"
                style={fieldWrap}
              >
                <Mail className="h-[18px] w-[18px] shrink-0 text-slate-400" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="elon.musk@mail.com"
                  type="email"
                  className="h-full flex-1 bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-slate-400"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Telefone */}
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-slate-600">
                Telefone (WhatsApp)
              </label>
              <div
                className="flex h-12 items-center gap-2.5 rounded-lg px-3"
                style={fieldWrap}
              >
                <Phone className="h-[18px] w-[18px] shrink-0 text-slate-400" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  placeholder="(11) 9 9000-0000"
                  inputMode="tel"
                  className="h-full flex-1 bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-slate-400"
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-slate-600">
                Senha
              </label>
              <div
                className="flex h-12 items-center gap-2.5 rounded-lg px-3"
                style={fieldWrap}
              >
                <Lock className="h-[18px] w-[18px] shrink-0 text-slate-400" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  type={showPw ? "text" : "password"}
                  className="h-full flex-1 bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-slate-300"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="shrink-0 text-slate-400 hover:text-slate-600"
                  aria-label="Mostrar senha"
                >
                  {showPw ? (
                    <EyeOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirmar senha */}
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-slate-600">
                Confirme sua senha
              </label>
              <div
                className="flex h-12 items-center gap-2.5 rounded-lg px-3"
                style={fieldWrap}
              >
                <Lock className="h-[18px] w-[18px] shrink-0 text-slate-400" />
                <input
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••••••"
                  type={showPw2 ? "text" : "password"}
                  className="h-full flex-1 bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-slate-300"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw2((v) => !v)}
                  className="shrink-0 text-slate-400 hover:text-slate-600"
                  aria-label="Mostrar senha"
                >
                  {showPw2 ? (
                    <EyeOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" />
                  )}
                </button>
              </div>
            </div>

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg text-[15px] font-semibold text-white transition-opacity disabled:opacity-70"
              style={{ background: PRIMARY }}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Criando…" : "Criar minha conta"}
            </button>

            {/* Termos */}
            <label className="flex cursor-pointer items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded accent-violet-600"
              />
              <span className="text-[12.5px] leading-snug text-slate-500">
                Ao continuar você concorda com nossos{" "}
                <Link href="/termos" className="font-medium text-violet-600">
                  Termos de uso
                </Link>{" "}
                e{" "}
                <Link href="/privacidade" className="font-medium text-violet-600">
                  Política de Privacidade
                </Link>
              </span>
            </label>
          </form>

          <p className="mt-6 text-center">
            <Link
              href="/auth/jwt/login"
              className="text-[14px] font-semibold text-violet-600 hover:text-violet-700"
            >
              Já tenho conta
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
