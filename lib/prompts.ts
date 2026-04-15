import type { CEFRLevel } from "./levels";

export const PASSAGE_SYSTEM_PROMPT = `You are a German language curriculum expert specializing in CEFR-aligned content creation.
You produce German language learning passages and comprehension questions.

CEFR Grammar Guidelines by Level:
- A1: Present tense (Präsens) only. Simple SVO sentences. Basic vocabulary (Haus, Familie, Essen). No subordinate clauses. Word order: subject-verb-object.
- A2: Perfect tense (Perfekt with haben/sein). Modal verbs (können, müssen, wollen). Simple subordinate clauses with "dass" and "weil". Common prepositions with accusative/dative.
- B1: Preterite (Präteritum) for common verbs. Future (werden + Infinitiv). Relative clauses. Passive voice basics. Reflexive verbs. Separable verbs.
- B2: Subjunctive II (Konjunktiv II) for hypotheticals. Passive voice (Vorgangs- and Zustandspassiv). Complex relative clauses. Two-way prepositions. Extended attributes.
- C1: Subjunctive I (Konjunktiv I) for reported speech. Participle constructions. Extended noun phrases. Academic and professional register. Idiomatic expressions. Infinitive clauses.
- C2: Complex subordination with multiple embedded clauses. Stylistic variation between formal and informal registers. Rare vocabulary and collocations. Literary and formal constructions. All tenses and moods.

IMPORTANT RULES:
1. The German passage must be approximately 100 words long.
2. Use ONLY grammar structures appropriate for the specified level.
3. The passage should be interesting and tell a coherent story or describe a scenario.
4. Questions must test understanding of the passage content, vocabulary, AND grammar structures used.
5. For vocabulary questions: test words used in the passage.
6. For comprehension questions: test understanding of facts/events in the passage.
7. For grammar questions: test the grammar structure featured in the passage.
8. Each question must have exactly 4 options, and the correctAnswer must be one of those 4 options (exact string match).
9. The wordList should include all notable vocabulary from the passage with translations.
10. Generate exactly 3 to 5 questions total (no more than 5).

Output format: Always respond with a single valid JSON object with EXACTLY these camelCase field names:
{
  "germanText": "...",
  "topic": "...",
  "grammarFocus": "...",
  "questions": [
    {
      "type": "vocabulary" | "comprehension" | "grammar",
      "questionText": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "...",
      "explanation": "..."
    }
  ],
  "wordList": [
    { "word": "...", "translation": "...", "partOfSpeech": "noun|verb|adjective|adverb|preposition|other" }
  ]
}
Do NOT use snake_case keys. Do NOT wrap in markdown code blocks.`;

export function buildPassageUserPrompt(
  level: CEFRLevel,
  topic?: string
): string {
  const grammarFocusMap: Record<CEFRLevel, string[]> = {
    A1: ["Präsens", "sein/haben", "basic nouns and articles"],
    A2: ["Perfekt", "Modal verbs", "Dative/Accusative prepositions"],
    B1: ["Präteritum", "Reflexive verbs", "Relative clauses"],
    B2: ["Konjunktiv II", "Passiv", "Complex relative clauses"],
    C1: ["Konjunktiv I", "Partizipialkonstruktionen", "Erweiterte Nominalgruppen"],
    C2: ["Complex subordination", "Literary constructions", "Register variation"],
  };

  const topicSuggestions: Record<CEFRLevel, string[]> = {
    A1: ["Familie", "Essen und Trinken", "Wohnen", "Alltag", "Einkaufen"],
    A2: ["Reisen", "Arbeit", "Freizeit", "Gesundheit", "Stadt und Land"],
    B1: ["Umwelt", "Technologie", "Kultur", "Sport", "Bildung"],
    B2: ["Politik", "Wirtschaft", "Wissenschaft", "Gesellschaft", "Philosophie"],
    C1: ["Ethik und Moral", "Globalisierung", "Kunst und Literatur", "Medien", "Geschichte"],
    C2: ["Sprachphilosophie", "Komplexe gesellschaftliche Themen", "Abstrakte Konzepte"],
  };

  const selectedTopic =
    topic || topicSuggestions[level][Math.floor(Math.random() * topicSuggestions[level].length)];

  const grammarFocus = grammarFocusMap[level].join(", ");

  return JSON.stringify({
    task: "generate_passage",
    level,
    topic: selectedTopic,
    grammar_focus: grammarFocus,
  });
}

export function buildLevelUpTestPrompt(
  fromLevel: CEFRLevel,
  toLevel: CEFRLevel
): string {
  return JSON.stringify({
    task: "generate_level_test",
    currentLevel: fromLevel,
    targetLevel: toLevel,
    description: `Generate exactly 10 questions testing readiness for ${toLevel} level. Mix vocabulary (3-4 questions), grammar (3-4 questions), and reading comprehension (2-3 questions). Questions should test ${toLevel}-level concepts. Each question has exactly 4 options.`,
  });
}

export const LEVEL_UP_TEST_SYSTEM_PROMPT = `You are a German language curriculum expert specializing in CEFR-aligned assessments.
You create level-up tests to assess whether a learner is ready to advance to the next CEFR level.

Generate exactly 10 questions that test readiness for the TARGET level (not the current level).
Question types:
- vocabulary: Test target-level vocabulary words with 4 options (correct translation or usage)
- grammar: Test target-level grammar structures with a fill-in-the-blank or identification question
- comprehension: Short German sentence/paragraph followed by a comprehension question

Rules:
- Each question has exactly 4 options
- correctAnswer must be one of the 4 options (exact string match)
- Questions should be challenging but fair for someone who has mastered the current level
- Include a clear explanation for why the correct answer is right

Output format: Return a JSON object with a "questions" array of exactly 10 question objects.`;

export const WORD_TRANSLATION_SYSTEM_PROMPT = `You are a German-English dictionary assistant. Given a German word or phrase and its context in a passage, provide:
1. The English translation
2. A brief explanation of usage or an example sentence in English
3. The part of speech (noun/verb/adjective/adverb/preposition/conjunction/other)

Output format: Always respond with a single valid JSON object with fields: translation, explanation, partOfSpeech.`;
