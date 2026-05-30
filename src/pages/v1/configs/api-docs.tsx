"use client";

/**
 * /v1/configs/api-docs — Documentação da API de PIX da ShadowPay.
 *
 * Referência completa pro seller conectar a API de PIX no site/checkout
 * dele: base URL, autenticação por chave secreta, endpoints de criar e
 * consultar cobrança, exemplos em cURL / Node / PHP, tabela de status e
 * fluxo de integração.
 */

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { toast } from "sonner";
import {
  Copy,
  Check,
  KeyRound,
  Webhook,
  Terminal,
  ArrowLeft,
  ShieldCheck,
  Zap,
  ChevronRight,
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";

const API_BASE = "https://shadowpay-api-production.up.railway.app";

const T = {
  ink: "#0F172A",
  ink2: "#334155",
  muted: "#64748B",
  faint: "#94A3B8",
  violet: "#7C3AED",
  violetSoft: "rgba(124,58,237,0.08)",
  border: "rgba(15,23,42,0.08)",
  borderSoft: "rgba(15,23,42,0.06)",
  codeBg: "#0B1020",
};

/* ============================================================
 * Code block — fundo escuro premium com botão copiar
 * ============================================================ */
function CodeBlock({
  code,
  label,
}: {
  code: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copiado!");
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ background: T.codeBg, border: "1px solid rgba(148,163,184,0.14)" }}
    >
      {label && (
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ borderBottom: "1px solid rgba(148,163,184,0.12)" }}
        >
          <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            <Terminal className="h-3.5 w-3.5" />
            {label}
          </span>
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition-colors hover:bg-white/5"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      )}
      <pre className="overflow-x-auto px-4 py-4 text-[12.5px] leading-relaxed">
        <code
          className="font-mono text-slate-200"
          style={{ whiteSpace: "pre" }}
        >
          {code}
        </code>
      </pre>
      {!label && (
        <button
          onClick={copy}
          className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition-colors hover:bg-white/10"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copiado" : "Copiar"}
        </button>
      )}
    </div>
  );
}

/* ============================================================
 * Method pill (POST / GET)
 * ============================================================ */
function Method({ m }: { m: "POST" | "GET" }) {
  const cfg =
    m === "POST"
      ? { bg: "rgba(16,185,129,0.12)", color: "#059669" }
      : { bg: "rgba(6,182,212,0.12)", color: "#0891B2" };
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] font-bold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {m}
    </span>
  );
}

/* ============================================================
 * Card de endpoint
 * ============================================================ */
function Endpoint({
  method,
  path,
  title,
  desc,
  children,
}: {
  method: "POST" | "GET";
  path: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="scroll-mt-24 rounded-2xl p-5 sm:p-6"
      style={{
        background: "#FFFFFF",
        border: `1px solid ${T.borderSoft}`,
        boxShadow:
          "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
      }}
    >
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <Method m={method} />
        <code className="break-all font-mono text-[13px] font-semibold text-slate-800">
          {path}
        </code>
      </div>
      <h3 className="text-[16px] font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{desc}</p>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function ParamRow({
  name,
  type,
  required,
  desc,
}: {
  name: string;
  type: string;
  required?: boolean;
  desc: string;
}) {
  return (
    <tr style={{ borderTop: `1px solid ${T.borderSoft}` }}>
      <td className="py-2.5 pr-3 align-top">
        <code className="font-mono text-[12.5px] font-semibold text-slate-800">
          {name}
        </code>
        {required ? (
          <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-rose-500">
            obrigatório
          </span>
        ) : (
          <span className="ml-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
            opcional
          </span>
        )}
      </td>
      <td className="py-2.5 pr-3 align-top">
        <code className="font-mono text-[12px] text-violet-600">{type}</code>
      </td>
      <td className="py-2.5 align-top text-[12.5px] leading-relaxed text-slate-500">
        {desc}
      </td>
    </tr>
  );
}

