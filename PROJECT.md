# Hisa CRM — Project Reference

> Keep this file updated as the project evolves. It exists so that any
> new session (with any AI or any developer) can understand the project
> without re-explaining it from scratch.

---

## 1. What this is

A custom CRM for **Hisa Africa Insurance Agency Ltd**, an insurance
intermediary based in Nairobi, Kenya. It replaces spreadsheets and
disjointed tools for managing clients, policies, agents, and daily
operations.

**Owner / solo developer:** Waweru (tech lead — frontend, backend, devops)
**Founder / top agent:** Alfred Mathu (HISA0001)
**Team size:** Small. Hisa has ~30 agents and support staff across
departments. Waweru is the only person doing tech.

---

## 2. Stack

| Layer | Tech |
|-------|------|
| Frontend | React + TypeScript + Bootstrap 5, Vite, ApexCharts, Antd tables |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL (Prisma ORM) |
| Cache | Redis (OTP) |
| Email | AWS SES (nodemailer) |
| Hosting | AWS Lightsail (nginx serving frontend, PM2 running backend) |
| CI/CD | GitHub Actions — auto-deploy on push to `main` |

**Local dev DB and live DB are separate PostgreSQL instances.**
Local: Waweru's Mac. Live: Lightsail.

---

## 3. Insurers and data sources

| Source | What they send | Data quality |
|--------|----------------|--------------|
| **Absa Life** | Endowment + Education policies across 4 books: Active, Lapsed, Surrendered, Paid Up | **Trusted.** Keys on `id_no`. |
| **Old Mutual — MMF** | One book, joint and single accounts | **Medium.** Loose name matching, initials, shared emails. |
| **Old Mutual — other products** | Various (medical, GI) | **Messy.** Not yet integrated. |
| **Other Kenyan insurers** | Medical, GI | Not yet integrated. |

**Absa is "the first insurer"** because their data formed the base of the
CRM. All other books get reconciled against it.

### The four Absa books

| Book | What it contains | Notes |
|------|------------------|-------|
| Active | Finalised policies still paying | Monthly premium data |
| Lapsed | Policies that missed payments | Has `Expected Premium`, `Total Premium Paid`, `Arrears Due`, `New Gross Premium at Lapse` |
| Surrendered | Client formally requested surrender | Two sheets — main + surrender details. Has `surrender_amount`, `months_paid`, `duration_in_force` |
| Paid Up | Policy endorsed; client stopped paying but keeps the policy to maturity | Uses `endorsement_date` to mark when they stopped paying |

---

## 4. Business rules (the definitions that matter)

### Client vs Account vs Holder

- **Client** — one human. Keyed by `id_no` in the insurance book.
- **MMF account** — one member number. Belongs to one or more clients
  (joint accounts).
- **MMF holder** — a link between a client and an MMF account. A client
  can hold multiple MMF accounts.

### Alfred Mathu

- Founder of Hisa, top agent (HISA0001).
- **All MMF accounts are his** (Old Mutual only sends what's Alfred's).
- **Alfred's client count =** unique clients who have either:
  - ≥1 policy where `agent_name = 'Alfred Mathu'` **OR**
  - ≥1 MMF holder link (since MMF is always his)

### Cross-sell

- **Definition:** insurance clients who have **no MMF account**.
  Shown as count + percentage of insurance clients.
- Works in both directions (insurance→MMF or MMF→insurance) but only
  the direction that generates business is displayed.

### Policy statuses

| Status | Meaning |
|--------|---------|
| **Finalised** | Active policy, still paying |
| **Paid Up** | Endorsed — client stopped paying early but keeps the policy to maturity |
| **Lapsed** | Missed payments |
| **Surrendered** | Client formally withdrew and was refunded (penalised) |
| **Cancelled** | Terminated (various reasons) |
| **Unverified / Unfinalised** | Not yet confirmed by insurer |

**Active book** = finalised + paid up (still alive, not lapsed/cancelled/surrendered).

---

## 5. Non-goals

The CRM does **not**:

