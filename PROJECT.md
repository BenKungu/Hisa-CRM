You are absolutely right. The original snapshot had a comprehensive API routes list, and we have added a massive amount of new endpoints for the Applications feature. 

Here is the **Final, Ultra-Exhaustive Master Context**. I have added the complete, up-to-date API Routes Map.

Save this as `HISA-CRM-MASTER-CONTEXT.md`.

***

# HISA CRM — COMPLETE MASTER CONTEXT
**Last updated: 2026-10-27**

## 1. PROJECT OVERVIEW
**Hisa CRM** is a custom insurance intermediary CRM for **Hisa Africa Insurance Agency Ltd** (Nairobi, Kenya). It replaces spreadsheets for managing clients, policies, agents, applications, and daily operations.
- **Owner / Solo Developer:** Waweru (Tech Lead — Frontend, Backend, DevOps).
- **Founder / Top Agent:** Alfred Mathu (HISA0001).
- **Team size:** ~30 agents/staff. Waweru is the only tech person.
- **Prod URLs:** `https://crm.hisaafricaapp.com` (Frontend) / `https://crm-api.hisaafricaapp.com` (API)

## 2. BUSINESS RULES & DEFINITIONS
### Insurers & Books
- **Absa Life:** Trusted data. Keys on `id_no`. Four books: Active (Finalised), Lapsed, Surrendered, Paid Up (Endorsed).
- **Old Mutual (MMF):** Medium quality. Loose matching (initials, shared emails).
- **Other Insurers:** Medical, GI (Messy, not yet integrated).
- **Active Book:** Finalised + Paid Up (still alive, not lapsed/cancelled/surrendered).

### Clients vs Accounts vs Holders
- **Client:** One human. Keyed by `id_no`.
- **MMF Account:** One member number. Belongs to one or more clients (joint).
- **MMF Holder:** Link between a client and an MMF account.

### Alfred Mathu
- Founder of Hisa, top agent.
- **All MMF accounts are his.**
- **Alfred's Client Count:** Unique clients with ≥1 Alfred policy OR ≥1 MMF holder link.
- **Current Math:** 883 policy clients + 1484 MMF clients − 170 overlap = 2197 total.

### Cross-Sell
- **Definition:** Insurance clients who have **no MMF account**. Shown as count + percentage.

## 3. TECH STACK & CRITICAL SETUP RULES
- **Frontend:** React + TypeScript + Bootstrap 5, Vite, ApexCharts, Antd tables, react-feather icons. (Doccure SCSS template).
- **Backend:** Node.js + Express + TypeScript.
- **Database:** PostgreSQL (Prisma ORM). Local DB and Prod DB are separate.
- **Cache/Email:** Redis (OTP), AWS SES (nodemailer).
- **Hosting:** AWS Lightsail (nginx, PM2).
- **CI/CD:** GitHub Actions (push to `main`).

### 🚨 CRITICAL RULES
- **Prisma v7:** MUST use `import prisma from "../config/database"` (shared singleton with `PrismaPg` adapter). **NEVER** use `new PrismaClient()`.
- **SCSS:** Alive. Edit `src/assets/scss/main.scss`. Do NOT edit `src/assets/css/custom.css`.
- **Git & Data Files:** Never commit `legacy_data.json`, `.sql` dumps, or `storage/` / `app/` folders to GitHub. They are in `.gitignore`.
- **Auth:** Stable. Don't touch without asking.

## 4. PRISMA SCHEMA HIGHLIGHTS
### Core Models
- `User`, `Whitelist`, `Otp`
- `Client` (id_no unique)
- `Policy` (policy_number unique, linked to client)
- `PolicyAudit` (audit trail: old/new values)
- `MmfAccount` (member_no unique)
- `MmfAccountHolder` (link table, `@@unique([account_id, client_id])`)
- `ImportLog` (skipped rows)

### Applications Models
**`ClientApplication`**
- `provider`: `"absa"` | `"old_mutual"`
- `is_legacy`: Boolean (default false). Separates 1,968 Insureware apps from current ones.
- `reference`: `HISA-YYYY-NNNN` | `OM-YYYY-NNNN` | Original ID (for legacy)
- `verify_token`: String (public link)
- `policy_number`: String (entered later for OM DD, or linked during migration)
- `original_message_id`: String (email threading)
- `status`: `"draft"` | `"submitted"`

**`ClientDocument`**
- `doc_type`: String
- `status`: `"active"` | `"superseded"` (Amendments)
- `notified_at`: DateTime (Locks deletion once emailed)

## 5. DATA IMPORTS (EXCEL)
- **Insurance (Absa):** Matches by `id_no`. Audits every change to `PolicyAudit`.
- **MMF (Old Mutual):** Priority: 1. Phone (exact, unique) → 2. Name AND Email both match → 3. Create new.
- **NEVER match by name alone. NEVER match by email alone.**
- Joint accounts with one phone: fuzzy-match DB owner name against holder names (shared tokens ≥3 chars).

## 6. APPLICATIONS FEATURE (ABSA & OM)
- **Provider Chooser:** `/new-application` routes to Absa or OM forms.
- **Absa Fields:** Agent dropdown, Product (incl. Last Expense), Frequency, Premium.
- **OM Fields:** Agent hardcoded (Alfred Mathu), Product (Zawadi Investment, etc.), Payment Term. No Agent/Product dropdowns.
- **Docs:** Presigned PUT. Canonical order (Application Form first).
- **Amendments (Post-Submit):** Staff can Replace a doc. Old doc marked `superseded` (hidden in History), new doc active. Fires a distinct follow-up email.
- **Public Verify Page:** `/verify/:token` shows docs (1-hour presigned URLs) with read-only protection.

