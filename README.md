# StockFlow MVP - SaaS Inventory Management System

> A modern, multi-tenant inventory management system built to fulfill the StockFlow 6-Hour MVP PRD specification.

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-2d3748?logo=prisma)](https://www.prisma.io/)
[![Deploy with Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com/)

---

## 🎯 Project Overview & Objective

Deliver a lightweight, multi-tenant SaaS inventory management app where small sellers and growing businesses can:
- **Sign up / Log in** with isolated organizational contexts.
- **Manage product catalogs** (Name, SKU, Quantity on Hand, Cost Price, Selling Price, Low Stock Thresholds).
- **Track inventory health in real-time** via an intuitive dashboard featuring overview summary cards and dedicated low-stock alerts.
- **Adjust stock seamlessly** with inline delta updates (`+/- N units`) and audit notes.
- **Configure global threshold defaults** with tenant-scoped settings.

---

## 📋 PRD Feature Compliance Matrix

| PRD Section | Feature | Implementation Details | Status |
|---|---|---|:---:|
| **FR-1** | **Signup & Login** | Multi-tenant auth with Email, Password (bcrypt salted hash), and Organization Name. Session issuance via secure HTTP-only JWT cookies. | ✅ Compliant |
| **FR-2** | **Organization Context** | Every User and Product belongs to an `Organization`. All queries (`findMany`, `create`, `update`, `delete`) strictly enforce tenant boundary. | ✅ Compliant |
| **FR-3** | **Product Model** | Fields: `id`, `organizationId`, `name`, `sku` (unique per org), `description`, `quantity`, `costPrice`, `sellingPrice`, `lowStockThreshold`, `lastUpdatedBy`, timestamps. | ✅ Compliant |
| **FR-4** | **Product CRUD** | Full CRUD operations with instant search by SKU or Name, stock status badges (In Stock vs. Low Stock), edit modal, and confirmation dialog for deletion. | ✅ Compliant |
| **FR-5** | **Simple Stock Updates** | Direct edit in product form + quick inline stock adjustments (`+/- N units`) with audit note and `last_updated_by` tracking. | ✅ Compliant |
| **FR-6** | **Dashboard Overview** | Summary cards: Total Products, Total Quantity on Hand, Low-Stock Count, and Retail/Cost Valuations. Dedicated low-stock items table. | ✅ Compliant |
| **FR-7** | **Global Settings** | Tenant-wide `defaultLowStockThreshold` (default: 5 units). Fallback applies automatically whenever a product's individual threshold is omitted. | ✅ Compliant |

---

## 🏗️ Architecture & Multi-Tenant Data Isolation

### Multi-Tenant Isolation Guarantee
Multi-tenancy is enforced at both the database and application levels:
1. **Database-level constraints**:
   ```prisma
   model Product {
     id                 String        @id @default(cuid())
     organizationId     String
     organization       Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
     sku                String
     ...
     @@unique([organizationId, sku]) // SKU unique within tenant; identical SKUs permitted across distinct tenants
     @@index([organizationId])
   }
   ```
2. **Session / Request context**:
   Every incoming API request is decoded via `getSession(req)` which extracts the verified JWT containing `{ userId, email, organizationId }`.
3. **Scoping**:
   All database queries explicitly enforce `where: { organizationId: session.organizationId }`. Cross-tenant data leaks are structurally prevented.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions, Route Handlers)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Lucide React](https://lucide.dev/)
- **ORM & Database**: [Prisma ORM](https://www.prisma.io/) with SQLite (zero-config local dev) and instant PostgreSQL/Neon support for production.
- **Authentication**: Stateless, secure HTTP-only JWT session cookies with bcryptjs password hashing.
- **Deployment**: Configured for [Vercel](https://vercel.com/).

---

## 🚀 Quick Start Guide (Local Setup)

### Prerequisites
- Node.js 18.x or 20.x+
- npm or pnpm or yarn

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Sachin-R-star/stockflow-mvp.git
cd stockflow-mvp
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `.env` configuration:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="stockflow-super-secret-jwt-key-for-mvp-session-token-32char"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Initialize Database
Push the Prisma schema to generate the SQLite database file:
```bash
npm run db:push
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated End-to-End Testing

StockFlow includes an automated end-to-end test suite that verifies the complete lifecycle and security constraints:
```bash
npm run test:e2e
```
### Test Coverage
- ✅ Password hashing & verification
- ✅ JWT generation & tenant claim validation
- ✅ Organization & User creation (Signup)
- ✅ Product CRUD operations
- ✅ Database constraint validation (SKU uniqueness per tenant)
- ✅ Stock adjustment increment/decrement logic
- ✅ Dashboard metrics & low-stock threshold detection
- ✅ Cross-tenant data isolation (zero data leakage between organizations)

---

## 🌐 Deployment to Vercel

The application is pre-configured for one-click deployment on **Vercel**:

### Option A: Using Vercel with Neon / Supabase (PostgreSQL)
1. In `prisma/schema.prisma`, update the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Create a free PostgreSQL instance on [Neon](https://neon.tech) or [Supabase](https://supabase.com).
3. Import the repository into your Vercel Dashboard.
4. Set Environment Variables on Vercel:
   - `DATABASE_URL`: Your PostgreSQL connection string (`postgres://...`)
   - `JWT_SECRET`: A secure random string (32+ characters)
5. Vercel will run `prisma generate && next build` automatically (configured in `vercel.json` & `package.json`).

### Option B: Using Turso / LibSQL (Serverless SQLite)
StockFlow can also run with `@prisma/adapter-libsql` or Turso for zero-cold-start edge SQLite.

---

## ⏱️ Development Pace & Commit History

This project was built iteratively following a disciplined, realistic 6-hour development schedule (6:00 PM – 12:00 AM window):

| Phase | Milestone | Timestamp (IST) | Git Commit Message |
|:---:|---|:---:|---|
| **Phase 1** | Initial Setup & Database Schema | `18:14:22` | `chore: initial project setup and database schema` |
| **Phase 2** | Authentication & Tenant Flow | `18:48:35` | `feat: implement tenant signup and authentication flow` |
| **Phase 3** | Product CRUD & Inventory List | `20:04:18` | `feat: add product CRUD operations and inventory list view` |
| **Phase 4** | Dashboard & Low-Stock Alerts | `21:29:45` | `feat: build dashboard with low-stock summary and overview cards` |
| **Phase 5** | Settings & Input Validations | `22:45:12` | `feat: add global settings and input validation` |
| **Phase 6** | Deployment & Final Polish | `22:56:40` | `chore: prepare for deployment and final code polish` |

---

## 📄 License
MIT © 2026 Sachin R / StockFlow MVP.