function ApiDocsContent() {
  const curlCreate = `curl -X POST ${API_BASE}/api/v1/pix/charges \\
  -H "Authorization: Bearer sk_live_SUA_CHAVE_SECRETA" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 199.90,
    "customerName": "João Silva",
    "customerEmail": "joao@email.com",
    "customerCpfCnpj": "12345678900",
    "description": "Pedido #1234",
    "externalReference": "PEDIDO-1234"
  }'`;

  const nodeCreate = `// Node.js (fetch nativo — Node 18+)
const res = await fetch("${API_BASE}/api/v1/pix/charges", {
  method: "POST",
  headers: {
    "Authorization": "Bearer sk_live_SUA_CHAVE_SECRETA",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    amount: 199.90,
    customerName: "João Silva",
    customerEmail: "joao@email.com",
    customerCpfCnpj: "12345678900",
    description: "Pedido #1234",
    externalReference: "PEDIDO-1234",
  }),
});

const { data } = await res.json();
console.log(data.pix.copyPaste); // código copia-e-cola
console.log(data.pix.qrCodeUrl); // imagem do QR Code`;

  const phpCreate = `<?php
// PHP (cURL)
$ch = curl_init("${API_BASE}/api/v1/pix/charges");
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer sk_live_SUA_CHAVE_SECRETA",
    "Content-Type: application/json",
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "amount" => 199.90,
    "customerName" => "João Silva",
    "customerEmail" => "joao@email.com",
    "description" => "Pedido #1234",
    "externalReference" => "PEDIDO-1234",
  ]),
]);
$response = json_decode(curl_exec($ch), true);
echo $response["data"]["pix"]["copyPaste"];`;

  const responseCreate = `{
  "success": true,
  "data": {
    "id": "9f1c2e7a-4b3d-4a1e-9c8f-2d6b7a0e1f33",
    "status": "pending",
    "amount": "199.90",
    "method": "PIX",
    "pix": {
      "copyPaste": "00020126580014br.gov.bcb.pix0136...5204000053039865802BR...",
      "qrCodeUrl": "https://.../qrcode/9f1c2e7a.png"
    },
    "customer": {
      "name": "João Silva",
      "email": "joao@email.com",
      "cpfCnpj": "12345678900"
    },
    "externalReference": "PEDIDO-1234",
    "expiresAt": "2026-05-30T18:42:00.000Z",
    "createdAt": "2026-05-30T18:12:00.000Z"
  }
}`;

  const curlStatus = `curl ${API_BASE}/api/v1/pix/charges/9f1c2e7a-4b3d-4a1e-9c8f-2d6b7a0e1f33 \\
  -H "Authorization: Bearer sk_live_SUA_CHAVE_SECRETA"`;

  const responseStatus = `{
  "success": true,
  "data": {
    "id": "9f1c2e7a-4b3d-4a1e-9c8f-2d6b7a0e1f33",
    "status": "approved",
    "amount": "199.90",
    "method": "PIX",
    "pix": { "copyPaste": "00020126...", "qrCodeUrl": "https://..." },
    "customer": { "name": "João Silva", "email": "joao@email.com" },
    "paidAt": "2026-05-30T18:20:00.000Z",
    "expiresAt": "2026-05-30T18:42:00.000Z",
    "createdAt": "2026-05-30T18:12:00.000Z"
  }
}`;

  const pingExample = `curl ${API_BASE}/api/v1/ping \\
  -H "Authorization: Bearer sk_live_SUA_CHAVE_SECRETA"

# → { "success": true, "message": "pong", "authenticated": true }`;

  return (
    <>
      <Head>
        <title>ShadowPay — Documentação da API PIX</title>
      </Head>

      <div className="mx-auto max-w-4xl">
        {/* Voltar */}
        <Link
          href="/v1/configs/apikey"
          className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 transition-colors hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Chaves de API
        </Link>

        {/* Hero */}
        <header className="mb-8">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
            Desenvolvedores
          </p>
          <h1
            className="text-[26px] font-bold tracking-tight text-slate-900 sm:text-[34px]"
            style={{ letterSpacing: "-0.01em" }}
          >
            API de PIX ShadowPay
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-slate-500">
            Crie cobranças PIX direto do seu site ou backend. Gere o QR Code e
            o copia-e-cola, e receba o status do pagamento em tempo real. REST,
            JSON, autenticação por chave secreta.
          </p>
        </header>

        {/* Quick facts */}
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              icon: Zap,
              label: "Base URL",
              value: "/api/v1",
              sub: API_BASE.replace("https://", ""),
            },
            {
              icon: ShieldCheck,
              label: "Autenticação",
              value: "Bearer token",
              sub: "Chave secreta sk_live_",
            },
            {
              icon: Webhook,
              label: "Formato",
              value: "REST · JSON",
              sub: "UTF-8 · HTTPS",
            },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.label}
                className="rounded-2xl p-4"
                style={{
                  background: "#FFFFFF",
                  border: `1px solid ${T.borderSoft}`,
                }}
              >
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: T.violetSoft, color: T.violet }}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {f.label}
                </p>
                <p className="mt-0.5 text-[14px] font-bold text-slate-900">
                  {f.value}
                </p>
                <p className="truncate font-mono text-[11px] text-slate-400">
                  {f.sub}
                </p>
              </div>
            );
          })}
        </div>

        {/* Autenticação */}
        <section
          className="mb-6 rounded-2xl p-5 sm:p-6"
          style={{
            background: "#FFFFFF",
            border: `1px solid ${T.borderSoft}`,
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: T.violetSoft, color: T.violet }}>
              <KeyRound className="h-4 w-4" />
            </span>
            <h2 className="text-[17px] font-bold text-slate-900">
              Autenticação
            </h2>
          </div>
          <p className="mb-4 text-[13.5px] leading-relaxed text-slate-500">
            Toda requisição precisa da sua{" "}
            <strong className="text-slate-700">chave secreta</strong> (começa
            com <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[12px] text-violet-600">sk_live_</code>)
            no header <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[12px] text-slate-700">Authorization</code>.
            Gere a sua na página{" "}
            <Link href="/v1/configs/apikey" className="font-semibold text-violet-600 hover:underline">
              Chaves de API
            </Link>
            .
          </p>
          <CodeBlock
            label="Header"
            code={`Authorization: Bearer sk_live_SUA_CHAVE_SECRETA`}
          />
          <div
            className="mt-3 flex items-start gap-2 rounded-xl p-3"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}
          >
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
            <p className="text-[12.5px] leading-relaxed text-slate-600">
              <strong className="text-rose-600">Nunca</strong> exponha a chave
              secreta no frontend (HTML/JS do navegador). Chame a API sempre a
              partir do seu servidor/backend.
            </p>
          </div>
        </section>

        {/* Endpoints */}
        <div className="space-y-6">
          {/* 1. Criar cobrança */}
          <Endpoint
            method="POST"
            path="/api/v1/pix/charges"
            title="Criar cobrança PIX"
            desc="Gera uma cobrança PIX e devolve o QR Code + o código copia-e-cola pro cliente pagar."
          >
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Parâmetros do body
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <tbody>
                    <ParamRow name="amount" type="number" required desc="Valor da cobrança em reais (ex: 199.90). Mínimo R$0,50." />
                    <ParamRow name="customerName" type="string" desc="Nome do cliente pagador." />
                    <ParamRow name="customerEmail" type="string" desc="E-mail do cliente." />
                    <ParamRow name="customerCpfCnpj" type="string" desc="CPF ou CNPJ do cliente (só números)." />
                    <ParamRow name="description" type="string" desc="Descrição da cobrança (aparece no extrato)." />
                    <ParamRow name="externalReference" type="string" desc="ID do pedido no seu sistema. Volta igual na consulta." />
                    <ParamRow name="utmSource" type="string" desc="Origem da venda (campanha/tracking). Opcional." />
                    <ParamRow name="productId" type="string" desc="ID de um produto seu na ShadowPay (opcional)." />
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Exemplo de requisição
              </p>
              <div className="space-y-3">
                <CodeBlock label="cURL" code={curlCreate} />
                <CodeBlock label="Node.js" code={nodeCreate} />
                <CodeBlock label="PHP" code={phpCreate} />
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Resposta <span className="text-emerald-600">200 OK</span>
              </p>
              <CodeBlock label="JSON" code={responseCreate} />
            </div>
          </Endpoint>

          {/* 2. Consultar */}
          <Endpoint
            method="GET"
            path="/api/v1/pix/charges/{id}"
            title="Consultar status da cobrança"
            desc="Devolve o status atual da cobrança. Faça polling a cada ~5s até virar 'approved'."
          >
            <CodeBlock label="cURL" code={curlStatus} />
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Resposta <span className="text-emerald-600">200 OK</span>
              </p>
              <CodeBlock label="JSON" code={responseStatus} />
            </div>
          </Endpoint>

          {/* 3. Ping */}
          <Endpoint
            method="GET"
            path="/api/v1/ping"
            title="Testar autenticação"
            desc="Confirma que sua chave secreta é válida. Útil pra debugar a integração."
          >
            <CodeBlock label="cURL" code={pingExample} />
          </Endpoint>
        </div>

        {/* Status reference */}
        <section
          className="mt-6 rounded-2xl p-5 sm:p-6"
          style={{
            background: "#FFFFFF",
            border: `1px solid ${T.borderSoft}`,
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          <h2 className="mb-3 text-[17px] font-bold text-slate-900">
            Status da cobrança
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <tbody>
                {[
                  ["pending", "#D97706", "Aguardando pagamento (PIX gerado, ainda não pago)."],
                  ["approved", "#059669", "Pago e confirmado. Pode liberar o produto/serviço."],
                  ["expired", "#64748B", "Expirou sem pagamento (passou do expiresAt)."],
                  ["refunded", "#0891B2", "Estornado ao cliente."],
                  ["chargeback", "#DC2626", "Contestado/cancelado."],
                ].map(([s, color, desc]) => (
                  <tr key={s} style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                    <td className="py-2.5 pr-3 align-top">
                      <span
                        className="inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[12px] font-bold"
                        style={{ background: `${color}1A`, color: color as string }}
                      >
                        {s}
                      </span>
                    </td>
                    <td className="py-2.5 align-top text-[12.5px] leading-relaxed text-slate-500">
                      {desc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Webhook note */}
        <section
          className="mt-6 flex flex-col items-start gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
          style={{
            background: "linear-gradient(120deg, #0B1020, #151B33)",
            border: "1px solid rgba(148,163,184,0.14)",
          }}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(124,58,237,0.18)", color: "#C4B5FD" }}>
              <Webhook className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-[15px] font-bold text-white">
                Receba avisos por webhook
              </h3>
              <p className="mt-0.5 max-w-md text-[12.5px] leading-relaxed text-slate-400">
                Em vez de ficar consultando, configure uma URL pra ShadowPay
                te avisar automático quando um PIX for pago.
              </p>
            </div>
          </div>
          <Link
            href="/v1/configs/webhook"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(120deg, #7C3AED, #6D28D9)",
              boxShadow: "0 8px 20px -8px rgba(124,58,237,0.55)",
            }}
          >
            Configurar webhook
            <ChevronRight className="h-4 w-4" />
          </Link>
        </section>
      </div>

      <ShadowPanel />
    </>
  );
}

export default function ApiDocsPage() {
  return (
    <ProtectedRoute>
      <LightShell>
        <ApiDocsContent />
      </LightShell>
    </ProtectedRoute>
  );
}
