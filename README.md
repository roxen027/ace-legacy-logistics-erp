# Ace Legacy Services ERP & TMS Management System

> **United States Truck Dispatching & Freight Brokerage Management System**  
> Built with Next.js 15+, TypeScript, Tailwind CSS, Prisma ORM, and Iron-Session RBAC.

---

## 1. Executive Product Overview

**Ace Legacy Services** is a centralized, role-based, enterprise logistics management platform combining **ERP**, **CRM**, and **TMS** capabilities. It unifies operations across two distinct commercial divisions:

1. **Freight Brokerage Division:**
   - Shipper account management & CRM pipeline.
   - Multi-version quotation system with manager margin approvals.
   - Brokerage load management, multi-stop pickup & delivery execution, carrier compliance vetting, rate confirmations, check calls, and POD verification.
   - Accounts Receivable (AR) freight invoices, Accounts Payable (AP) carrier 3-way matching, and gross margin tracking.
2. **Truck Dispatching Division:**
   - Dedicated fleet services for contracted owner-operators and carrier fleets.
   - Client agreements, truck equipment profiles, driver lane preferences, and target rate-per-mile thresholds.
   - External broker load sourcing, dispatch instruction sheets, and weekly dispatch service fee statements.
   - **Crucial Accounting Boundary:** Sourced carrier gross freight pay belongs strictly to the motor carrier; Ace Legacy Services recognizes **only the contracted dispatch service fee (e.g. 8–10%)** as corporate revenue.

---

## 2. Default Seeded User Accounts (All 8 Roles)

All accounts are pre-seeded with the password: `admin123`

| Role Portal | Full Name | Corporate Email | Core Access & Responsibilities |
|---|---|---|---|
| **Super Admin / Owner** | Marcus Sterling | `admin@acelegacyservices.com` | Full company visibility, division toggling, financial reconciliation, audit logs, and settings overrides. |
| **HR Manager** | Elena Rios | `hr@acelegacyservices.com` | Employee profiles, shift schedules, web clock timesheets, and leave approvals (no access to load margins). |
| **Sales Manager** | David Vance | `sales.manager@acelegacyservices.com` | Sales pipeline, quote margin threshold sign-offs, agent performance, and conversion monitoring. |
| **Sales Agent** | Jordan Miller | `sales.agent@acelegacyservices.com` | Own shipper accounts, leads, quote builder, and converted load tracking. |
| **Operations Manager** | Caleb Brooks | `ops.manager@acelegacyservices.com` | Brokerage load board, carrier sourcing, rate confirmation approvals, and execution exceptions. |
| **Dispatcher** | Travis Holt | `dispatcher@acelegacyservices.com` | Client fleet equipment, driver tracking, broker load booking, and check-calls. |
| **Accounting Manager** | Sophia Chen | `accounting.manager@acelegacyservices.com` | Receivables aging, carrier AP approvals, dispatch fee statements, and commission sign-offs. |
| **Accountant** | Lucas Wright | `accountant@acelegacyservices.com` | Customer receipts, carrier disbursement references, and statement preparation. |

> **Fast Role Testing:** On the `/login` screen or the top navigation bar, click any role badge to instantly switch into that specific portal view without manual credential re-entry.

---

## 3. Technology Architecture

- **Framework:** Next.js 15+ (App Router, Server Components & Server Actions)
- **Language:** TypeScript 5.7+
- **Styling:** Tailwind CSS with custom corporate logistics theme
- **Database:** Prisma ORM 6+ (Preconfigured with SQLite for zero-dependency local staging; 1-line switch to PostgreSQL for production)
- **Authentication:** Cookie-based session authentication with server-side RBAC validation
- **Icons:** Lucide React
- **Export Engine:** Native streaming CSV export for financial reports

---

## 4. Local Development & Setup

### Prerequisites
- Node.js v18+ or v20+ (tested on v24)
- npm v10+

### Installation Steps
```bash
# 1. Clone repository and navigate to folder
cd Talha-office

# 2. Install dependencies
npm install

# 3. Synchronize database schema
npx prisma db push

# 4. Seed database with realistic US freight demo data
npx tsx prisma/seed.ts

# 5. Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Production Build & Deployment

To build and run the optimized production bundle:
```bash
npm run build
npm run start
```

### PostgreSQL Production Configuration
To switch from SQLite to PostgreSQL:
1. In `prisma/schema.prisma`, update the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. In `.env`, set your connection string:
   ```env
   DATABASE_URL="postgresql://user:password@your-db-host:5432/ace_legacy_erp?schema=public"
   ```
3. Run `npx prisma db push && npx tsx prisma/seed.ts`.

---

## 6. System Workflows & Security Verification

1. **Strict Division Decoupling:**
   - Brokerage revenue represents total shipper invoice value minus contracted carrier cost.
   - Dispatch revenue reflects only the 8% service fee invoiced to the client fleet.
2. **Quote Revision History:**
   - Quotes create versioned records (`v1`, `v2`, `v3`). Previous pricing history is never overwritten.
   - Margin < 12.00% automatically flags a quote as `PENDING_INTERNAL_REVIEW`.
3. **Single Load Conversion:**
   - An accepted quote converts to exactly one Brokerage Load. Duplicate conversions are blocked.
4. **Immutable Audit Trail:**
   - Every login, role change, rate edit, status advance, and payment is permanently recorded in the `AuditLog` entity with actor identity, action type, and timestamps.
