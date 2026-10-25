"use client";

/**
 * Minha conta → aba "Perfil": foto, dados da conta (apelido salva sozinho,
 * telefone) e a seção "Segurança" (senha, verificação e 2FA).
 * Sem taxas aqui — de propósito.
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import {
  BadgeCheck,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  ImagePlus,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiErrorMessage } from "@/lib/axiosErrors";
import { AVATAR_ACCEPT, makeAvatar } from "@/lib/avatar";
import {
  Button,
  C,
  Card,
  FieldLabel,
  Hint,
  IconBox,
  Pill,
  TextInput,
  fmtDate,
  fmtDoc,
  fmtPhone,
  inputCls,
  onlyDigits,
} from "./ui";

const API = "https://shadowpay-backend.onrender.com";

export type KycStatus = "NOT_STARTED" | "PENDING" | "APPROVED" | "BANNED";

export type AccountData = {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  createdAt: string;
  twofaEnabled: boolean;
  isAdministrator: boolean;
  avatarUrl: string | null;
  kyc: {
    status: KycStatus;
    message: string;
    legalName: string;
    tradeName: string;
    cnpj: string;
    repName: string;
    repCpf: string;
  };
};

export function KycPill({ status }: { status: KycStatus }) {
  if (status === "APPROVED") return <Pill tone="green" icon={<BadgeCheck className="h-3.5 w-3.5" />}>Conta verificada</Pill>;
  if (status === "PENDING") return <Pill tone="amber" icon={<Clock className="h-3.5 w-3.5" />}>Verificação em análise</Pill>;
  if (status === "BANNED") return <Pill tone="rose" icon={<ShieldAlert className="h-3.5 w-3.5" />}>Conta bloqueada</Pill>;
  return <Pill tone="slate" icon={<ShieldAlert className="h-3.5 w-3.5" />}>Verificação pendente</Pill>;
}

export function AvatarCircle({ url, name, size = 112 }: { url: string | null; name: string; size?: number }) {
  const initial = (name?.trim()?.[0] || "S").toUpperCase();
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} draggable={false} />
  ) : (
    <span
      className="flex items-center justify-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: "#7C3AED",
      }}
    >
      {initial}
    </span>
  );
}

/* ------------------------------------------------------------------ foto */

