import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import { XP_VOCAB_SAVE, XP_LEVEL_UP_BONUS } from '@/lib/xp'

// ---------------------------------------------------------------------------
// Mocks — hoisted by Vitest before any imports
// ---------------------------------------------------------------------------

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))

vi.mock('@/lib/anthropic', () => {
  const mockPassageData = {
    germanText: 'Das ist ein Test. Der Mann geht nach Hause.',
    topic: 'Daily Life',
    grammarFocus: 'Präsens',
    questions: [
      {
        type: 'comprehension',
        questionText: 'Was macht der Mann?',
        options: ['Er schläft.', 'Er geht nach Hause.', 'Er isst.', 'Er arbeitet.'],
        correctAnswer: 'Er geht nach Hause.',
        explanation: 'The text says "Der Mann geht nach Hause."',
      },
      {
        type: 'vocabulary',
        questionText: 'Was bedeutet "geht"?',
        options: ['sleeps', 'goes', 'eats', 'works'],
        correctAnswer: 'goes',
        explanation: '"Geht" is the present tense of "gehen" (to go).',
      },
      {
        type: 'grammar',
        questionText: 'Welche Zeitform wird verwendet?',
        options: ['Perfekt', 'Präteritum', 'Präsens', 'Futur'],
        correctAnswer: 'Präsens',
        explanation: 'Present tense (Präsens) is used throughout.',
      },
    ],
    wordList: [
      { word: 'geht', translation: 'goes', partOfSpeech: 'verb' },
      { word: 'nach Hause', translation: 'home (direction)', partOfSpeech: 'phrase' },
    ],
  }

  const mockLevelUpData = {
    questions: Array.from({ length: 10 }, (_, i) => ({
      type: 'comprehension' as const,
      questionText: `Frage ${i + 1}: Wähle die richtige Antwort.`,
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      explanation: 'Option A is correct.',
    })),
  }

  return {
    streamPassageGeneration: vi.fn(async function* () {
      yield { type: 'chunk' as const, text: 'Das ist ein Test. Der Mann geht nach Hause.' }
      yield { type: 'done' as const, data: mockPassageData }
    }),
    generateLevelUpTest: vi.fn().mockResolvedValue(mockLevelUpData),
    translateWord: vi.fn().mockResolvedValue({
      translation: 'to go',
      explanation: 'a movement verb',
      partOfSpeech: 'verb',
    }),
  }
})

// ---------------------------------------------------------------------------
// Route handler imports (pick up mocked modules above)
// ---------------------------------------------------------------------------

