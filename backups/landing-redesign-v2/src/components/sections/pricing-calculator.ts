export type LandingBillingMode = 'MONTHLY' | 'ANNUAL'

const BASE_PRICE_UP_TO_100 = 3500
const PRICE_AT_300 = 6500
const EXTRA_PRICE_101_TO_300 = 15
const EXTRA_PRICE_301_TO_600 = 18
const ANNUAL_DISCOUNT_RATE = 0.10
const ENTERPRISE_THRESHOLD = 600

export type LandingPriceResult = {
  housingUnits: number
  isEnterprise: boolean
  regularMonthlyPrice: number | null
  monthlyPrice: number | null
  monthlySavings: number
}

export function calculateLandingPrice(housingUnits: number, mode: LandingBillingMode): LandingPriceResult {
  const units = Math.max(1, Math.floor(Number.isFinite(housingUnits) ? housingUnits : 1))
  let regularMonthlyPrice: number | null

  if (units > ENTERPRISE_THRESHOLD) regularMonthlyPrice = null
  else if (units <= 100) regularMonthlyPrice = BASE_PRICE_UP_TO_100
  else if (units <= 300) regularMonthlyPrice = BASE_PRICE_UP_TO_100 + (units - 100) * EXTRA_PRICE_101_TO_300
  else regularMonthlyPrice = PRICE_AT_300 + (units - 300) * EXTRA_PRICE_301_TO_600

  const monthlyPrice = regularMonthlyPrice === null
    ? null
    : mode === 'ANNUAL'
      ? Math.round(regularMonthlyPrice * (1 - ANNUAL_DISCOUNT_RATE) * 100) / 100
      : regularMonthlyPrice

  return {
    housingUnits: units,
    isEnterprise: regularMonthlyPrice === null,
    regularMonthlyPrice,
    monthlyPrice,
    monthlySavings: regularMonthlyPrice === null || monthlyPrice === null ? 0 : regularMonthlyPrice - monthlyPrice,
  }
}
