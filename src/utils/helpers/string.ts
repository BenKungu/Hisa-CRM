export function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

export function truncate(s: string, max: number, ellipsis = '…'): string {
  if (max <= 0) return ''
  return s.length > max ? s.slice(0, Math.max(0, max - 1)) + ellipsis : s
}

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
