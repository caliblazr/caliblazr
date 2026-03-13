# AI Rules — LifeSync AI

**Version:** 1.0.0 | **Date:** March 2026
**Applies to:** All AI agents and Claude Code sessions working on this codebase

---

## 1. Purpose

This document defines the rules, constraints, and coding standards that all AI agents (including Claude Code) must follow when making changes to LifeSync AI. These rules exist to ensure consistency, security, and quality across all contributions — human and AI alike.

---

## 2. Non-Negotiable Rules

### 2.1 Never Break These

| Rule | Reason |
|------|--------|
| Never remove the paywall gate on premium routes | Core revenue protection |
| Never store plaintext passwords | Security — bcrypt always |
| Never use `dangerouslySetInnerHTML` | XSS prevention |
| Never commit `.env` files | Credential security |
| Never use `any` TypeScript type without a comment explaining why | Type safety |
| Never call the Claude API without checking `isPremium` first | Billing protection |
| Never delete user data without `user_id` scoping | Data isolation |
| Never skip parameterized queries in SQL | SQL injection prevention |

### 2.2 Never Remove Without Explicit Instruction
- The `AdBanner` component on the Dashboard and Goals pages (free tier monetization)
- The `PaywallModal` trigger in all premium feature paths
- JWT verification in the `authenticate` middleware
- The habit/goal count limit check on `POST /api/habits` and `POST /api/goals`

---

## 3. Code Style Rules

### 3.1 TypeScript
- All types must be in `client/src/types/index.ts` — do not create local type files
- Use `import type` for type-only imports (`import type { User } from '../types'`)
- Prefer explicit return types on all exported functions
- No `any` unless absolutely necessary with a `// REASON:` comment
- Use `unknown` + type narrowing instead of `any` for error handling

```typescript
// CORRECT
} catch (err: unknown) {
  const e = err as { response?: { data?: { error?: string } } };
  setError(e.response?.data?.error || 'Something went wrong');
}

// WRONG
} catch (err: any) {
  setError(err.response.data.error);
}
```

### 3.2 React Components
- Functional components only — no class components
- All async operations in `useCallback` or `useEffect` must handle cleanup or cancellation
- Loading states must always be represented — never show empty UI without a shimmer/spinner
- Error states must always surface a user-readable message — never swallow errors silently
- `key` props must use stable IDs (e.g., `habit.id`), never array index
- No inline `onClick` logic longer than one line — extract to a named handler

```tsx
// CORRECT
const handleDelete = async (id: string) => {
  await api.delete(`/habits/${id}`);
  fetchHabits();
};

// WRONG
onClick={() => { api.delete(`/habits/${habit.id}`).then(() => fetchHabits()); }}
```

### 3.3 Styling
- Use Tailwind utility classes as the primary styling method
- Use `style={{}}` only for dynamic values (colors, widths from data)
- No external CSS files beyond `index.css`
- Color palette must stay within the brand gradient:
  - Primary: `#6366f1` (indigo-500)
  - Secondary: `#8b5cf6` (violet-500), `#c084fc` (purple-400), `#f472b6` (pink-400)
  - Background: `#0f0f1a` (dark navy)
  - Glass: `rgba(255,255,255,0.05)` with `backdrop-blur-12px`
- All interactive elements must have `transition-all` and `active:scale-95` for tactile feel
- All modals must have a backdrop click-to-close

### 3.4 Backend
- All routes must be in `server/src/routes/` — one file per resource
- All database queries must be parameterized (no string interpolation in SQL)
- All routes requiring auth must call `authenticate` middleware — never skip it
- All premium-gated routes must check `req.isPremium` — never trust client-sent data
- Responses must always be JSON — never plain text errors
- HTTP status codes must be semantically correct:
  - `200` — success
  - `201` — resource created
  - `400` — bad request (missing fields)
  - `401` — unauthenticated
  - `403` — authenticated but not authorized (also: free tier limit hit with `code: "UPGRADE_REQUIRED"`)
  - `404` — not found
  - `409` — conflict (e.g., duplicate email)

---

## 4. AI Coach Rules

### 4.1 Claude API Usage
- Model: `claude-opus-4-6` — do not downgrade without explicit approval
- `max_tokens`: 500 — keep responses concise; this is a coach, not an essay writer
- Always inject real user context (habits, goals, completion data) into the system prompt
- Always check `isPremium` before calling the API — 403 if free
- Always fall back to demo responses when `ANTHROPIC_API_KEY` is absent — never crash

