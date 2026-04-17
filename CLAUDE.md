@AGENTS.md

# Project: LinguaMaster — Multi-Language Learning App

## Stack
- Next.js 16 (App Router, TypeScript), Tailwind CSS
- Prisma 7 + **PostgreSQL** (Neon in production, local postgres or Neon URL locally)
- NextAuth v5 (credentials, JWT)
- Anthropic SDK: claude-opus-4-6 (passages/level tests), claude-haiku-4-5-20251001 (translation)
- Google Generative AI SDK: Gemini 2.0 Flash (fallback when Claude rate-limits)

## Key files
- `lib/ai.ts` — Claude-primary + Gemini-fallback AI calls
- `lib/prompts.ts` — CEFR system prompt + user prompt builders
- `lib/schemas.ts` — Zod schemas for AI output validation
- `lib/levels.ts` — LEVEL_CONFIG, XP thresholds, nextLevel()
- `lib/xp.ts` — calculatePassageXP(), calculateScore()
- `lib/prisma.ts` — Prisma singleton (standard PrismaClient, no adapter)
- `lib/auth.ts` — NextAuth config; includes role + isActive check
- `lib/languages.ts` — SUPPORTED_LANGUAGES (de/fr/es/it/ja/zh/ko)
- `hooks/usePassageStream.ts` — SSE EventSource hook
- `types/index.ts` — shared TS interfaces

## DB models
User (role, isActive, approvedAt, lastLoginAt), UserProgress, Passage, Question, PassageAttempt, VocabularyWord, LevelUpTest
- Prisma generated at `app/generated/prisma/client` (gitignored)

## User roles
- `USER` (default) — new accounts start as `isActive: false`, require admin approval
- `ADMIN` — can access /admin panel; can approve/deactivate/delete users; make other users admin
- First admin must be set manually in the DB: `UPDATE "User" SET role='ADMIN', "isActive"=true WHERE email='your@email.com'`

## XP system
- Passage: 100%→50xp, 80-99%→35, 60-79%→20, <60%→10, vocab save→2
- Level-up test pass→+200 bonus
- Thresholds: A1(200xp+5p), A2(500+12), B1(1000+25), B2(2000+50), C1(3500+80)
- Test: 10q, need ≥70% to advance

## API routes
POST /api/auth/register
GET  /api/progress
POST /api/passages/generate  ← SSE streaming
GET  /api/passages/[id]
POST /api/passages/[id]/attempt
GET/POST /api/vocabulary, DELETE /api/vocabulary/[id]
GET  /api/levelup/status, POST /api/levelup/generate, GET/POST /api/levelup/[id]
GET  /api/admin/users  ← admin only
PATCH/DELETE /api/admin/users/[id]  ← admin only

## Env vars needed (.env)
ANTHROPIC_API_KEY, GOOGLE_AI_API_KEY, NEXTAUTH_SECRET, NEXTAUTH_URL, DATABASE_URL

## Deployment (Vercel + Neon)
1. Create Neon project → copy connection string as DATABASE_URL
2. Push code to GitHub
3. Import repo in Vercel, set all env vars (use NEXTAUTH_URL=https://your-app.vercel.app)
4. Vercel runs `npm run build` which auto-generates Prisma client
5. Run migrations: `DATABASE_URL="neon://..." npx prisma migrate deploy`

## Setup on fresh clone
```
npm install
npx prisma generate
npx prisma migrate deploy   # or migrate dev for local with a postgres DB
npm run dev
```

## Notes
- `next-env.d.ts` gitignored → auto-generated on first `npm run dev`
- `app/generated/prisma/` gitignored → run `npx prisma generate` after clone
- better-sqlite3 and its adapter have been removed; DB is now PostgreSQL only
