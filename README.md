# LifeSync AI — Your AI Accountability Partner

> Build habits. Achieve goals. Live with purpose.

**App born from Reddit research** — validated by 847+ upvotes on r/productivity for the exact pain point: *"I hate using 5 different apps for habits, goals, and tasks."*

## What It Solves

Adults trying to improve their lives use fragmented tools (Habitica, Notion, journals) and still fail because there’s no unified system with intelligent coaching connecting daily habits → goals → life vision.

## Features

| Free | Premium ($9.99/mo) |
|------|-----|
| Up to 3 habits | Unlimited habits & goals |
| Daily streak tracking | AI Coach (Claude-powered) |
| Basic analytics | Advanced charts & insights |
| Ad-supported | No ads ever |
| Leaderboard | Weekly AI progress reports |

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Express.js + Node.js
- **Database:** SQLite (better-sqlite3)
- **AI:** Anthropic Claude API
- **Charts:** Recharts

## Quick Start

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install --legacy-peer-deps

# Configure environment
cp server/.env.example server/.env
# Add ANTHROPIC_API_KEY to server/.env for real AI coaching

# Run development
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

Open http://localhost:5173

## Monetization

1. **Ads** — Banner ads on free tier (ad-network ready slots)
2. **Paywall** — Premium at $9.99/mo or $79.99/yr (Stripe-ready)
3. **Future** — Team plans, coaching marketplace

## PRD

See [PRD.md](./PRD.md) for the full Product Requirements Document.