function PhotoColumn({ account, onChange }: { account: AccountData; onChange: (p: Partial<AccountData>) => void }) {
  const { token, user, updateUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<null | "upload" | "remove">(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; kb: number } | null>(null);
  const [viewing, setViewing] = useState(false);

  const save = async (dataUrl: string | null) => {
    const r = await axios.post(`${API}/api/user/avatar`, { dataUrl }, { headers: { Authorization: `Bearer ${token}` } });
    onChange({ avatarUrl: dataUrl });
    if (user) updateUser({ ...user, avatarUrl: dataUrl } as any);
    return r.data?.message as string | undefined;
  };

  const pick = async (file?: File | null) => {
    if (!file) return;
    setBusy("upload");
    try {
      const dataUrl = await makeAvatar(file);
      const msg = await save(dataUrl);
      setFileInfo({ name: file.name, kb: Math.max(1, Math.round((dataUrl.length * 3) / 4 / 1024)) });
      toast.success(msg || "Foto de perfil atualizada.");
    } catch (e: any) {
      toast.error(e?.response || e?.request ? apiErrorMessage(e, "Não consegui salvar a foto.") : e?.message || "Não consegui salvar a foto.");
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = async () => {
    if (!window.confirm("Remover sua foto de perfil?")) return;
    setBusy("remove");
    try {
      toast.success((await save(null)) || "Foto removida.");
      setFileInfo(null);
    } catch (e) {
      toast.error(apiErrorMessage(e, "Não consegui remover a foto."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <aside className="flex flex-col items-center text-center">
      <input
        ref={fileRef}
        type="file"
        accept={AVATAR_ACCEPT}
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="group relative rounded-full outline-none ring-violet-200 focus-visible:ring-4"
        aria-label="Trocar foto de perfil"
      >
        <AvatarCircle url={account.avatarUrl} name={account.companyName} size={104} />
        <span className="absolute bottom-0.5 right-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white text-slate-700" style={{ boxShadow: "0 1px 3px rgba(17,24,39,0.18)" }}>
          {busy === "upload" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </span>
      </button>

      {account.avatarUrl ? (
        <div className="mt-5 flex w-full items-center gap-3 rounded-xl border border-[#E6E8EB] bg-white p-2.5 text-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={account.avatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <button type="button" onClick={() => setViewing(true)} className="text-[13px] font-semibold hover:underline" style={{ color: C.primary }}>
              Ver foto
            </button>
            <p className="truncate text-[11.5px] text-slate-400" title={fileInfo?.name}>
              JPG · {Math.max(1, Math.round((account.avatarUrl.length * 3) / 4 / 1024))} KB
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={!!busy}
            className="rounded-lg px-2 py-1.5 text-[12.5px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            Trocar
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={!!busy}
            aria-label="Remover foto"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
          >
            {busy === "remove" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={!!busy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-[13.5px] font-medium text-slate-700 transition-colors hover:bg-[#F6F6F8] disabled:opacity-60"
        >
          <ImagePlus className="h-4 w-4" />
          Adicionar foto
        </button>
      )}
      <p className="mt-2 text-[11.5px] text-slate-400">JPG, PNG ou WEBP, máx. 10MB</p>

      <div className="mt-5 w-full space-y-1">
        <p className="truncate text-[13.5px] font-semibold text-slate-800">{account.email}</p>
        {account.kyc.cnpj && <p className="text-[12.5px] tabular-nums text-slate-500">CNPJ {fmtDoc(account.kyc.cnpj)}</p>}
      </div>
      <div className="mt-3">
        <KycPill status={account.kyc.status} />
      </div>

      {viewing &&
        account.avatarUrl &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/70 p-6" onClick={() => setViewing(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={account.avatarUrl} alt="Foto de perfil" className="max-h-[80vh] max-w-full rounded-xl shadow-2xl" />
            <button
              onClick={() => setViewing(false)}
              aria-label="Fechar"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>,
          document.body,
        )}
    </aside>
  );
}

/* ------------------------------------------------------------------ dados */

function DataForm({ account, onChange }: { account: AccountData; onChange: (p: Partial<AccountData>) => void }) {
  const { token, user, updateUser } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  // apelido: salva sozinho (1s depois de parar de digitar, ou ao sair do campo)
  const [name, setName] = useState(account.companyName);
  const [nameState, setNameState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [nameError, setNameError] = useState("");
  const savedName = useRef(account.companyName);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveName = async (value: string) => {
    const v = value.trim();
    if (!v) {
      setNameState("error");
      setNameError("Informe um nome de exibição.");
      return;
    }
    if (v === savedName.current) return;
    setNameState("saving");
    try {
      await axios.put(`${API}/api/user/profile`, { companyName: v }, { headers });
      savedName.current = v;
      setNameState("saved");
      onChange({ companyName: v });
      if (user) updateUser({ ...user, companyName: v });
    } catch (e) {
      setNameState("error");
      setNameError(apiErrorMessage(e, "Não consegui salvar o nome."));
    }
  };

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // telefone: salvo no botão
  const [phone, setPhone] = useState(fmtPhone(account.phone));
  const [savingPhone, setSavingPhone] = useState(false);
  const phoneDigits = onlyDigits(phone);
  const phoneChanged = phoneDigits !== onlyDigits(account.phone);
  const phoneValid = phoneDigits.length === 10 || phoneDigits.length === 11;

  const saveAll = async () => {
    if (timer.current) clearTimeout(timer.current);
    await saveName(name);
    if (!phoneChanged) return;
    if (!phoneValid) {
      toast.error("Telefone inválido. Use DDD + número.");
      return;
    }
    setSavingPhone(true);
    try {
      await axios.put(`${API}/api/user/profile`, { number: phoneDigits }, { headers });
      onChange({ phone: phoneDigits });
      if (user) updateUser({ ...user, number: phoneDigits });
      toast.success("Alterações salvas.");
    } catch (e) {
      toast.error(apiErrorMessage(e, "Não consegui salvar o telefone."));
    } finally {
      setSavingPhone(false);
    }
  };

  const locked = <Lock className="h-3.5 w-3.5 text-slate-400" />;
  const kycOk = account.kyc.status === "APPROVED" || account.kyc.status === "PENDING";

  return (
    <section className="min-w-0">
      <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="acc-name">Nome de exibição (apelido)</FieldLabel>
          <TextInput
            id="acc-name"
            value={name}
            maxLength={120}
            onChange={(e) => {
              const v = e.target.value;
              setName(v);
              setNameState("idle");
              if (timer.current) clearTimeout(timer.current);
              timer.current = setTimeout(() => saveName(v), 1000);
            }}
            onBlur={() => {
              if (timer.current) clearTimeout(timer.current);
              saveName(name);
            }}
          />
          {nameState === "saving" ? (
            <Hint>
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Salvando…
              </span>
            </Hint>
          ) : nameState === "saved" ? (
            <Hint tone="ok">
              <span className="inline-flex items-center gap-1">
                <Check className="h-3 w-3" /> Salvo
              </span>
            </Hint>
          ) : nameState === "error" ? (
            <Hint tone="error">{nameError}</Hint>
          ) : (
            <Hint>Salva automaticamente. É o nome que aparece no painel.</Hint>
          )}
        </div>

        <div>
          <FieldLabel>Nome legal</FieldLabel>
          <div className="relative">
            <TextInput value={account.kyc.legalName || ""} placeholder="—" disabled readOnly className="pr-10" />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{locked}</span>
          </div>
          <Hint>
            {account.kyc.legalName ? (
              "Vem da verificação da conta."
            ) : (
              <>
                Preenchido na{" "}
                <Link href="/v1/kyc" className="font-semibold underline" style={{ color: C.primary }}>
                  verificação da conta
                </Link>
                .
              </>
            )}
          </Hint>
        </div>

        <div>
          <FieldLabel>E-mail</FieldLabel>
          <div className="relative">
            <TextInput value={account.email} disabled readOnly className="pr-10" />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{locked}</span>
          </div>
          <Hint>Para trocar o e-mail, fale com o suporte.</Hint>
        </div>

        <div>
          <FieldLabel htmlFor="acc-phone">Telefone / WhatsApp</FieldLabel>
          <TextInput
            id="acc-phone"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(11) 98765-4321"
            value={phone}
            onChange={(e) => setPhone(fmtPhone(e.target.value))}
          />
          {phoneChanged && !phoneValid ? <Hint tone="error">Use DDD + número.</Hint> : <Hint>Usado pelo suporte para falar com você.</Hint>}
        </div>

        <div>
          <FieldLabel>CNPJ</FieldLabel>
          <div className="relative">
            <TextInput value={account.kyc.cnpj ? fmtDoc(account.kyc.cnpj) : ""} placeholder="—" disabled readOnly className="pr-10 tabular-nums" />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{locked}</span>
          </div>
          <Hint>{kycOk ? "Verificado na sua conta." : "Informado na verificação da conta."}</Hint>
        </div>

        <div>
          <FieldLabel>Responsável (CPF)</FieldLabel>
          <div className="relative">
            <TextInput
              value={account.kyc.repName ? `${account.kyc.repName}${account.kyc.repCpf ? ` · ${fmtDoc(account.kyc.repCpf)}` : ""}` : ""}
              placeholder="—"
              disabled
              readOnly
              className="pr-10"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{locked}</span>
          </div>
          <Hint>Dados do representante legal.</Hint>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={saveAll} loading={savingPhone} disabled={!phoneChanged && name.trim() === savedName.current}>
          Salvar alterações
        </Button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ segurança */

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} pr-11`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Esconder senha" : "Mostrar senha"}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function PasswordForm() {
  const { token, updateToken } = useAuth();
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!pwd.current || !pwd.next || !pwd.confirm) return toast.error("Preencha os três campos.");
    if (pwd.next.length < 8) return toast.error("A nova senha precisa ter pelo menos 8 caracteres.");
    if (pwd.next !== pwd.confirm) return toast.error("A confirmação não confere com a nova senha.");
    if (pwd.next === pwd.current) return toast.error("A nova senha precisa ser diferente da atual.");
    setBusy(true);
    try {
      const r = await axios.post(
        `${API}/api/user/change-password`,
        { currentPassword: pwd.current, newPassword: pwd.next },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      // Senha nova derruba as sessões antigas: este aparelho segue com o token novo.
      if (r.data?.data?.token) updateToken(r.data.data.token);
      toast.success(r.data?.message || "Senha alterada.");
      setPwd({ current: "", next: "", confirm: "" });
    } catch (e) {
      toast.error(apiErrorMessage(e, "Não consegui alterar a senha."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <p className="mb-4 flex items-center gap-2 text-[14px] font-bold text-slate-900">
        <Lock className="h-4 w-4" style={{ color: C.primary }} />
        Alterar senha
      </p>
      <div className="space-y-4">
        <PasswordField id="pwd-current" label="Senha atual" value={pwd.current} onChange={(v) => setPwd((p) => ({ ...p, current: v }))} autoComplete="current-password" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PasswordField id="pwd-new" label="Nova senha" value={pwd.next} onChange={(v) => setPwd((p) => ({ ...p, next: v }))} autoComplete="new-password" />
          <PasswordField id="pwd-confirm" label="Confirmar nova senha" value={pwd.confirm} onChange={(v) => setPwd((p) => ({ ...p, confirm: v }))} autoComplete="new-password" />
        </div>
      </div>
      <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] text-slate-400">Mínimo de 8 caracteres. Enviamos um e-mail avisando da alteração.</p>
        <Button onClick={submit} loading={busy} icon={<KeyRound className="h-4 w-4" />}>
          Alterar senha
        </Button>
      </div>
    </div>
  );
}

function TwoFactor({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const [open, setOpen] = useState(false);
  const [setup, setSetup] = useState<{ qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [disabling, setDisabling] = useState(false);

  const start = async () => {
    setOpen(true);
    setSetup(null);
    setCode("");
    setBusy(true);
    try {
      const r = await axios.get(`${API}/api/pages/2fa/setup`, { headers });
      setSetup({ qr: r.data?.qrCodeUrl, secret: r.data?.secret });
    } catch (e) {
      toast.error(apiErrorMessage(e, "Não consegui gerar o QR Code."));
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    try {
      const r = await axios.post(`${API}/api/pages/2fa/verify`, { code: onlyDigits(code) }, { headers });
      if (r.data?.success === false) throw { response: { data: r.data } };
      toast.success("2FA ativado! A partir de agora seu app gera os códigos.");
      onChange(true);
      setOpen(false);
    } catch (e) {
      toast.error(apiErrorMessage(e, "Código inválido. Confira no app e tente de novo."));
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const r = await axios.post(`${API}/api/pages/2fa/disable`, { code: onlyDigits(code) }, { headers });
      if (r.data?.success === false) throw { response: { data: r.data } };
      toast.success("2FA desativado.");
      onChange(false);
      setDisabling(false);
      setCode("");
    } catch (e) {
      toast.error(apiErrorMessage(e, "Código inválido."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="mb-4 flex items-center gap-2 text-[14px] font-bold text-slate-900">
        <ShieldCheck className="h-4 w-4" style={{ color: C.primary }} />
        Autenticação em 2 fatores (TOTP)
      </p>
      <div className="rounded-xl border border-[#E6E8EB] bg-slate-50/60 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-slate-900">Exigir 2FA para saques</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500">
              Com o 2FA ligado, todo saque pede o código de 6 dígitos do seu app. Use Google Authenticator, Authy, 1Password ou qualquer app TOTP.
            </p>
            <div className="mt-2.5">
              {enabled ? <Pill tone="green" icon={<ShieldCheck className="h-3.5 w-3.5" />}>Ativado</Pill> : <Pill tone="amber" icon={<ShieldAlert className="h-3.5 w-3.5" />}>Desativado</Pill>}
            </div>
          </div>
          {enabled ? (
            !disabling && (
              <Button variant="danger" onClick={() => setDisabling(true)}>
                Desativar
              </Button>
            )
          ) : (
            <Button onClick={start} icon={<Smartphone className="h-4 w-4" />}>
              Ativar 2FA
            </Button>
          )}
        </div>
        {enabled && disabling && (
          <div className="mt-4 flex flex-col gap-2 border-t border-[#E6E8EB] pt-4 sm:flex-row">
            <TextInput
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Código de 6 dígitos do app"
              value={code}
              onChange={(e) => setCode(onlyDigits(e.target.value).slice(0, 6))}
              className="sm:max-w-[260px]"
            />
            <div className="flex gap-2">
              <Button variant="danger" onClick={disable} loading={busy} disabled={code.length !== 6}>
                Confirmar desativação
              </Button>
              <Button variant="ghost" onClick={() => { setDisabling(false); setCode(""); }}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onClick={() => !busy && setOpen(false)}>
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Ativar 2FA"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl bg-white p-6 pb-[max(24px,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-xl"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[17px] font-bold text-slate-900">Ativar 2FA</p>
                  <p className="mt-0.5 text-[12.5px] text-slate-500">Escaneie o QR Code no seu app autenticador e digite o código gerado.</p>
                </div>
                <button onClick={() => setOpen(false)} aria-label="Fechar" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {!setup ? (
                <div className="flex h-56 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" style={{ color: C.primary }} />
                </div>
              ) : (
                <>
                  <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-xl border border-[#E6E8EB] bg-white p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={setup.qr} alt="QR Code do 2FA" className="h-full w-full object-contain" />
                  </div>
                  <p className="mt-3 text-center text-[11.5px] text-slate-500">Ou digite a chave no app:</p>
                  <p className="mt-1 break-all text-center font-mono text-[12.5px] font-semibold text-slate-700">{setup.secret}</p>
                  <div className="mt-5 space-y-3">
                    <TextInput
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="Código de 6 dígitos"
                      value={code}
                      onChange={(e) => setCode(onlyDigits(e.target.value).slice(0, 6))}
                      className="text-center text-[18px] font-semibold tracking-[0.3em]"
                    />
                    <Button onClick={verify} loading={busy} disabled={code.length !== 6} className="w-full">
                      Ativar 2FA
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function SecuritySection({ account, onChange, initialOpen }: { account: AccountData; onChange: (p: Partial<AccountData>) => void; initialOpen: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (initialOpen) setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
  }, [initialOpen]);
  const k = account.kyc.status;

  return (
    <div ref={ref} id="seguranca" className="mt-8 scroll-mt-24 border-t border-[#E6E8EB] pt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-1 py-3 text-left"
      >
        <span className="flex items-center gap-2.5 text-[15px] font-bold text-slate-900">
          <ShieldCheck className="h-[18px] w-[18px]" style={{ color: C.primary }} />
          Segurança
        </span>
        <span className="flex items-center gap-2 text-[12.5px] text-slate-500">
          <span className="hidden sm:inline">Senha, verificação e 2FA</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-4">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <IconBox>
                <User className="h-[18px] w-[18px]" />
              </IconBox>
              <p className="text-[15px] font-bold text-slate-900">Conta</p>
            </div>
            <dl className="divide-y divide-slate-100 text-[13.5px]">
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-slate-500">E-mail</dt>
                <dd className="truncate font-semibold text-slate-800">{account.email}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-slate-500">Verificação da conta</dt>
                <dd className="flex items-center gap-2">
                  <KycPill status={k} />
                  {(k === "NOT_STARTED" || k === "PENDING") && (
                    <Link href="/v1/kyc" className="hidden text-[12.5px] font-semibold sm:inline" style={{ color: C.primary }}>
                      {k === "PENDING" ? "Acompanhar" : "Verificar agora"}
                    </Link>
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-slate-500">Membro desde</dt>
                <dd className="font-semibold text-slate-800">{fmtDate(account.createdAt)}</dd>
              </div>
            </dl>
          </Card>

          <Link href="/v1/configs/apikey" className={`group flex items-center gap-3 p-4 transition-colors hover:border-violet-200 hover:bg-violet-50/30 rounded-xl border border-[#E6E8EB] bg-white shadow-[0_1px_1px_rgba(15,23,42,0.04)]`}>
            <IconBox>
              <KeyRound className="h-[18px] w-[18px]" />
            </IconBox>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-bold text-slate-900">API Keys</span>
              <span className="block text-[12.5px] text-slate-500">Gerar e gerenciar chaves de integração</span>
            </span>
            <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <Card className="space-y-7 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <IconBox>
                <ShieldCheck className="h-[18px] w-[18px]" />
              </IconBox>
              <p className="text-[15px] font-bold text-slate-900">Segurança</p>
            </div>
            <PasswordForm />
            <div className="h-px bg-slate-100" />
            <TwoFactor enabled={account.twofaEnabled} onChange={(v) => onChange({ twofaEnabled: v })} />
          </Card>
        </div>
      )}
    </div>
  );
}

export function ProfileTab({
  account,
  onChange,
  openSecurity,
}: {
  account: AccountData;
  onChange: (p: Partial<AccountData>) => void;
  openSecurity: boolean;
}) {
  return (
    <div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[256px_minmax(0,1fr)] lg:gap-10">
        <PhotoColumn account={account} onChange={onChange} />
        <DataForm account={account} onChange={onChange} />
      </div>
      <SecuritySection account={account} onChange={onChange} initialOpen={openSecurity} />
    </div>
  );
}
