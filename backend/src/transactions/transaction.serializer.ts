/**
 * Converte uma Transaction (Prisma) no formato esperado pelo frontend.
 * Decimal vira string (evita imprecisão de float). Datas viram ISO.
 */
export function serializeTransaction(t: any) {
  if (!t) return null;
  return {
    id: t.id,
    sellerId: t.sellerId,
    externalId: t.externalId ?? null,
    pspName: t.pspName ?? null,
    method: t.method,
    status: t.status,

    grossAmount: String(t.grossAmount),
    netAmount: String(t.netAmount),
    feeAmount: String(t.feeAmount),

    customer: {
      name: t.customerName ?? null,
      email: t.customerEmail ?? null,
      cpfCnpj: t.customerCpfCnpj ?? null,
    },

    payment: {
      pixCopyPaste: t.pixCopyPaste ?? null,
      pixQrCodeUrl: t.pixQrCodeUrl ?? null,
      cardLastDigits: t.cardLastDigits ?? null,
      boletoBarcode: t.boletoBarcode ?? null,
      boletoUrl: t.boletoUrl ?? null,
    },

    paidAt: t.paidAt?.toISOString?.() ?? null,
    expiresAt: t.expiresAt?.toISOString?.() ?? null,
    createdAt: t.createdAt?.toISOString?.() ?? null,
    updatedAt: t.updatedAt?.toISOString?.() ?? null,
  };
}
