// Lightweight phone helpers without external deps
// Defaults to US formatting when possible; otherwise returns normalized digits

function digits(raw: string): string { return (raw || '').replace(/\D+/g, '') }

export function formatPhoneNational(raw: string): string {
  const d = digits(raw)
  if (d.length === 11 && d.startsWith('1')) {
    // Strip leading country code 1
    return formatPhoneNational(d.slice(1))
  }
  if (d.length === 10) {
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  }
  return d
}

export function formatPhoneInternational(raw: string): string {
  const d = digits(raw)
  if (!d) return ''
  if (d.length === 11 && d.startsWith('1')) {
    return `+1 ${formatPhoneNational(d)}`
  }
  return `+${d}`
}

export function isValidPhone(raw: string): boolean {
  const d = digits(raw)
  // valid US length: 10 digits, or 11 with leading 1
  return d.length === 10 || (d.length === 11 && d.startsWith('1'))
}
