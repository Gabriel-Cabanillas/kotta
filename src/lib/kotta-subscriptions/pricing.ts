export const KOTTA_VAT_BASIS_POINTS = 1600
export const KOTTA_ANNUAL_DISCOUNT_BASIS_POINTS = 1000
export const KOTTA_LATE_FEE_BASIS_POINTS = 500
export const KOTTA_PRICING_POLICY_VERSION = '2026-01'

export type KottaBillingModeValue = 'MONTHLY' | 'ANNUAL'

export type PricingQuote = {
  housingUnits: number
  isEnterprise: boolean
  baseMonthlyCents: number | null
  discountBasisPoints: number
  contractedMonthlyCents: number | null
  vatCents: number | null
  totalMonthlyCents: number | null
}

const roundBasisPoints = (cents: number, basisPoints: number) =>
  Math.round((cents * basisPoints) / 10_000)

export function calculateKottaPricing(
  housingUnits: number,
  billingMode: KottaBillingModeValue,
  enterpriseMonthlyCents?: number | null,
): PricingQuote {
  if (!Number.isInteger(housingUnits) || housingUnits <= 0) throw new Error('El número de viviendas debe ser mayor a cero.')
  const isEnterprise = housingUnits > 600
  let baseMonthlyCents: number | null
  if (isEnterprise) {
    baseMonthlyCents = enterpriseMonthlyCents && enterpriseMonthlyCents > 0 ? Math.round(enterpriseMonthlyCents) : null
  } else if (housingUnits <= 100) {
    baseMonthlyCents = 350_000
  } else if (housingUnits <= 300) {
    baseMonthlyCents = 350_000 + (housingUnits - 100) * 1_500
  } else {
    baseMonthlyCents = 650_000 + (housingUnits - 300) * 1_800
  }
  const discountBasisPoints = billingMode === 'ANNUAL' ? KOTTA_ANNUAL_DISCOUNT_BASIS_POINTS : 0
  const contractedMonthlyCents = baseMonthlyCents === null
    ? null
    : baseMonthlyCents - roundBasisPoints(baseMonthlyCents, discountBasisPoints)
  const vatCents = contractedMonthlyCents === null ? null : roundBasisPoints(contractedMonthlyCents, KOTTA_VAT_BASIS_POINTS)
  return {
    housingUnits, isEnterprise, baseMonthlyCents, discountBasisPoints,
    contractedMonthlyCents, vatCents,
    totalMonthlyCents: contractedMonthlyCents === null || vatCents === null ? null : contractedMonthlyCents + vatCents,
  }
}

export const calculateLateFeeCents = (subtotalCents: number) =>
  roundBasisPoints(subtotalCents, KOTTA_LATE_FEE_BASIS_POINTS)

export function calculateAnnualCancellationFeeCents(monthlyCents: number, remainingMonths: number) {
  if (monthlyCents <= 0 || remainingMonths <= 0) return 0
  const remaining = monthlyCents * remainingMonths
  return Math.min(monthlyCents * 2, Math.max(monthlyCents, Math.round(remaining * 0.25)))
}

export const centsToDecimalString = (cents: number) => (cents / 100).toFixed(2)
export const decimalToCents = (value: string | number) => Math.round(Number(value) * 100)

