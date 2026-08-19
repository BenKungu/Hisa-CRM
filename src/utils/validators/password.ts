export type PasswordRules = {
  minLength?: number
  maxLength?: number
  requireUpper?: boolean
  requireLower?: boolean
  requireNumber?: boolean
  requireSymbol?: boolean
}

const DEFAULT: Required<PasswordRules> = {
  minLength: 8,
  maxLength: 128,
  requireUpper: true,
  requireLower: true,
  requireNumber: true,
  requireSymbol: false,
}

export function validatePassword(pw: string, rules: PasswordRules = {}): { valid: boolean; errors: string[] } {
  const r = { ...DEFAULT, ...rules }
  const errors: string[] = []
  const s = String(pw || '')
  if (s.length < r.minLength) errors.push(`Minimum length is ${r.minLength}`)
  if (s.length > r.maxLength) errors.push(`Maximum length is ${r.maxLength}`)
  if (r.requireUpper && !/[A-Z]/.test(s)) errors.push('Must include an uppercase letter')
  if (r.requireLower && !/[a-z]/.test(s)) errors.push('Must include a lowercase letter')
  if (r.requireNumber && !/[0-9]/.test(s)) errors.push('Must include a number')
  if (r.requireSymbol && !/[^A-Za-z0-9]/.test(s)) errors.push('Must include a symbol')
  return { valid: errors.length === 0, errors }
}
