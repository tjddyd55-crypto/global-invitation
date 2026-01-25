# Backend API Server

Express.js + TypeScript + Prisma backend server for Global Invitation.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/global_invitation?schema=public"
PORT=3001
```

### 3. Run Migrations

```bash
npm run db:migrate
```

This will:
- Create the database if it doesn't exist
- Run all pending migrations
- Generate Prisma Client

### 4. Generate Prisma Client

```bash
npm run db:generate
```

## Development

### Start Development Server

```bash
npm run dev
```

Server will run on http://localhost:3001

### Available Endpoints

- `GET /health` - Health check endpoint (returns `{ "status": "ok" }`)

## Database Schema

### Users Table
- `id` (uuid, primary key)
- `email` (string, unique, nullable)
- `created_at` (timestamp)

### Invitations Table
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to users, nullable)
- `slug` (string, unique)
- `country_code` (string, default: 'GLOBAL')
- `language` (string, default: 'en')
- `status` (string, default: 'draft') - 'draft' | 'published'
- `is_paid` (boolean, default: false)
- `can_share` (boolean, default: false)
- `paid_at` (timestamp, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Event Logs Table
- `id` (uuid, primary key)
- `event_type` (string)
- `template_type` (string)
- `language` (string)
- `page_url` (string)
- `metadata` (jsonb, nullable)
- `created_at` (timestamp)

## Prisma Commands

- `npm run db:migrate` - Create and run migrations
- `npm run db:generate` - Generate Prisma Client
- `npm run db:studio` - Open Prisma Studio (database GUI)