- Rank agents (Alfred is one; rankings would be divisive and Hisa doesn't need them)
- Handle commissions or agent salaries (insurer's job)
- Manage policies (insurer's job — we mirror their data)
- Serve agents directly (only Hisa staff currently)

---

## 6. Known limitations

- **No premium snapshot table.** Historical performance charts approximate
  by using inception date + inflation protection. Snapshots will be built later.
- **No reliable lapse month.** Derived from `total_premium_paid ÷ per-period premium`.
- **No per-year premium table.** Annual trend is calculated, not stored.
- **Old Mutual MMF data is loose.** Name matching uses initials, phone-first,
  strict name+email fallback.

---

## 7. Data quality rules for imports

### Insurance imports (Absa)

- Match by `id_no` — unique, trusted.
- Never match by name alone.
- Update strategy: field-by-field, audit every change to `PolicyAudit`.

### MMF imports (Old Mutual)

Matching priority (in order):

1. **Phone (trusted)** — if the phone matches a DB client and the DB
   client's name shares a token with the MMF raw name → `matched_by = 'phone'`.
   If no name overlap → `matched_by = 'phone_loose'` (group accounts etc).
2. **Phone, but no name overlap → skip matching.** Create new client.
3. **Name + email both match** (case-insensitive, exact) → `matched_by = 'name_email'`.
4. **Never match by name alone. Never match by email alone.**
5. **Joint accounts with one phone:** fuzzy-match the DB owner's name against
   each holder. The holder with the highest token overlap gets the phone.
   Zero overlap → assign positionally but mark `phone` as untrusted.

Audit columns on `MmfAccountHolder`: `matched_by` (`phone` / `phone_loose` /
`name_email` / `new_client`), `matched_existing` (bool).

---

## 8. Key schema notes

- `Client` — id_no unique
- `Policy` — policy_number unique, linked to client
- `PolicyAudit` — every change to a policy field, with old/new values
- `MmfAccount` — member_no unique
- `MmfAccountHolder` — link table, `@@unique([account_id, client_id])`
- `ImportLog` — every skipped row during import, with reason

---

## 9. Environment / ops

- **Deploy:** push to `main` → GitHub Actions:
  - Frontend: `npm ci` → `vite build` → SCP `dist/*` to Lightsail → reload nginx
  - Backend: SSH → `git pull` → `npm ci` → `prisma generate` → `prisma db push` → `npm run build` → `pm2 restart hisa-backend`
- **Secrets:** GitHub Actions secrets hold Lightsail credentials
- **Prod access:** Only Waweru

**Risk:** Waweru is a single point of failure. If unavailable, Hisa has no
one who knows the CRM internals. A one-page "how to keep the server alive"
doc for a trusted staff member is a future mitigation.

---

## 10. Communication preferences (for AI / devs)

- Give the fix, not the ceremony. No "you should test with curl" when the
  user can't run curl.
- Ask **one** question at a time when unsure.
- Don't assume the user doesn't know the domain. Assume they know it better
  than you.
- Every code edit: full path + surrounding context + before/after.
  No "add this somewhere in the component".
- When a number doesn't feel right, ask for the SQL before building anything.
- No refactors unless explicitly requested.
- Auth is stable — don't touch without asking.

---

## 11. Decisions log

Add new entries at the top. Format: `YYYY-MM-DD — decision — reason`.

- **2026-09** — MMF re-imported with strict matching (phone-first,
  name+email fallback, never name alone). Reason: prior import collapsed
  multiple people (e.g. "MR JK MWANGI" x3, shared `kibessie@yahoo.com` x10)
  into single clients.
- **2026-09** — Added `matched_by` / `matched_existing` audit columns to
  `MmfAccountHolder`. Reason: traceability on future matching decisions.
- **2026-09** — Dashboard MMF card now shows **accounts held by clients**
  (1418 accounts held by 1484 clients). Reason: previous sum-of-per-client
  count was meaningless.

  ## 12. VERIFICATION QUERIES

Save every query that proved a fix here. Purpose: six months from now,
re-run these to confirm nothing has drifted. If any returns an unexpected
number, something changed — investigate before assuming it's fine.

### V1 — MMF data integrity

Expected: accounts = row count of the file, holder rows = accounts + joint
extras, distinct clients ≤ holder rows.

```sql
SELECT COUNT(*) FROM "MmfAccount";
SELECT COUNT(*) FROM "MmfAccountHolder";
SELECT COUNT(DISTINCT client_id) FROM "MmfAccountHolder";

Last known values (2026-09-23): 1418 accounts, 1529 holders, 1484 distinct clients.