### 4.2 System Prompt Rules
The system prompt must always include:
1. User name, level, XP
2. All active habits with streak and total completion count
3. All goals with category, progress, status
4. Today's completion count vs total habits
5. The coach's personality: warm, honest, specific, concise

The system prompt must never include:
- Other users' data
- Raw database IDs (use human-readable names)
- Instructions that could make the coach give medical, legal, or financial advice

### 4.3 Response Constraints
The AI Coach must:
- Reference the user's actual habits by name
- Keep responses to 2–4 paragraphs
- Be encouraging but honest (don't inflate progress)
- Offer at least one specific, actionable next step per response
- Use the occasional emoji to feel warm, not clinical

---

## 5. Feature Gate Rules

### 5.1 Free Tier Limits
The following limits are enforced **server-side** and must never be removed:

| Feature | Free Limit | Premium |
|---------|-----------|---------|
| Habits | 3 max | Unlimited |
| Goals | 3 max | Unlimited |
| AI Coach | Blocked | Full access |
| Analytics | Blocked | Full access |
| Ads | Always shown | Never shown |

### 5.2 Paywall Trigger Protocol
When a free user hits a premium gate:
1. Server returns `HTTP 403` with body `{ error: "...", code: "UPGRADE_REQUIRED", message: "Human-readable reason" }`
2. Client catches the error and opens `<PaywallModal>` with the `message` as the `trigger` prop
3. PaywallModal must always show: plan toggle, feature list, CTA, trial note

### 5.3 Ad Placement Rules
- Ads appear only when `user.isPremium === false`
- Ad banners render at the top of Dashboard and Goals pages
- Ads must be dismissible within the session (React state, not localStorage)
- Ad copy must not make false medical claims
- In production, replace mock ad divs with proper AdSense `<ins>` tags

---

## 6. Database Rules

- All tables must have a UUID `id` column as the primary key
- All foreign keys must have `ON DELETE CASCADE` where appropriate
- All user data queries must always filter by `user_id` — never return all rows
- Use `db.prepare().get()` for single-row queries, `.all()` for multi-row
- Use transactions (`db.transaction()`) for multi-step writes (e.g., update streak + award XP)
- Never use raw template literals in SQL — always use `?` placeholders

```typescript
// CORRECT
db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?').get(id, userId);

// WRONG
db.exec(`SELECT * FROM habits WHERE id = '${id}'`);
```

---

## 7. Security Rules

### 7.1 Authentication
- All protected routes use the `authenticate` middleware — no exceptions
- JWT secret must be at least 32 characters
- Tokens expire in 30 days — do not extend without reason
- `isPremium` must be re-read from the JWT payload (set at login/upgrade) — never from client body

### 7.2 Input Validation
- All required fields must be validated before DB writes
- Email must be validated format (TypeScript `email` input type + regex if needed)
- Password minimum 6 characters enforced at both client and server
- All string inputs that go to the DB must be trimmed

### 7.3 CORS
- CORS origin allowlist: `['http://localhost:5173', 'http://localhost:4173']`
- In production, replace with the actual deployed domain
- Never use `origin: '*'` in production

---

## 8. Testing Expectations

When adding new routes or components, ensure:

- [ ] Happy path works (successful operation)
- [ ] Auth guard works (unauthenticated request returns 401)
- [ ] Premium gate works (free user returns 403 with `UPGRADE_REQUIRED`)
- [ ] Validation works (missing required fields return 400)
- [ ] Empty state renders correctly (no data → helpful empty state, not blank)
- [ ] Loading state renders (skeleton/shimmer while fetching)
- [ ] Error state renders (network failure shows user-readable message)

---

## 9. Git & Commit Rules

- Branch names must follow: `claude/<feature-name>-<session-id>` pattern
- Commit messages must use the imperative mood: `add`, `fix`, `update`, `remove`
- Never commit to `main` directly — always use branches
- Never force-push to `main`
- Never commit `.env` files
- Always stage specific files — never `git add -A` blindly without reviewing

---

## 10. When in Doubt

1. Read `PRD.md` to understand what the feature should do
2. Read `Architecture.md` to understand where code belongs
3. Read this file to understand the rules
4. Read `Plan.md` to understand current priorities
5. Make the smallest possible change that solves the problem
6. Never add unrequested features
7. Ask if the requirement is ambiguous
