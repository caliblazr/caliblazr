# Architecture — LifeSync AI

**Version:** 1.0.0 | **Date:** March 2026
**Status:** Implemented (MVP)

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser / PWA                         │
│                  React 18 + TypeScript + Vite               │
│           Tailwind CSS · Recharts · React Router            │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/JSON (Axios)
                           │ /api/*
┌──────────────────────────▼──────────────────────────────────┐
│                     Express.js Server                        │
│                  Node.js 22 · TypeScript · tsx              │
│                                                              │
│   /api/auth     /api/habits    /api/goals                   │
│   /api/coach    /api/users                                  │
│                                                              │
│                JWT Auth Middleware                           │
└─────────┬──────────────────────────────┬────────────────────┘
          │                              │
┌─────────▼──────────┐        ┌──────────▼──────────────────┐
│    SQLite DB        │        │   Anthropic Claude API       │
│  better-sqlite3     │        │   claude-opus-4-6            │
│  WAL mode, FK on    │        │   (AI Coach feature)         │
└─────────────────────┘        └──────────────────────────────┘
```

---

## 2. Directory Structure

```
caliblazr/
├── PRD.md                    # Product requirements
├── Architecture.md           # This file
├── AI_rules.md               # AI coding rules
├── Plan.md                   # Roadmap and sprint plans
├── README.md                 # Setup guide
├── package.json              # Root scripts
├── .gitignore
│
├── client/                   # React frontend
│   ├── vite.config.ts        # Vite + Tailwind + proxy config
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx          # React entry point
│   │   ├── App.tsx           # Root router + auth gate
│   │   ├── index.css         # Global styles + Tailwind import
│   │   │
│   │   ├── types/
│   │   │   └── index.ts      # Shared TypeScript interfaces
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts        # Axios instance + interceptors
│   │   │   └── auth.ts       # localStorage token helpers
│   │   │
│   │   ├── components/
│   │   │   ├── Logo.tsx      # SVG brand mark + wordmark
│   │   │   ├── Sidebar.tsx   # Navigation + XP bar + user card
│   │   │   ├── AdBanner.tsx  # Rotating ad slots (free tier)
│   │   │   └── PaywallModal.tsx # Upgrade flow + plan toggle
│   │   │
│   │   └── pages/
│   │       ├── AuthPage.tsx       # Login + Register
│   │       ├── Dashboard.tsx      # Today's habits + completion
│   │       ├── GoalsPage.tsx      # Goal CRUD + progress
│   │       ├── CoachPage.tsx      # AI chat interface
│   │       ├── AnalyticsPage.tsx  # Charts + KPIs
│   │       └── LeaderboardPage.tsx # XP rankings
│   └── package.json
│
└── server/                   # Express backend
    ├── tsconfig.json
    ├── package.json
    ├── .env                  # PORT, JWT_SECRET, ANTHROPIC_API_KEY
    └── src/
        ├── index.ts          # App entry + route mounting
        ├── db.ts             # SQLite setup + schema migrations
        ├── middleware/
        │   └── auth.ts       # JWT verify middleware
        └── routes/
            ├── auth.ts       # POST /register /login /upgrade
            ├── habits.ts     # CRUD + complete + analytics
            ├── goals.ts      # CRUD + progress
            ├── coach.ts      # AI chat + history
            └── users.ts      # Profile + leaderboard
```

---

## 3. Data Model

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | UUID v4 |
| email | TEXT UNIQUE | Login identifier |
| name | TEXT | Display name |
| password_hash | TEXT | bcrypt cost 10 |
| is_premium | INTEGER | 0=free, 1=premium |
| xp | INTEGER | Cumulative XP (10 per habit) |
| level | INTEGER | floor(xp/100) + 1 |
| created_at | TEXT | ISO datetime |

### `habits`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | UUID v4 |
| user_id | TEXT FK | → users.id CASCADE DELETE |
| name | TEXT | Habit label |
| description | TEXT | Optional detail |
| icon | TEXT | Emoji character |
| color | TEXT | Hex color for UI |
| frequency | TEXT | daily (v1), weekly (future) |
| goal_id | TEXT | Optional link to goal |
| current_streak | INTEGER | Days in current streak |
| longest_streak | INTEGER | All-time best streak |
| total_completions | INTEGER | Lifetime complete count |
| is_active | INTEGER | Soft delete flag |
| created_at | TEXT | ISO datetime |

### `habit_logs`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | UUID v4 |
| habit_id | TEXT FK | → habits.id CASCADE DELETE |
| user_id | TEXT FK | Denormalized for fast queries |
| completed_date | TEXT | YYYY-MM-DD |
| notes | TEXT | Optional journal entry |
| UNIQUE | (habit_id, completed_date) | One entry per day |

### `goals`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | UUID v4 |
| user_id | TEXT FK | → users.id CASCADE DELETE |
| title | TEXT | Goal label |
| description | TEXT | What success looks like |
| category | TEXT | health/career/learning/relationships/finance/personal |
| target_date | TEXT | ISO date |
| progress | INTEGER | 0–100 percent |
| status | TEXT | active / completed |
| created_at | TEXT | ISO datetime |

### `ai_messages`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | UUID v4 |
| user_id | TEXT FK | → users.id CASCADE DELETE |
| role | TEXT | user / assistant |
| content | TEXT | Message body |
| created_at | TEXT | ISO datetime |

---

## 4. API Contract

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | None | Register + seed habits |
| POST | /api/auth/login | None | Login → JWT |
| POST | /api/auth/upgrade | None | Upgrade user to premium |

### Habits

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/habits | Bearer | List active habits + today's completion |
| POST | /api/habits | Bearer | Create habit (free: max 3) |
| PUT | /api/habits/:id | Bearer | Update habit |
| DELETE | /api/habits/:id | Bearer | Soft-delete habit |
| POST | /api/habits/:id/complete | Bearer | Toggle daily completion + XP |
| GET | /api/habits/analytics | Bearer | 30-day stats + KPIs |

### Goals

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/goals | Bearer | List all goals |
| POST | /api/goals | Bearer | Create goal (free: max 3) |
| PUT | /api/goals/:id | Bearer | Update goal / progress |
| DELETE | /api/goals/:id | Bearer | Delete goal |

### AI Coach (Premium only)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/coach/messages | Bearer + Premium | Chat history (last 50) |
| POST | /api/coach/chat | Bearer + Premium | Send message → Claude reply |
| DELETE | /api/coach/messages | Bearer + Premium | Clear history |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/users/me | Bearer | Profile + auto level-up |
| GET | /api/users/leaderboard | Bearer | Top 10 by XP |

---

## 5. Authentication Flow

```
Client                    Server                     DB
  │                          │                        │
  │─── POST /auth/register ──▶                        │
  │     {email, name, pass}  │─── hash password ──────│
  │                          │─── INSERT user ─────────│
  │                          │─── INSERT 3 seed habits─│
  │                          │─── sign JWT (30d) ──────│
  │◀── {token, user} ────────│                        │
  │                          │                        │
  │  localStorage.setItem    │                        │
  │  (token, user)           │                        │
  │                          │                        │
  │─── GET /api/habits ─────▶│                        │
  │   Authorization: Bearer  │─── verify JWT ─────────│
  │                          │─── query habits ────────│
  │◀── [{habit…}] ───────────│                        │
```

---

## 6. AI Coach Architecture

```
POST /api/coach/chat
{message: "How am I doing?"}
         │
         ▼
[1] Verify premium (403 if free)
         │
         ▼
[2] Fetch user context from DB:
    - name, xp, level
    - all active habits (name, streak, total)
    - all goals (title, category, progress)
    - today's completion count
         │
         ▼
[3] Build system prompt with context injected
         │
         ▼
[4] Fetch last 10 messages from ai_messages
         │
         ▼
[5] POST to Claude API (claude-opus-4-6)
    max_tokens: 500
         │
         ▼
[6] Save user msg + assistant reply to DB
         │
         ▼
[7] Return {reply} to client
```

**Demo mode:** When `ANTHROPIC_API_KEY` is not set, the server returns
one of three pre-written, contextually appropriate demo responses.
No external calls are made.

---

## 7. Monetization Architecture

### Free Tier Gates
Two locations enforce the 3-habit limit:
1. **Server** (`POST /api/habits`) — returns HTTP 403 + `code: "UPGRADE_REQUIRED"` if habit count ≥ 3
2. **Client** — catches 403, opens `<PaywallModal>` with the error message as trigger text

Same pattern applies to goals (max 3) and AI Coach (blocked for `isPremium: false`).

### Paywall Modal Flow
```
User clicks locked feature
         │
         ▼
PaywallModal opens
  - Monthly / Yearly plan toggle
  - Feature list
  - CTA button
         │
         ▼
POST /api/auth/upgrade {userId}
  (Production: redirect to Stripe Checkout first)
         │
         ▼
Server sets is_premium = 1
Signs new JWT with isPremium: true
         │
         ▼
Client updates localStorage token + user
Calls onUpgrade(updatedUser)
Modal closes, feature unlocks immediately
```

### Ad Banner System
- `<AdBanner>` component is rendered on Dashboard and Goals pages when `user.isPremium === false`
- Three rotating ad copies (array, random selection on mount)
- Each banner is dismissible (local React state)
- Ad slot HTML structure is compatible with Google AdSense placement
- In production: replace inner div with `<ins class="adsbygoogle">` tag

---

## 8. Security Considerations

| Risk | Mitigation |
|------|------------|
| Password brute force | bcrypt cost 10, rate limiting (TODO v1.1) |
| JWT theft | HttpOnly cookie migration (TODO v1.1), 30d expiry |
| SQL injection | better-sqlite3 parameterized queries throughout |
| XSS | React escapes JSX, no dangerouslySetInnerHTML |
| CORS | Allowlist: localhost:5173, localhost:4173 only |
| Privilege escalation | `isPremium` checked server-side on every premium route |

---

## 9. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3001) |
| `JWT_SECRET` | Yes | HS256 signing secret (min 32 chars) |
| `ANTHROPIC_API_KEY` | No | Enables real AI Coach (falls back to demo) |

---

## 10. Deployment Topology (Recommended)

```
Internet
    │
    ▼
CDN (Cloudflare)
    │
    ├── Static assets → client/dist/ (served by CDN)
    │
    └── /api/* → Node.js server (Railway / Fly.io)
                      │
                      └── SQLite file (persistent volume)
                              OR
                          Turso (libSQL cloud SQLite)
```

For production scale: replace SQLite with **PostgreSQL** (via pg/Drizzle ORM),
add Redis for session caching, deploy to containerized environment.
