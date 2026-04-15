@AGENTS.md

# Project: Deutsch Meister — German Learning App

## Stack
- Next.js 16 (App Router, TypeScript), Tailwind CSS
- Prisma 7 + SQLite (better-sqlite3 driver adapter)
- NextAuth v5 (credentials, JWT)
- Anthropic SDK: Opus 4.6 (passages + level-up tests), Haiku 4.5 (word translation)

## Key files
- `lib/anthropic.ts` — AI calls (streaming, prompt caching via beta.messages)
- `lib/prompts.ts` — CEFR system prompt + user prompt builders
- `lib/schemas.ts` — Zod schemas for Claude output validation
- `lib/levels.ts` — LEVEL_CONFIG, XP thresholds, nextLevel()
- `lib/xp.ts` — calculatePassageXP(), calculateScore()
- `lib/prisma.ts` — Prisma singleton with PrismaBetterSqlite3 adapter
- `lib/auth.ts` — NextAuth config
- `hooks/usePassageStream.ts` — SSE EventSource hook
- `types/index.ts` — shared TS interfaces

## DB models
User, UserProgress, Passage, Question, PassageAttempt, VocabularyWord, LevelUpTest
- Prisma generated at `app/generated/prisma/client` (gitignored)
- Migration: `prisma/migrations/20260414142436_init`

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

## Env vars needed (.env.local)
ANTHROPIC_API_KEY, NEXTAUTH_SECRET, NEXTAUTH_URL, DATABASE_URL="file:./dev.db"

## Known issues / TODO
- Local PC에서 `npx prisma migrate dev` 시 DATABASE_URL 에러 발생
  → `prisma.config.ts`가 dotenv로 `.env`를 읽는데 `.env.local`은 Next.js만 인식
  → 해결: `.env.local` 대신 `.env`에 DATABASE_URL 넣거나,
           `DATABASE_URL="file:./dev.db" npx prisma migrate dev` 로 실행
- `next-env.d.ts` gitignored → 클론 후 `npm run dev` 한 번 실행하면 자동 생성
- `app/generated/prisma/` gitignored → 클론 후 `npx prisma generate` 필요

## Setup on fresh clone
```
npm install
npx prisma generate
DATABASE_URL="file:./dev.db" npx prisma migrate dev
npm run dev
```
