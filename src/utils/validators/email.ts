

/**
 * Linear-time email validator to avoid ReDoS from catastrophic backtracking.
 * This is intentionally simpler than full RFC compliance, but covers common, real-world emails.
 */
const MAX_EMAIL_LEN = 254; // RFC5321 limit
const MAX_LOCAL_LEN = 64;  // RFC5321 recommendation

export function isEmail(value: string): boolean {
  const s = String(value ?? "").trim();

  // Basic length & whitespace checks
  if (s.length === 0 || s.length > MAX_EMAIL_LEN) return false;
  if (/\s/.test(s)) return false; // trivial regex; no nested quantifiers => no ReDoS risk

  // Exactly one "@"
  const at = s.indexOf("@");
  if (at <= 0 || at !== s.lastIndexOf("@")) return false;

  const local = s.slice(0, at);
  const domain = s.slice(at + 1);

  // Local & domain presence
  if (local.length === 0 || local.length > MAX_LOCAL_LEN) return false;
  if (domain.length === 0) return false;

  // Domain must have at least one dot separating labels and not start/end with dot
  if (domain.startsWith(".") || domain.endsWith(".")) return false;
  if (domain.includes("..")) return false;

  const lastDot = domain.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === domain.length - 1) return false;

  // TLD length >= 2
  const tld = domain.slice(lastDot + 1);
  if (tld.length < 2) return false;

  // Character set checks (still linear, trivial patterns, no nested quantifiers)
  // Local part: common allowed characters per RFC (simplified)
  const localOk = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local);
  if (!localOk) return false;

  // Domain: labels of [A-Za-z0-9-], separated by single dots; no leading/trailing hyphens in labels
  const labels = domain.split(".");
  for (const label of labels) {
    if (label.length === 0) return false;
    if (!/^[A-Za-z0-9-]+$/.test(label)) return false;
    if (label.startsWith("-") || label.endsWith("-")) return false;
  }

  return true;
}

export function assertEmail(value: string, message = "Invalid email"): void {
  if (!isEmail(value)) throw new Error(message);
}
