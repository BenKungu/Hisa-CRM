export function format(input: Date | string | number, locale?: string, options?: Intl.DateTimeFormatOptions): string {
  const d = input instanceof Date ? input : new Date(input)
  return new Intl.DateTimeFormat(locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US'), options || { year: 'numeric', month: 'short', day: '2-digit' }).format(d)
}

export function toISO(input: Date | string | number): string {
  const d = input instanceof Date ? input : new Date(input)
  return d.toISOString()
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