## 7. EMAIL NOTIFICATIONS (SES)
- **Original App:** `🔴 Policy Application Request — {product} — {ref} — {client}` or `🟢 Old Mutual...`
- **Follow-up (Add/Amend):** `📎 {DocType} for Policy {n} Ref :{ref} : {client}` or `🔄 REPLACEMENT...`
- **Reply-To:** Set to the recipient list.
- **CID Logo:** Embedded via attachment (`hisalogo.png`).
- **Threading:** Broken (SES rewrites Message-ID). Emails arrive as distinct threads. Deferred fix.

## 8. LEGACY MIGRATION (COMPLETED 2026-10)
- **Source:** Insureware (Laravel/PHP).
- **Data Migrated:** 1,968 applications, 7,500+ PDF documents.
- **Storage:** Uploaded to AWS `legacy-applications/` prefix.
- **DB:** Inserted with `is_legacy = true`. Policy numbers linked via Client ID Number.
- **UI:** Accessible via "Legacy Apps" toggle. Strictly read-only. No amendments/notifications allowed.
- **Process:** Exported to JSON locally, pushed via `scp`, imported via Prisma on Prod.

## 9. SEARCH & UI/UX OVERHAUL
- **Tokenized Search:** Applied globally. "Lucy Kamar" finds "Lucy Jeruiyot Kamar". Order-independent.
- **Global Search:** Includes Applications (purple accent `#6f42c1`).
- **Styling:** Moving away from inline styles. Using `app-tables.scss`.
- **Responsive Tables:** Desktop/Tablet use Antd tables with sticky columns. Mobile uses a custom Card view (`useIsMobile` hook).
- **Excel Exports:** Filters (Agent, No MMF, etc.) are passed correctly as comma-separated strings.
- **Filters Added:** Policies (Agent filter), Clients ("No MMF" toggle).

## 10. OUTLOOK RECONCILIATION
- Uploads Excel. Checks DB vs Outlook.
- Fixed bug: Now targets "Current Frequency" and cleans string formatting (e.g., "Semi Annual" vs "Semi-Annual") to eliminate false mismatches. Strike date logic (skipping if no strike dates match) is retained for monthly uploads.

## 11. API ROUTES MAP (CURRENT STATE)
### Auth & Admin
- `POST /api/auth/...` (Login, OTP, register, reset)
- *(Admin MMF wipe endpoint has been removed)*

### Core Data (Policies, Clients, MMF)
- `GET /api/policies` (Search, filter)
- `GET /api/policies/:id`
- `PUT /api/policies/:id`
- `DELETE /api/policies/:id`
- `GET /api/policies/:id/history`
- `GET /api/policies/agents`
- `GET /api/policies/export`
- `POST /api/policies/import-excel`
- `GET /api/clients` (Search, filter, mmfFilter)
- `GET /api/clients/export`
- `GET /api/clients/:id`
- `GET /api/clients/:id/bank-history`
- `PUT /api/clients/:id`
- `DELETE /api/clients/:id`
- `GET /api/mmf`
- `GET /api/mmf/stats`
- `GET /api/mmf/export`

### Applications (Absa & OM)
- `GET /api/applications` (List, search, filter by `provider`, `status`, `is_legacy`)
- `POST /api/applications` (Create draft)
- `GET /api/applications/:id` (Get single app + docs + `created_by_user`)
- `POST /api/applications/:id/documents` (Request presigned PUT URL)
- `PATCH /api/applications/:id/documents/:docId` (Confirm upload)
- `DELETE /api/applications/:id/documents/:docId` (Delete unnotified doc)
- `POST /api/applications/:id/submit` (Fire email, set submitted)
- `POST /api/applications/:id/notify-update` (Notify for amendments/new docs)
- `DELETE /api/applications/:id` (Drafts only)
- `GET /api/clients/:id/applications` (Apps for specific client)

### Public & Utility
- `GET /api/public/applications/verify/:token` (No auth, public verify page)
- `POST /api/reconciliation/upload` (Outlook file upload)
- `GET /api/search?q=` (Global search)
- `GET /api/dashboard/performance`

## 12. NON-GOALS & COMMUNICATION RULES
### Non-Goals
- No agent ranking/leaderboards.
- No commission/salary tracking.
- No public portals.

### Communication Preferences (For AI)
- **Give the fix, not the ceremony.** No "run curl" — Waweru tests via UI.
- **Ask ONE question at a time** when unsure.
- **Every code edit needs:** Full file path, exact context, before/after blocks.
- **Don't assume Waweru doesn't know the domain.** He knows insurance deeply.
- **No refactors unless asked.**

## 13. CURRENT STATE & NEXT STEPS
- **Legacy Migration:** 100% complete. Prod DB has all 1,968 apps.
- **Active Bug Fixes:** All major UI, filtering, and Outlook bugs are resolved.
- **Pending:** 
  - Email threading fix (SES raw-send).
  - Node 22 upgrade consideration.
  - If Waweru is unavailable, Hisa has no one who knows the CRM internals. A "how to keep the server alive" doc is a future mitigation.