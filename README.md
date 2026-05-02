# Boardify — Public Feedback Board SaaS

> Collect, prioritise, and act on user feedback. A full-stack SaaS built with Node.js, PostgreSQL, React, and Docker.

[![CI](https://github.com/rishavkr206/boardify/actions/workflows/ci.yml/badge.svg)](https://github.com/rishavkr206/boardify/actions)

**Live demo:** [boardify.up.railway.app](https://boardify.up.railway.app) · **Demo board:** [/board/my-startup](https://boardify.up.railway.app/board/my-startup)

---

## What is Boardify?

Boardify lets teams create public feedback boards where users can submit feature requests, upvote ideas, and track what's being built — similar to [Canny.io](https://canny.io) or [Frill.co](https://frill.co).

**Key capabilities:**
- Multi-tenant: each account manages their own boards independently
- JWT authentication with access + refresh token rotation
- Anonymous or authenticated feedback submission
- Board owner controls post status (Open → Planned → Done)
- Analytics dashboard with post volume trends and status breakdown
- Fully paginated + filterable post list with search
- Rate limiting per route to prevent abuse
- Docker + GitHub Actions CI/CD pipeline

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express.js |
| Database | PostgreSQL 16 (via Prisma ORM) |
| Auth | JWT (access tokens 15m) + Refresh tokens (7d, DB-stored) |
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| DevOps | Docker, docker-compose, GitHub Actions |
| Deploy | Railway (backend + DB), Vercel (frontend) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      Frontend (React)                    │
│  Landing · Dashboard · Public Board · Analytics          │
│  Axios client with auto refresh-token interceptor        │
└────────────────────────┬─────────────────────────────────┘
                         │ REST API
┌────────────────────────▼─────────────────────────────────┐
│                   Backend (Express)                      │
│  /api/auth  /api/boards  /api/posts  /api/analytics      │
│  Rate limiting · Helmet · CORS · express-validator       │
└────────────────────────┬─────────────────────────────────┘
                         │ Prisma ORM
┌────────────────────────▼─────────────────────────────────┐
│               PostgreSQL (multi-tenant schema)           │
│  users · boards · posts · upvotes · comments             │
│  refresh_tokens (for token rotation)                     │
└──────────────────────────────────────────────────────────┘
```

---

## Database Schema

```
User ──< Board ──< Post ──< Upvote
                        └── Comment
User ──< RefreshToken
```

Notable design decisions:
- `upvoteCount` is denormalised on `Post` for O(1) reads (incremented via Prisma transaction alongside the Upvote insert)
- Refresh tokens stored in DB — allows revocation per-device or all-devices
- `slug` on `Board` is auto-generated from name (with uniqueness suffix if collision)
- All cascade deletes defined at DB level via Prisma relations

---

## API Reference

### Auth
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account, returns tokens |
| POST | `/api/auth/login` | — | Login, returns tokens |
| POST | `/api/auth/refresh` | — | Rotate refresh token |
| POST | `/api/auth/logout` | — | Revoke refresh token |
| POST | `/api/auth/logout-all` | ✓ | Revoke all sessions |
| GET | `/api/auth/me` | ✓ | Get current user |

### Boards
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/boards` | ✓ | Create board |
| GET | `/api/boards/mine` | ✓ | List my boards |
| GET | `/api/boards/slug/:slug` | Optional | Public board by slug |
| PUT | `/api/boards/:id` | ✓ Owner | Update board |
| DELETE | `/api/boards/:id` | ✓ Owner | Delete board |

### Posts
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/boards/:boardId/posts` | Optional | List posts (filter/sort/paginate) |
| POST | `/api/boards/:boardId/posts` | Optional | Submit feedback |
| PATCH | `/api/posts/:id/status` | ✓ Board owner | Update status |
| POST | `/api/posts/:id/upvote` | Optional | Toggle upvote |
| GET | `/api/posts/:id/comments` | — | List comments |
| POST | `/api/posts/:id/comments` | Optional | Add comment |

### Analytics
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/boards/:id/analytics` | ✓ Owner | Posts by status, top posts, volume trend |

---

## Local Development

### Prerequisites
- Node.js 20+
- Docker & docker-compose (for PostgreSQL)
- pnpm or npm

### Quick start

```bash
# 1. Clone
git clone https://github.com/rishavkr206/boardify.git
cd boardify

# 2. Start PostgreSQL
docker-compose up postgres -d

# 3. Setup backend
cd backend
cp .env.example .env
# Edit .env — generate secrets with:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
npm install
npx prisma migrate dev
npm run db:seed

# 4. Start backend
npm run dev

# 5. Setup frontend (new terminal)
cd ../frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

**Seed credentials:** `demo@boardify.dev` / `Password123`

---

## Deployment

### Backend → Railway

1. Create a Railway project, add a PostgreSQL service
2. Add the backend as a service pointing to `./backend`
3. Set environment variables from `.env.example`
4. Railway auto-detects Node.js and runs `npm start`

### Frontend → Vercel

1. Import repo into Vercel, set root to `./frontend`
2. Add env var: `VITE_API_URL=https://your-railway-backend.up.railway.app`
3. Deploy

### Docker (self-hosted)

```bash
# Build and run the full stack
docker-compose up --build
```

---

## Project Structure

```
boardify/
├── backend/
│   └── src/
│       ├── controllers/    # Business logic
│       ├── routes/         # Express route definitions + validation
│       ├── middleware/      # Auth, error handling, validation
│       ├── utils/          # JWT helpers, response helpers
│       └── prisma/         # Schema + seed
├── frontend/
│   └── src/
│       ├── api/            # Axios client + endpoint modules
│       ├── context/        # AuthContext (React)
│       ├── pages/          # Route-level components
│       └── components/     # Reusable UI components
├── .github/workflows/      # GitHub Actions CI
└── docker-compose.yml
```

---

## Author

**Rishav Kumar Agrawal** · [LinkedIn](https://linkedin.com/in/rishav-kr-agrawal) · [GitHub](https://github.com/rishavkr206)
