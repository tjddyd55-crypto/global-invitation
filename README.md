# Global Invitation

Global SaaS platform for creating and sharing digital invitations for weddings, events, and special occasions.

## Project Structure

```
global-invitation/
├── frontend/          # Next.js frontend application
├── backend/           # Express.js backend API server
└── docs/              # Project documentation
```

## Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL 14+ (for backend)

## Local Development

### Frontend (Port 3000)

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at: [http://localhost:3000](http://localhost:3000)

### Backend (Port 3001)

1. **Setup Database**

   Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/global_invitation?schema=public"
   PORT=3001
   ```

2. **Install Dependencies & Setup Database**

   ```bash
   cd backend
   npm install
   npm run db:migrate
   ```

3. **Start Development Server**

   ```bash
   npm run dev
   ```

Backend API will be available at: [http://localhost:3001](http://localhost:3001)

### Health Check

Backend health endpoint:
- GET [http://localhost:3001/health](http://localhost:3001/health)
- Response: `{ "status": "ok" }`

## Payment Info Page

The `/payment-info` page is a public page (no login required) that provides:
- Service description
- Pricing information
- Refund policy
- Customer support contact

Access it at: [http://localhost:3000/payment-info](http://localhost:3000/payment-info)

## Environment Variables

### Frontend
- `NEXT_PUBLIC_API_URL`: Backend public base URL (required in production).
  - Example: `https://<backend-public-url>`
- `NEXT_PUBLIC_SITE_URL`: Canonical/OG base URL (required in production).
  - Example: `https://<frontend-public-url>`

### Backend
- `DATABASE_URL`: PostgreSQL connection string (required)
- `PORT`: Server port (default: 3001)

See `backend/README.md` for detailed database setup instructions.

## Development Rules

- Do not implement features that are not explicitly requested
- Do not assume future requirements
- Always respect the current phase definition
- Minimal implementation is preferred over full features
- Stripe-related code must not be added unless explicitly instructed

## Documentation

See `docs/` folder for detailed documentation:
- `00_PROJECT_OVERVIEW.md` - 프로젝트 개요
- `01_CURRENT_PHASE.md` - 현재 개발 단계
- `02_STRIPE_POLICY.md` - Stripe 정책
- `03_DEVELOPMENT_RULES.md` - 개발 규칙
- `04_DATABASE.md` - 데이터베이스 설정 및 스키마

## Project Rules

- 🌍 Internationalization (i18n): [docs/i18n.md](docs/i18n.md)
