# FundsRoom ERP Portal

A production-style **Mini ERP + CRM Operations Portal** for a wholesale/distribution company. Built as a full-stack monorepo demonstrating REST API design, relational database modeling, JWT authentication, role-based authorization, and a clean React frontend.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Business Problem](#business-problem)
3. [Features](#features)
4. [Tech Stack](#tech-stack)
5. [Architecture](#architecture)
6. [Folder Structure](#folder-structure)
7. [Database Design](#database-design)
8. [Authentication & Role Permissions](#authentication--role-permissions)
9. [API Documentation](#api-documentation)
10. [Environment Variables](#environment-variables)
11. [Local Setup](#local-setup)
12. [Database Setup & Migrations](#database-setup--migrations)
13. [Running the Application](#running-the-application)
14. [Test Credentials](#test-credentials)
15. [Deployment Instructions](#deployment-instructions)
16. [Design Decisions & Assumptions](#design-decisions--assumptions)
17. [Known Limitations](#known-limitations)
18. [Future Improvements](#future-improvements)

---

## Project Overview

FundsRoom ERP is a web-based operations portal that consolidates Customer Relationship Management (CRM), product inventory, and sales challan workflows into a single platform. It is designed for teams in wholesale and distribution businesses where multiple roles (admin, sales, warehouse, accounts) need controlled access to operational data.

---

## Business Problem

Wholesale/distribution companies often manage customers, inventory, and delivery challans across disconnected spreadsheets and manual processes. This leads to:

- No visibility into stock levels until it's too late
- No audit trail for who created or confirmed a delivery
- Stock being accidentally over-committed across multiple draft orders
- No structured follow-up system for sales leads

This portal solves all of the above with a structured, role-protected workflow.

---

## Features

### Authentication
- JWT-based login with bcrypt password hashing
- Role-based access control enforced on every API endpoint
- Four distinct roles: ADMIN, SALES, WAREHOUSE, ACCOUNTS

### Customer CRM
- Full customer CRUD (name, mobile, email, business, GST, type, status, address)
- Customer types: Retail, Wholesale, Distributor
- Customer lifecycle status: Lead → Active → Inactive
- Follow-up note system with timestamps and next follow-up dates
- Follow-up history per customer
- Search and filter by name, mobile, status, type

### Product & Inventory
- Full product CRUD with SKU uniqueness enforcement
- Stock level tracking per product
- Minimum stock alert threshold
- Location/warehouse field
- Manual stock movement recording (IN / OUT) with reason and reference
- Complete stock movement history / audit log
- Low-stock dashboard showing all products below minimum threshold
- Stock can never go negative — enforced at the service layer and database

### Sales Challan
- Create challans with multiple line items
- Auto-generated challan number (format: `CH-YYYYMMDD-XXXX`)
- Draft → Confirmed → Cancelled workflow
- **Draft does NOT deduct stock** — this is the critical business rule
- **Confirmation is an atomic database transaction** — all items must pass stock validation; if any one fails, nothing is committed
- Product snapshot on challan items (name, SKU, price captured at creation time)
- Confirmed challan cancellation restores stock via corresponding IN movements
- Full challan history per customer

### Dashboard
- Total customers, products, stock units
- Low-stock alert count
- Draft and confirmed challan counts
- Recent challans table

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend Runtime | Node.js 22 |
| Backend Language | TypeScript 5 |
| Web Framework | Express.js 4 |
| ORM | Prisma 5 |
| Database | PostgreSQL (Neon for production) |
| Authentication | JWT (jsonwebtoken) + bcryptjs |
| Validation | express-validator |
| Frontend | React 18 + TypeScript |
| Frontend Build | Vite 5 |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Notifications | react-hot-toast |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |
| Database Host | Neon PostgreSQL |

---

## Architecture

```mermaid
graph TB
    Browser["Browser (React SPA)"]
    Vite["Vite Dev Server :5173"]
    Express["Express API Server :5000"]
    Prisma["Prisma ORM"]
    DB["PostgreSQL (Neon)"]

    Browser --> Vite
    Vite -->|"/api/* proxy"| Express
    Express --> Prisma
    Prisma --> DB

    subgraph Backend
        Express --> Auth["Auth Middleware"]
        Auth --> Routes["Route Handlers"]
        Routes --> Controllers
        Controllers --> Services
        Services --> Prisma
    end
```

### Request flow

1. React sends `axios` request with `Authorization: Bearer <token>` header
2. Express `authenticate` middleware verifies JWT
3. `authorize(...roles)` middleware checks role against the required list
4. Controller calls service function
5. Service executes Prisma query (or transaction)
6. JSON response sent back with `{ success, data, message }` envelope

---

## Folder Structure

```
fundsroom-erp/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema + enums
│   │   ├── seed.ts                # Demo data seed script
│   │   └── migrations/            # Prisma migration files
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts             # Environment variable loader
│   │   │   └── prisma.ts          # Prisma client singleton
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── customer.controller.ts
│   │   │   ├── product.controller.ts
│   │   │   └── challan.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT authenticate + authorize
│   │   │   ├── validate.ts        # express-validator result handler
│   │   │   └── errorHandler.ts    # Global error + 404 handler
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── customer.routes.ts
│   │   │   ├── product.routes.ts
│   │   │   ├── stock.routes.ts
│   │   │   ├── challan.routes.ts
│   │   │   └── dashboard.routes.ts
│   │   ├── services/
│   │   │   ├── customer.service.ts
│   │   │   ├── product.service.ts
│   │   │   └── challan.service.ts  # Critical transaction logic here
│   │   ├── types/
│   │   │   └── index.ts           # Shared TypeScript types
│   │   ├── utils/
│   │   │   ├── response.ts        # sendSuccess / sendError helpers
│   │   │   ├── challanNumber.ts   # Challan number generator
│   │   │   └── pagination.ts      # Pagination helpers
│   │   ├── validators/
│   │   │   ├── auth.validator.ts
│   │   │   ├── customer.validator.ts
│   │   │   ├── product.validator.ts
│   │   │   └── challan.validator.ts
│   │   ├── app.ts                 # Express app setup, CORS, routes
│   │   └── index.ts               # Server entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── Sidebar.tsx
│   │   │   └── ui/
│   │   │       ├── Badge.tsx
│   │   │       ├── ConfirmDialog.tsx
│   │   │       ├── Modal.tsx
│   │   │       ├── Pagination.tsx
│   │   │       └── Spinner.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx    # JWT auth state + login/logout
│   │   ├── layouts/
│   │   │   ├── AppLayout.tsx      # Sidebar + main content shell
│   │   │   └── ProtectedRoute.tsx # Auth + role guard
│   │   ├── pages/
│   │   │   ├── auth/LoginPage.tsx
│   │   │   ├── dashboard/DashboardPage.tsx
│   │   │   ├── customers/
│   │   │   │   ├── CustomersPage.tsx
│   │   │   │   ├── CustomerFormPage.tsx
│   │   │   │   └── CustomerDetailPage.tsx
│   │   │   ├── products/
│   │   │   │   ├── ProductsPage.tsx
│   │   │   │   └── ProductFormPage.tsx
│   │   │   ├── inventory/
│   │   │   │   ├── InventoryPage.tsx
│   │   │   │   └── LowStockPage.tsx
│   │   │   └── challans/
│   │   │       ├── ChallansPage.tsx
│   │   │       ├── ChallanFormPage.tsx
│   │   │       └── ChallanDetailPage.tsx
│   │   ├── services/              # Axios API call wrappers
│   │   │   ├── api.ts             # Axios instance + interceptors
│   │   │   ├── auth.service.ts
│   │   │   ├── customer.service.ts
│   │   │   ├── product.service.ts
│   │   │   ├── challan.service.ts
│   │   │   └── dashboard.service.ts
│   │   ├── types/index.ts         # Shared TypeScript interfaces
│   │   ├── App.tsx                # Route definitions
│   │   ├── main.tsx               # React entry point
│   │   └── index.css              # Global styles + design tokens
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── postman/
│   └── FundsRoom-ERP.postman_collection.json
│
├── .gitignore
├── package.json                   # Monorepo root
└── README.md
```

---

## Database Design

```mermaid
erDiagram
    users {
        String id PK
        String name
        String email UK
        String password
        Role   role
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
    }

    customers {
        String id PK
        String name
        String mobile
        String email
        String businessName
        String gstNumber
        CustomerType customerType
        String address
        CustomerStatus status
        DateTime followUpDate
        String notes
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
    }

    customer_followups {
        String id PK
        String customerId FK
        String createdById FK
        String note
        DateTime followUpDate
        DateTime createdAt
    }

    products {
        String id PK
        String name
        String sku UK
        String category
        Decimal unitPrice
        Int currentStock
        Int minimumStock
        String location
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
    }

    stock_movements {
        String id PK
        String productId FK
        String createdById FK
        Int quantity
        MovementType movementType
        String reason
        String reference
        DateTime createdAt
    }

    challans {
        String id PK
        String challanNumber UK
        String customerId FK
        String createdById FK
        ChallanStatus status
        Int totalQuantity
        Decimal totalAmount
        String notes
        DateTime confirmedAt
        DateTime cancelledAt
        DateTime createdAt
        DateTime updatedAt
    }

    challan_items {
        String id PK
        String challanId FK
        String productId FK
        String productName
        String productSku
        Decimal unitPrice
        Int quantity
        Decimal totalPrice
        DateTime createdAt
    }

    users ||--o{ challans : "creates"
    users ||--o{ stock_movements : "records"
    users ||--o{ customer_followups : "adds"
    customers ||--o{ challans : "has"
    customers ||--o{ customer_followups : "has"
    products ||--o{ stock_movements : "tracks"
    products ||--o{ challan_items : "appears in"
    challans ||--o{ challan_items : "contains"
```

### Key design decisions

**Product snapshot on challan items** — `challan_items` stores `productName`, `productSku`, and `unitPrice` at the time of challan creation, not just a foreign key to `products`. This means if a product's name or price changes later, historical challans still reflect what was agreed at the time of the transaction.

**Soft delete** — Customers and products use an `isActive` boolean instead of hard deletion, preserving referential integrity with historical challans.

**Decimal for money** — `unitPrice` and `totalPrice` use `Decimal(12,2)` / `Decimal(14,2)` rather than `float` to avoid floating-point rounding errors.

---

## Authentication & Role Permissions

JWT tokens are signed with `JWT_SECRET` and expire in 7 days by default.

### Permission Matrix

| Action | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
|--------|:-----:|:-----:|:---------:|:--------:|
| Login | ✅ | ✅ | ✅ | ✅ |
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| **Customers** | | | | |
| List / View customers | ✅ | ✅ | ❌ | ✅ |
| Create / Edit customers | ✅ | ✅ | ❌ | ❌ |
| Delete customers | ✅ | ❌ | ❌ | ❌ |
| Add follow-ups | ✅ | ✅ | ❌ | ❌ |
| View follow-ups | ✅ | ✅ | ❌ | ✅ |
| **Products** | | | | |
| List / View products | ✅ | ✅ | ✅ | ✅ |
| Create / Edit products | ✅ | ❌ | ✅ | ❌ |
| Delete products | ✅ | ❌ | ❌ | ❌ |
| **Inventory** | | | | |
| View stock movements | ✅ | ❌ | ✅ | ✅ |
| Record stock movement | ✅ | ❌ | ✅ | ❌ |
| View low-stock list | ✅ | ✅ | ✅ | ✅ |
| **Challans** | | | | |
| View challans | ✅ | ✅ | ✅ | ✅ |
| Create challan | ✅ | ✅ | ❌ | ❌ |
| Update draft challan | ✅ | ✅ | ❌ | ❌ |
| Confirm challan | ✅ | ✅ | ✅ | ❌ |
| Cancel challan | ✅ | ✅ | ❌ | ❌ |

> Authorization is enforced server-side on every endpoint. Frontend role restrictions are UI conveniences only.

---

## API Documentation

All endpoints are prefixed with `/api`. All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

All responses follow this envelope:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Error responses:
```json
{
  "success": false,
  "message": "Descriptive error message",
  "errors": ["Optional array of validation errors"]
}
```

---

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | None | Login, returns JWT + user |
| GET | `/api/auth/me` | Required | Get current user |

**POST /api/auth/login**
```json
{ "email": "admin@example.com", "password": "Password@123" }
```

---

### Customers

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/customers` | ✅ | ADMIN, SALES, ACCOUNTS | List customers (paginated, filterable) |
| GET | `/api/customers/:id` | ✅ | ADMIN, SALES, ACCOUNTS | Get customer detail |
| POST | `/api/customers` | ✅ | ADMIN, SALES | Create customer |
| PUT | `/api/customers/:id` | ✅ | ADMIN, SALES | Update customer |
| DELETE | `/api/customers/:id` | ✅ | ADMIN | Soft-delete customer |
| POST | `/api/customers/:id/followups` | ✅ | ADMIN, SALES | Add follow-up note |
| GET | `/api/customers/:id/followups` | ✅ | ADMIN, SALES, ACCOUNTS | List follow-ups |

**Query params for GET /api/customers:**
- `search` — searches name, mobile, email, business name
- `status` — `LEAD` | `ACTIVE` | `INACTIVE`
- `customerType` — `RETAIL` | `WHOLESALE` | `DISTRIBUTOR`
- `page`, `limit`

---

### Products

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/products` | ✅ | All | List products (paginated, filterable) |
| GET | `/api/products/:id` | ✅ | All | Get product detail |
| POST | `/api/products` | ✅ | ADMIN, WAREHOUSE | Create product |
| PUT | `/api/products/:id` | ✅ | ADMIN, WAREHOUSE | Update product |
| DELETE | `/api/products/:id` | ✅ | ADMIN | Soft-delete product |

---

### Inventory / Stock

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/stock/movements` | ✅ | ADMIN, WAREHOUSE, ACCOUNTS | List all stock movements |
| POST | `/api/stock/movements` | ✅ | ADMIN, WAREHOUSE | Record a stock IN or OUT |
| GET | `/api/stock/low-stock` | ✅ | All | Products at or below minimum stock |

**POST /api/stock/movements body:**
```json
{
  "productId": "clxxx",
  "quantity": 50,
  "movementType": "IN",
  "reason": "Purchase order received",
  "reference": "PO-2026-001"
}
```

---

### Challans

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/challans` | ✅ | All | List challans (paginated, filterable) |
| GET | `/api/challans/:id` | ✅ | All | Get challan detail with items |
| POST | `/api/challans` | ✅ | ADMIN, SALES | Create challan as DRAFT |
| PUT | `/api/challans/:id` | ✅ | ADMIN, SALES | Update DRAFT challan |
| POST | `/api/challans/:id/confirm` | ✅ | ADMIN, SALES, WAREHOUSE | Confirm challan (atomic stock deduction) |
| POST | `/api/challans/:id/cancel` | ✅ | ADMIN, SALES | Cancel challan |

**POST /api/challans body:**
```json
{
  "customerId": "clxxx",
  "items": [
    { "productId": "clyyy", "quantity": 10 },
    { "productId": "clzzz", "quantity": 5 }
  ],
  "notes": "Optional notes"
}
```

**Critical — Confirm challan:**
- Validates ALL items have sufficient stock before touching anything
- Uses a single `prisma.$transaction` — if any item fails, nothing is committed
- Returns `409 Conflict` with a descriptive message listing exactly which products have insufficient stock

---

### Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard/stats` | ✅ | Returns aggregate statistics |

---

## Environment Variables

### Backend (`backend/.env`)

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"

# JWT — use a long random string (min 32 chars)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL="http://localhost:5173"
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000
```

For production (Vercel), set `VITE_API_URL` to your Render backend URL.

---

## Local Setup

### Prerequisites

- Node.js 18+
- npm 9+
- A PostgreSQL database (local or [Neon](https://neon.tech) free tier)

### 1 — Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/fundsroom-erp.git
cd fundsroom-erp

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2 — Configure environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env and fill in DATABASE_URL and JWT_SECRET
```

```bash
# Frontend
cd frontend
cp .env.example .env
# Default VITE_API_URL=http://localhost:5000 works for local dev
```

---

## Database Setup & Migrations

```bash
cd backend

# Run migrations (creates all tables)
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed the database with demo data
npm run seed

# Optional — open Prisma Studio to inspect data
npx prisma studio
```

---

## Running the Application

### Backend (port 5000)

```bash
cd backend
npm run dev
```

### Frontend (port 5173)

```bash
cd frontend
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

The Vite dev server proxies all `/api/*` requests to `http://localhost:5000` — no CORS issues in development.

### Production builds

```bash
# Backend
cd backend
npm run build        # Compiles TypeScript to dist/
npm start            # Runs compiled output

# Frontend
cd frontend
npm run build        # Outputs to dist/
npm run preview      # Local preview of production build
```

---

## Test Credentials

All users have the password `Password@123`.

| Email | Role | Access |
|-------|------|--------|
| `admin@example.com` | ADMIN | Full access |
| `sales@example.com` | SALES | Customers, products (view), challans |
| `warehouse@example.com` | WAREHOUSE | Products, inventory, confirm challans |
| `accounts@example.com` | ACCOUNTS | Customers (view), stock movements (view), challans (view) |

---

## Deployment Instructions

### Database — Neon PostgreSQL (free)

1. Create account at [neon.tech](https://neon.tech)
2. Create a new project and database
3. Copy the connection string (it looks like `postgresql://user:pass@host/dbname?sslmode=require`)
4. Use this as `DATABASE_URL` in your backend environment

### Backend — Render (free)

1. Push the repo to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Select your repo, set root directory to `backend`
4. Build command: `npm install && npm run prisma:migrate:deploy && npm run build`
5. Start command: `npm start`
6. Add environment variables:
   - `DATABASE_URL` — your Neon connection string
   - `JWT_SECRET` — a secure random string
   - `NODE_ENV=production`
   - `FRONTEND_URL` — your Vercel frontend URL (set after deploying frontend)

### Frontend — Vercel (free)

1. Go to [vercel.com](https://vercel.com) and import your GitHub repo
2. Set **Root Directory** to `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variable:
   - `VITE_API_URL` — your Render backend URL (e.g. `https://fundsroom-erp.onrender.com`)

### After deploying both:

1. Update `FRONTEND_URL` on Render to your Vercel URL (for CORS)
2. Re-run the seed script once against production:
   ```bash
   # From local machine with production DATABASE_URL
   DATABASE_URL="<neon-url>" npm run seed
   ```

---

## Design Decisions & Assumptions

### Product Snapshot on Challan Items

`challan_items` stores `productName`, `productSku`, and `unitPrice` at the moment the challan is created, not just a `productId` reference. This is intentional:

> **Reason:** Products change over time. If "Basmati Rice" is renamed to "Premium Basmati Rice" or its price changes from ₹120 to ₹135, old challans must still reflect exactly what was sold at the time of the transaction. Storing only a foreign key would corrupt historical data when the product record is edited.

This mirrors standard accounting practice (invoices are immutable once issued).

### Draft Challan Does Not Touch Stock

Stock is only deducted at confirmation, not at draft creation. This is deliberate:

> **Reason:** A salesperson may create many drafts while negotiating. Deducting stock at draft time would make the stock appear unavailable to other users before any deal is confirmed.

### Atomic Confirmation Transaction

Challan confirmation validates **all items** before modifying **any** stock. This is a single `prisma.$transaction`:

> **Reason:** Partial stock deduction (e.g. product A deducted, then product B fails) would leave the database in an inconsistent state. The entire confirmation either succeeds completely or rolls back completely.

### Soft Delete

Customers and products are soft-deleted (`isActive = false`) rather than hard-deleted:

> **Reason:** Hard-deleting a customer or product would orphan existing challans, breaking referential integrity and destroying historical records.

### Indian Mobile Validation

Mobile numbers are validated against the pattern `^[6-9]\d{9}$`:

> **Assumption:** The business operates in India. All customer mobile numbers are 10-digit Indian mobile numbers starting with 6–9.

### GST Number Validation

GST is optional but validated against the official Indian GST format when provided:

> **Assumption:** Not all customers have GST registration (retail customers typically don't).

### Challan Number Format

Challan numbers follow `CH-YYYYMMDD-XXXX` (e.g. `CH-20260808-0001`):

> **Assumption:** Sequential numbering within a day is sufficient for demo purposes. A production system might use a database sequence for guaranteed uniqueness under high concurrency.

---

## Known Limitations

- **No email notifications** — follow-up reminders are not emailed; they only appear in the UI
- **No PDF export** — challan/invoice PDF generation is not implemented (listed as a bonus feature)
- **No image upload** — product images are not supported
- **No multi-warehouse** — the `location` field is a free-text string, not a structured warehouse entity
- **No real-time updates** — the UI does not poll or use WebSockets; a manual refresh is needed to see changes made by other users
- **Challan number concurrency** — the current number generator uses a count-based sequence which could theoretically produce duplicates under very high concurrency (mitigated by the unique constraint on `challanNumber`)
- **No unit tests** — test infrastructure is not set up; testing is manual via Postman

---

## Future Improvements

- [ ] Email notifications for follow-up reminders (Resend / SendGrid)
- [ ] PDF challan/invoice export (Puppeteer or react-pdf)
- [ ] Product image upload (AWS S3 / Cloudflare R2)
- [ ] Multi-warehouse / location management
- [ ] Role management UI (admin can create/edit users)
- [ ] Automated test suite (Jest + Supertest for backend, Vitest + React Testing Library for frontend)
- [ ] Docker Compose for local development
- [ ] GitHub Actions CI pipeline (lint → type-check → test → build)
- [ ] Audit log (track all entity changes with before/after values)
- [ ] Advanced reporting (revenue by customer, stock turnover rate)
- [ ] Mobile app (React Native)
