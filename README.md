# Grameen Reach

Direct farm-to-city marketplace for Andhra Pradesh & Telangana.
Verified farmers sell fresh produce directly to urban buyers — no middlemen, fair prices.

## Architecture

```
grameen-reach/
├── backend/          NestJS REST API (TypeScript)
│   ├── src/
│   │   ├── auth/         JWT + RBAC (ADMIN / FARMER / BUYER)
│   │   ├── users/        User CRUD
│   │   ├── farmer/       Farmer profiles + document verification
│   │   ├── products/     Listings (fixed / bid / hybrid pricing)
│   │   ├── bids/         Bid management + counter-offer
│   │   ├── cart/         Per-user cart
│   │   ├── orders/       Multi-farmer order splitting into SubOrders
│   │   ├── payments/     Payment initiation (COD / UPI / Razorpay stub)
│   │   ├── govt-prices/  Mandi/APMC price data
│   │   ├── ai/           AI gateway (Gemini + Groq fallback)
│   │   └── files/        MinIO file upload
│   └── prisma/       Database schema + seed data
├── frontend/         Next.js 15 App Router (TypeScript + Tailwind CSS)
│   └── src/app/
│       ├── auth/         Login + Register
│       ├── buyer/        Browse, Cart, Orders
│       ├── farmer/       Dashboard, Listings, Bids, Orders
│       └── admin/        Farmer verification, Prices, AI logs
└── infra/            Docker Compose (db + redis + minio + api + web)
```

## Quick Start (Docker)

### Prerequisites
- Docker and Docker Compose
- Git

```bash
git clone https://github.com/DeviPrasad7/Grameen_Reach.git
cd Grameen_Reach

# Copy and configure environment
cp .env.example .env
# Edit .env — set JWT_SECRET (required) and AI keys (optional)

# Start all services
cd infra
docker compose up --build -d

# Run database migrations + seed demo data
docker compose exec api npx prisma migrate deploy
docker compose exec api npm run prisma:seed
```

### Services

| Service | URL |
|---------|-----|
| Web (Next.js) | http://localhost:3000 |
| API (NestJS) | http://localhost:3001 |
| Swagger Docs | http://localhost:3001/api/docs |
| MinIO Console | http://localhost:9001 |

MinIO default credentials: `minioadmin` / `minioadmin123`

## Local Development (without Docker)

### Backend

```bash
# Start infra only
cd infra && docker compose up db redis minio -d && cd ..

cd backend
cp ../.env.example .env          # edit DATABASE_URL etc.
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed              # load demo data
npm run start:dev                # http://localhost:3001
```

### Frontend

```bash
cd frontend
cp ../.env.example .env.local    # set NEXT_PUBLIC_API_URL=http://localhost:3001
npm install
npm run dev                      # http://localhost:3000
```

## Demo Accounts

After seeding:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@grameen.com | Admin@123 |
| Farmer (Level 1 verified seller) | farmer1@grameen.com | Farmer@123 |
| Farmer (Level 0 pending) | farmer2@grameen.com | Farmer@123 |
| Buyer | buyer1@grameen.com | Buyer@123 |
| Buyer | buyer2@grameen.com | Buyer@123 |

## Key Features

### For Farmers
- Product listings with fixed price, open bid, or hybrid (buy-now + bid) pricing
- Bid management — accept, reject, or counter buyer bids with AI-suggested counter prices
- AI Listing Generator — describe produce in Telugu or English; AI writes the full listing
- Price Coach — compare with real APMC mandi prices before setting price
- Document verification — upload ration card / land documents for Level 1 seller status
- Order tracking with status advancement (Placed → Confirmed → Packed → Delivered)
- Full Telugu language support in the UI

### For Buyers
- Browse and search fresh produce from verified AP/TS farmers
- Multi-farmer cart — buy from multiple farmers in one checkout
- Place bids on bid-enabled products
- AI Basket Builder — describe your weekly needs; AI recommends products
- Order tracking with sub-order status per farmer
- Cash on Delivery (COD) + UPI payment options

### For Admins
- Farmer verification queue — review submitted documents and approve/reject
- Mandi price management — add/upload APMC market prices
- AI audit logs — view all AI feature usage, token counts, and error rates

## API Documentation

Swagger UI is available at `http://localhost:3001/api/docs` when the API is running.

## Running Tests

```bash
cd backend
npm test              # unit tests (orders + RBAC logic)
npm run test:cov      # with coverage report
```

## Environment Variables

See `.env.example` for all required variables. Key ones:

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| JWT_SECRET | Yes | Secret for JWT signing (min 32 chars) |
| REDIS_URL | Yes | Redis connection string |
| MINIO_ENDPOINT | Yes | MinIO S3 endpoint |
| GEMINI_API_KEY | No | Google Gemini API key for AI features |
| GROQ_API_KEY | No | Groq API key (AI fallback) |

AI features degrade gracefully when no API key is set — the endpoints return a friendly error message.
