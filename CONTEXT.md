# Hisa CRM — Session Context

> Full detail lives in PROJECT.md.

---

## Project

Hisa CRM. Custom insurance intermediary CRM for Hisa Africa Insurance
Agency Ltd (Nairobi, Kenya). Stack: React + TS + Bootstrap frontend,
Node + Express + TS backend, PostgreSQL via Prisma, hosted on AWS Lightsail.

**Solo developer:** Waweru. Founder/top agent: Alfred Mathu (HISA0001).

---

## Key rules to remember

- **Alfred's clients** = unique clients with ≥1 Alfred policy OR ≥1 MMF
  holder (MMF is always his).
- **Cross-sell** = insurance clients without MMF, shown as count + % of
  insurance clients.
- **Insurance import** keys on `id_no` (trusted). **MMF import** keys on
  phone-first, then strict name+email, never name alone.
- **MMF**: 1418 accounts, 1529 holder links, 1484 unique clients.
- **Alfred's total** = 883 policy clients + 1484 MMF clients − 170 overlap
  = 2197.

---

## Active non-goals

No agent ranking. No commission handling. No policy management.

---

## Communication rules

- Give the fix, not the ceremony.
- Ask one question at a time when unsure.
- Every code edit: full file path + exact location + before/after.
- No refactors unless asked.
- Auth is stable — don't touch.

---

## Current state (as of this writing)

- MMF data re-imported cleanly (2026-09).
- Dashboard MMF card shows 1418 accounts / 1484 clients.
- `matched_by` / `matched_existing` columns live on `MmfAccountHolder`.
- Temporary wipe button + admin endpoint still present in code —
  remove once fully verified.

---

## When in doubt

Ask before implementing. Fixing a wrong implementation costs more than
asking a clarifying question.