# ShadowPay - Backend

Backend do gateway de pagamento ShadowPay. Stack: **NestJS + Prisma + PostgreSQL**.

> Status atual: **Fase 1 (auth + perfil)**. Login e registro funcionam end-to-end com o frontend. Integração Simpay e demais endpoints virão nas próximas fases.

---

## Pré-requisitos

- Node.js 20+ e npm
- PostgreSQL 14+ (local ou em nuvem - Supabase, Neon, Railway, Render, etc.)
- Frontend rodando (já está em `https://shadowpay-delta.vercel.app`)

---

## Setup local (5 minutos)

```bash
# 1) Instala dependências
npm install

# 2) Cria seu .env a partir do exemplo e edita
cp .env.example .env
# Edite DATABASE_URL e JWT_SECRET

# 3) Gera o cliente Prisma
npm run prisma:generate

# 4) Cria as tabelas no banco
npm run prisma:migrate

# 5) Sobe o servidor em desenvolvimento
npm run start:dev
```

Vai subir em `http://localhost:3333`. Teste com:

```bash
curl http://localhost:3333/api/health
# {"status":"ok","service":"shadowpay-backend",...}
```

---

## Endpoints já prontos

| Método | Rota                  | Auth | O que faz                          |
| ------ | --------------------- | ---- | ---------------------------------- |
| GET    | `/api/health`         | ❌   | Healthcheck (Railway/Render usa)  |
| POST   | `/api/auth/register`  | ❌   | Cria seller + wallet + credentials + KYC |
| POST   | `/api/auth/login`     | ❌   | Retorna JWT + dados do seller      |
| GET    | `/api/user/profile`   | ✅   | Dados completos do seller logado   |

Resposta de `register` e `login` (compatível com o `AuthContext.tsx` do frontend):

```json
{
  "success": true,
  "message": "...",
  "data": {
    "seller": { "...": "..." },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "message": "..."
  }
}
```

---

## Conectando ao frontend

O frontend está hardcoded em `https://api.safira.cash`. Você tem **duas opções**:

### Opção A — Apontar DNS (recomendado em produção)

Configura o DNS de `api.safira.cash` (ou o domínio que você for usar) pra apontar pro servidor onde rodar esse backend. O frontend não precisa mudar.

### Opção B — Trocar a URL no frontend

Editar o `src/contexts/AuthContext.tsx` no repo do frontend e trocar todas as ocorrências de `https://api.safira.cash` pelo seu novo domínio (ou `http://localhost:3333` em dev). Melhor ainda: criar uma variável de ambiente `NEXT_PUBLIC_API_URL` e usar `process.env.NEXT_PUBLIC_API_URL` no lugar.

---

## Deploy no Railway (recomendado pra começar)

1. Criar conta em https://railway.app
2. **New Project → Deploy from GitHub repo** (esse backend)
3. Clicar em **+ New → Database → Add PostgreSQL**
4. No serviço do backend: **Variables → Add Variable**
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (referência ao Postgres)
   - `JWT_SECRET` = (gerar com `openssl rand -hex 64`)
   - `JWT_EXPIRES_IN` = `7d`
   - `CORS_ORIGINS` = `https://shadowpay-delta.vercel.app`
   - `NODE_ENV` = `production`
   - `BCRYPT_SALT_ROUNDS` = `12`
5. **Settings → Build Command**: `npm install && npm run prisma:generate && npm run build`
6. **Settings → Start Command**: `npm run prisma:deploy && npm run start:prod`
7. **Settings → Networking → Generate Domain**

Em ~3 minutos você tem URL tipo `https://shadowpay-backend-production.up.railway.app`.

---

## Estrutura de pastas

```
shadowpay-backend/
├─ prisma/
│  └─ schema.prisma         # entidades do banco
├─ src/
│  ├─ main.ts               # bootstrap (CORS, helmet, validação)
│  ├─ app.module.ts         # módulo raiz
│  ├─ health.controller.ts  # /api/health
│  ├─ prisma/               # cliente Prisma como provider
│  ├─ auth/
│  │  ├─ auth.controller.ts # /api/auth/{login,register}
│  │  ├─ auth.service.ts    # lógica de bcrypt + jwt
│  │  ├─ jwt.strategy.ts    # validação do token
│  │  ├─ jwt-auth.guard.ts  # @UseGuards()
│  │  └─ dto/               # validação de payload
│  └─ users/
│     ├─ users.controller.ts    # /api/user/profile
│     ├─ users.service.ts       # busca + estatísticas
│     ├─ seller.serializer.ts   # converte pro formato do front
│     └─ current-user.decorator.ts
├─ .env.example
└─ package.json
```

---

## Segurança já incluída

- **bcrypt** com 12 rounds (configurável via env)
- **JWT** assinado com secret de no mínimo 64 chars
- **helmet** (headers de segurança)
- **rate limit** global (5 req/s, 30/10s, 200/min) + limites mais apertados em `register`/`login`
- **class-validator** valida e rejeita payloads inválidos antes de chegar no service
- **CORS** restrito às origens declaradas em `CORS_ORIGINS`
- **Senha nunca volta na resposta** (serializer remove `passwordHash`)
- **Mensagem genérica de login inválido** (não vaza se o e-mail existe)

---

## Próximas fases

- **Fase 2:** Integração com Simpay (criar transação Pix/cartão, receber webhook, atualizar saldo)
- **Fase 3:** Endpoints `/v1/products/sales`, `/v1/reports`, `/v2/manager/*`
- **Fase 4:** Saques (`/v2/manager/withdraw`), 2FA, push notifications, KYC fluxo completo
- **Fase 5:** Observabilidade (logs estruturados, Sentry, métricas), backup de banco, fila de webhooks

---

## Aviso de produção

Esse é o esqueleto sólido pro backend rodar — mas **antes de processar dinheiro de cliente real**, você ainda precisa:

- Auditoria de segurança independente
- Testes de carga (k6, Artillery)
- Backup automático do Postgres com retenção
- WAF/Cloudflare na frente
- Monitoramento e on-call
- Conciliação financeira diária com o PSP
- Ambiente de homologação separado de produção

Tudo isso está fora do escopo de gerar código. É operação.
