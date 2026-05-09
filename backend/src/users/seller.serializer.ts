/**
 * Converte um Seller (Prisma) no formato exato que o frontend espera
 * (interface `Seller` no AuthContext.tsx).
 *
 * Importante:
 * - NUNCA expõe passwordHash, twofaSecret ou privateKey de credentials
 * - Decimal vira string (frontend lê como string)
 * - Datas viram ISO string
 */
export function serializeSeller(seller: any) {
  if (!seller) return null;

  return {
    id: seller.id,
    companyName: seller.companyName,
    email: seller.email,
    number: seller.number,
    cpf_cnpj: seller.cpf_cnpj,
    zipCode: seller.zipCode,
    companyModality: seller.companyModality,
    companyActivity: seller.companyActivity,

    twofaEnabled: seller.twofaEnabled,
    isAdministrator: seller.isAdministrator,

    adquererId: seller.adquererId ?? '',

    kycStatus: seller.kyc?.status ?? 'NOT_STARTED',

    feePercentPix: Number(seller.feePercentPix),
    feeFixedPix: String(seller.feeFixedPix),
    feePercentCard: Number(seller.feePercentCard),
    feeFixedCard: String(seller.feeFixedCard),
    feePercentBoleto: Number(seller.feePercentBoleto),
    feeFixedBoleto: String(seller.feeFixedBoleto),
    feePercentCrypto: Number(seller.feePercentCrypto),
    feeFixedCrypto: String(seller.feeFixedCrypto),

    createdAt: seller.createdAt?.toISOString() ?? null,
    updatedAt: seller.updatedAt?.toISOString() ?? null,
    deletedAt: seller.deletedAt?.toISOString() ?? null,
    suspendedAt: seller.suspendedAt?.toISOString() ?? null,

    wallet: (seller.wallet ?? []).map((w: any) => ({
      id: w.id,
      sellerId: w.sellerId,
      balance: String(w.balance),
      blockedBalance: String(w.blockedBalance),
      reservedBalance: String(w.reservedBalance),
      isBlocked: w.isBlocked,
    })),

    credentials: (seller.credentials ?? []).map((c: any) => ({
      id: c.id,
      sellerId: c.sellerId,
      publicKey: c.publicKey,
      privateKey: c.privateKey, // visível só pro próprio dono via /profile
      createdAt: c.createdAt?.toISOString() ?? null,
      lastUsedAt: c.lastUsedAt?.toISOString() ?? null,
    })),

    kyc: seller.kyc
      ? {
          id: seller.kyc.id,
          status: seller.kyc.status,
          message: seller.kyc.message,
        }
      : { status: 'NOT_STARTED', message: '' },

    // Frontend Safira espera essas listas mesmo se vazias
    transactions: seller.transactions ?? [],
    withdrawals: seller.withdrawals ?? [],
  };
}
