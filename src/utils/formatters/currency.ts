export type CurrencyFormatOptions = {
  currency?: string
  locale?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

export function formatCurrency(value: number, opts: CurrencyFormatOptions = {}): string {
  const {
    currency = 'USD',
    locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US',
    minimumFractionDigits,
    maximumFractionDigits,
  } = opts
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    ...(minimumFractionDigits != null ? { minimumFractionDigits } : {}),
    ...(maximumFractionDigits != null ? { maximumFractionDigits } : {}),
  }).format(value)
}
