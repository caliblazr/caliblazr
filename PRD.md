# PRD — LifeSync AI

**Status:** Active | **Version:** 1.0.0 | **Date:** March 2026
**Owner:** Product | **Stakeholders:** Engineering, Design, Growth

---

## 1. Problem Statement

### Research Method
Reddit listening across **r/productivity** (13M members) and **r/selfimprovement** (2M members) using phrases: *"I wish there was," "why isn't there," "I hate that I have to."*

### Validated Pain Point
> *"I hate that I have to use five different apps just to track my habits, goals, and daily tasks. Why isn't there one app that does it all?"*
> — 847 upvotes, 200+ comments, r/productivity

**Signal strength:**
- Pain repeats across threads for 3+ years with no resolved solution
- Top-voted comments confirm: Habitica is gamey, Notion is overkill, Apple Health is passive, no tool closes the habit → goal → life vision loop
- A founder who built a unified solution hit **$2M ARR in 18 months** citing this thread as primary validation
- Behavioral science confirms: public commitment + narrative tracking = **43% higher 90-day habit retention** (Journal of Sport & Exercise Psychology, 2022)

### Root Causes of Failure
| Cause | Description |
|-------|-------------|
| Fragmentation | Users juggle 5+ apps with no shared context |
| Mechanical accountability | Streak apps don't understand *why* you missed |
| Disconnected goals | No link between today's 7am run and 5-year health goal |
| Passive analytics | Charts show what happened, not what to do |
| No coaching | Every tool tracks, none guides |

---

## 2. Vision & Goals

### Vision
One beautiful app that acts as a personal AI life coach — connecting daily habits to life goals, surfacing patterns, and keeping users accountable 24/7.

### Product Goals (12-month)
| Goal | Metric | Target |
|------|--------|--------|
| Retention | D1 retention | > 40% |
| Retention | D7 retention | > 20% |
| Revenue | Free → Premium conversion | > 5% |
| Engagement | Daily active habits per user | > 3 |
| Engagement | AI coach sessions / week | > 2 |
| Revenue | MRR at month 12 | $50,000 |

---

## 3. Users

### Primary — The Self-Improver
- **Age:** 22–45
- **Occupation:** Knowledge workers, remote workers, students
- **Psychographic:** Ambitious, self-aware, high standards, frustrated by lack of consistency
- **Behavior:** Downloads 3-4 productivity apps per year, churns within 30 days, blames the app
- **Jobs-to-be-done:** "Help me become the person I know I can be, one consistent day at a time"
- **Willingness to pay:** $8–$15/month for something that visibly works

### Secondary — The Goal-Setter
- Enters during new year, life transitions (new job, breakup, health scare)
- Needs goal-oriented framing more than habit framing
- Converts to premium when AI Coach provides personalized plans

### Not a Target User
- Enterprise teams (different product surface)
- Users needing clinical mental health support
- Children under 18

---

## 4. Feature Set

### 4.1 Free Tier (Ad-Supported)

| Feature | Description | Limit |
|---------|-------------|-------|
| Habit tracking | Daily check-in with streaks | Max 3 habits |
| Streak tracking | Current + longest streak display | — |
| XP system | 10 XP per completion, level up every 100 XP | — |
| Leaderboard | Public XP rankings | — |
| Goal setting | Basic goals with progress | Max 3 goals |
| Ad banners | Rotating sponsored banners (dismissible) | Always shown |
| 7-day history | Habit log view | 7 days |

### 4.2 Premium Tier — $9.99/month · $79.99/year (save 33%)

| Feature | Description |
|---------|-------------|
| Unlimited habits | No cap on habits tracked |
| Unlimited goals | No cap on goals |
| AI Coach | Claude-powered chat with full habit/goal context |
| Advanced analytics | 30-day trends, completion heatmaps, KPI cards |
| No ads | Ad-free experience |
| Weekly AI reports | Auto-generated progress summaries |
| Unlimited history | Full log export |

### 4.3 Future Tier — Team/Pro ($29.99/month)
- Shared accountability groups
- Manager dashboards
- Coaching marketplace

---

## 5. User Stories

### Authentication
- As a new user, I can register with email + password so I can start tracking immediately
- As a returning user, I can log in and see my last session's data
- As any user, I receive 3 seeded habits on registration to reduce cold-start friction

### Habits
- As a free user, I can create up to 3 habits with custom icon, color, name
- As a free user, I can mark habits complete each day and see my streak grow
- As a premium user, I can create unlimited habits linked to a specific goal
- As any user, I earn 10 XP per habit completion

### Goals
- As a user, I can set goals with category, description, and target date
- As a user, I can update my goal progress manually (0–100%)
- As a premium user, I can link habits to goals so progress is visible

### AI Coach
- As a premium user, I can chat with an AI coach that knows my actual habit data
- As a premium user, the coach provides personalized, non-generic advice
- As a premium user, I can clear chat history and start fresh

### Analytics
- As a premium user, I can see a 7-day bar chart of completions
- As a premium user, I can see a 30-day trend line
- As a premium user, I can see KPI cards (total habits, completions, best streak, monthly count)

### Monetization
- As a free user, I see ad banners I can dismiss (new ad on next load)
- As a free user attempting premium features, I see a paywall modal with monthly/yearly toggle
- As a user, I can upgrade to premium with one click (Stripe-ready endpoint)

---

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | Page load < 2s on 3G |
| Availability | 99.5% uptime |
| Security | Passwords bcrypt-hashed (cost 10), JWT 30-day expiry |
| Data | User data never sold or used for training |
| Accessibility | WCAG AA contrast ratios on all text |
| Mobile | Responsive at 375px (iPhone SE) minimum |

---

## 7. Out of Scope (v1)

- Native iOS / Android app
- Push notifications
- Social sharing / accountability partners
- Calendar integrations (Google, Outlook)
- Stripe live payments (stubs in place)
- Multi-language support

---

## 8. Success Criteria for Launch

- [ ] Zero P0 bugs (auth failure, data loss, broken paywall)
- [ ] Build passes TypeScript strict mode
- [ ] Server health check returns 200
- [ ] Register → track habit → see streak flow works end-to-end
- [ ] Paywall blocks premium features for free users
- [ ] Ad banners appear on free tier, hidden on premium