import { auth } from '@/lib/auth'
import { POST as registerPOST } from '@/app/api/auth/register/route'
import { GET as progressGET } from '@/app/api/progress/route'
import { POST as generatePOST } from '@/app/api/passages/generate/route'
import { POST as attemptPOST } from '@/app/api/passages/[id]/attempt/route'
import { POST as vocabPOST } from '@/app/api/vocabulary/route'
import { GET as levelupStatusGET } from '@/app/api/levelup/status/route'
import { POST as levelupGeneratePOST } from '@/app/api/levelup/generate/route'
import {
  GET as levelupTestGET,
  POST as levelupTestPOST,
} from '@/app/api/levelup/[id]/route'
import { clearTestDb } from '../helpers/db'
import { createTestUser, seedProgressToThreshold } from '../helpers/fixtures'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function req(url: string, method = 'GET', body?: unknown): Request {
  return new Request(`http://localhost${url}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

/** Reads an SSE stream and returns the payload of the first `done` event. */
async function consumeSSE(res: Response) {
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (line.startsWith('data: ') && !line.includes('[DONE]')) {
        try {
          const payload = JSON.parse(line.slice(6))
          if (payload.type === 'done') return payload
        } catch {}
      }
    }
  }
  return null
}

function mockSession(userId: string, email = 'learner@test.com') {
  vi.mocked(auth).mockResolvedValue({
    user: { id: userId, email },
  } as Awaited<ReturnType<typeof auth>>)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Registration', () => {
  beforeEach(clearTestDb)

  it('creates user and UserProgress on valid registration', async () => {
    const res = await registerPOST(
      req('/api/auth/register', 'POST', {
        email: 'newuser@test.com',
        password: 'password123',
        name: 'New User',
      }),
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.email).toBe('newuser@test.com')
    expect(body.id).toBeTruthy()
  })

  it('returns 409 when email is already registered', async () => {
    const payload = { email: 'dup@test.com', password: 'password123' }
    await registerPOST(req('/api/auth/register', 'POST', payload))
    const res = await registerPOST(req('/api/auth/register', 'POST', payload))
    expect(res.status).toBe(409)
  })

  it('returns 400 when password is shorter than 6 characters', async () => {
    const res = await registerPOST(
      req('/api/auth/register', 'POST', { email: 'x@test.com', password: '12345' }),
    )
    expect(res.status).toBe(400)
  })
})

describe('Authenticated Learning Journey', () => {
  let userId = ''
  let passageId = ''
  let passageQuestions: Array<{ id: string; correctAnswer: string }> = []

  beforeAll(async () => {
    await clearTestDb()
    const user = await createTestUser()
    userId = user.id
    mockSession(userId)
  })

  afterAll(clearTestDb)

  it('GET /api/progress returns A1 level with 0 XP', async () => {
    const res = await progressGET(req('/api/progress?lang=de'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.currentLevel).toBe('A1')
    expect(body.xp).toBe(0)
    expect(body.totalPassages).toBe(0)
    expect(body.levelUpAvailable).toBe(false)
  })

  it('POST /api/passages/generate streams SSE and persists passage to DB', async () => {
    const res = await generatePOST(
      req('/api/passages/generate', 'POST', { topic: 'Daily Life' }),
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')

    const done = await consumeSSE(res)
    expect(done).not.toBeNull()
    expect(done.passageId).toBeTruthy()
    expect(done.questions.length).toBeGreaterThanOrEqual(3)

    passageId = done.passageId
    passageQuestions = done.questions.map((q: { id: string; correctAnswer: string }) => ({
      id: q.id,
      correctAnswer: q.correctAnswer,
    }))
  })

  it('POST /api/passages/[id]/attempt awards 50 XP for 100% score', async () => {
    const answers = Object.fromEntries(
      passageQuestions.map(({ id, correctAnswer }) => [id, correctAnswer]),
    )
    const res = await attemptPOST(
      req(`/api/passages/${passageId}/attempt`, 'POST', { answers }),
      { params: Promise.resolve({ id: passageId }) },
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.score).toBe(100)
    expect(body.xpEarned).toBe(50)
    expect(body.correctAnswers).toBe(passageQuestions.length)
    expect(body.newTotalPassages).toBe(1)
  })

  it('GET /api/progress reflects XP earned from the attempt', async () => {
    const res = await progressGET(req('/api/progress?lang=de'))
    const body = await res.json()
    expect(body.xp).toBe(50)
    expect(body.totalPassages).toBe(1)
  })

  it('POST /api/vocabulary saves word and awards XP', async () => {
    const res = await vocabPOST(
      req('/api/vocabulary', 'POST', {
        germanWord: 'geht',
        passageId,
        translation: 'goes',
        partOfSpeech: 'verb',
      }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.germanWord).toBe('geht')
    expect(body.translation).toBe('goes')
  })

  it('GET /api/progress reflects vocab XP', async () => {
    const res = await progressGET(req('/api/progress?lang=de'))
    const body = await res.json()
    expect(body.xp).toBe(50 + XP_VOCAB_SAVE)
  })

  describe('Level-up flow (A1 → A2)', () => {
    let testId = ''

    beforeAll(async () => {
      // Seed progress to threshold directly rather than grinding passages
      await seedProgressToThreshold(userId)
    })

    it('GET /api/levelup/status shows available after threshold is met', async () => {
      const res = await levelupStatusGET(req('/api/levelup/status?lang=de'))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.available).toBe(true)
      expect(body.currentLevel).toBe('A1')
    })

    it('POST /api/levelup/generate creates a 10-question test', async () => {
      const res = await levelupGeneratePOST(req('/api/levelup/generate', 'POST', { language: 'de' }))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.questions).toHaveLength(10)
      expect(body.fromLevel).toBe('A1')
      expect(body.toLevel).toBe('A2')
      testId = body.id
    })

    it('GET /api/levelup/[id] returns the pending test', async () => {
      const res = await levelupTestGET(
        req(`/api/levelup/${testId}`),
        { params: Promise.resolve({ id: testId }) },
      )
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.id).toBe(testId)
      expect(body.passed).toBeNull()
    })

    it('POST /api/levelup/[id] passes with 7/10 correct answers (70%)', async () => {
      // q0–q6 = 'A' (correct), q7–q9 = 'B' (wrong) → 70% → passes
      const answers = Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [`q${i}`, i < 7 ? 'A' : 'B']),
      )
      const res = await levelupTestPOST(
        req(`/api/levelup/${testId}`, 'POST', { answers }),
        { params: Promise.resolve({ id: testId }) },
      )
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.passed).toBe(true)
      expect(body.score).toBe(70)
      expect(body.newLevel).toBe('A2')
      expect(body.xpBonus).toBe(XP_LEVEL_UP_BONUS)
    })

    it('GET /api/progress shows A2 as the new current level', async () => {
      const res = await progressGET(req('/api/progress?lang=de'))
      const body = await res.json()
      expect(body.currentLevel).toBe('A2')
      expect(body.xp).toBeGreaterThanOrEqual(200 + XP_LEVEL_UP_BONUS)
    })

    it('POST /api/levelup/[id] returns 400 when test is already submitted', async () => {
      const answers = Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [`q${i}`, 'A']),
      )
      const res = await levelupTestPOST(
        req(`/api/levelup/${testId}`, 'POST', { answers }),
        { params: Promise.resolve({ id: testId }) },
      )
      expect(res.status).toBe(400)
    })
  })
})
