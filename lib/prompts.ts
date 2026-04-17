import type { CEFRLevel } from "./levels";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "./languages";

// ─── German-specific grammar guidelines (detailed) ──────────────────────────

const GERMAN_GRAMMAR_GUIDELINES = `CEFR Grammar Guidelines by Level:
- A1: Present tense (Präsens) only. Simple SVO sentences. Basic vocabulary (Haus, Familie, Essen). No subordinate clauses. Word order: subject-verb-object.
- A2: Perfect tense (Perfekt with haben/sein). Modal verbs (können, müssen, wollen). Simple subordinate clauses with "dass" and "weil". Common prepositions with accusative/dative.
- B1: Preterite (Präteritum) for common verbs. Future (werden + Infinitiv). Relative clauses. Passive voice basics. Reflexive verbs. Separable verbs.
- B2: Subjunctive II (Konjunktiv II) for hypotheticals. Passive voice (Vorgangs- and Zustandspassiv). Complex relative clauses. Two-way prepositions. Extended attributes.
- C1: Subjunctive I (Konjunktiv I) for reported speech. Participle constructions. Extended noun phrases. Academic and professional register. Idiomatic expressions. Infinitive clauses.
- C2: Complex subordination with multiple embedded clauses. Stylistic variation between formal and informal registers. Rare vocabulary and collocations. Literary and formal constructions. All tenses and moods.`;

// ─── Generic CEFR guidelines for other languages ───────────────────────────

const GENERIC_CEFR_GUIDELINES = `CEFR Grammar Guidelines by Level:
- A1: Present tense only. Simple declarative sentences. Basic everyday vocabulary. No subordinate clauses.
- A2: Past tense basics. Common modal verbs. Simple subordinate clauses. Frequent prepositions.
- B1: Multiple tenses (past, future). Relative clauses. Passive voice basics. Reflexive verbs where applicable.
- B2: Subjunctive/conditional mood for hypotheticals. Complex passive constructions. Extended attributes and modifiers.
- C1: Reported speech structures. Participle constructions. Extended noun phrases. Academic and professional register. Idiomatic expressions.
- C2: Complex subordination with multiple embedded clauses. Stylistic variation across registers. Rare vocabulary and collocations. Literary constructions.`;

function getGrammarGuidelines(language: LanguageCode): string {
  if (language === "de") return GERMAN_GRAMMAR_GUIDELINES;
  return GENERIC_CEFR_GUIDELINES;
}

// ─── System prompt builders ─────────────────────────────────────────────────

export function getPassageSystemPrompt(language: LanguageCode): string {
  const lang = SUPPORTED_LANGUAGES[language];
  return `You are a ${lang.name} language curriculum expert specializing in CEFR-aligned content creation.
You produce ${lang.name} language learning passages and comprehension questions.

${getGrammarGuidelines(language)}

IMPORTANT RULES:
1. The ${lang.name} passage must be approximately 100 words long.
2. Use ONLY grammar structures appropriate for the specified level AND difficulty.
3. The passage should be interesting and tell a coherent story or describe a scenario.
4. Questions must test understanding of the passage content, vocabulary, AND grammar structures used.
5. For vocabulary questions: test words used in the passage.
6. For comprehension questions: test understanding of facts/events in the passage.
7. For grammar questions: test the grammar structure featured in the passage.
8. Each question must have exactly 4 options, and the correctAnswer must be one of those 4 options (exact string match).
9. The wordList should include all notable vocabulary from the passage with English translations.
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
}

export function getLevelUpTestSystemPrompt(language: LanguageCode): string {
  const lang = SUPPORTED_LANGUAGES[language];
  return `You are a ${lang.name} language curriculum expert specializing in CEFR-aligned assessments.
You create level-up tests to assess whether a learner is ready to advance to the next CEFR level.

Generate exactly 10 questions that test readiness for the TARGET level (not the current level).
Question types:
- vocabulary: Test target-level vocabulary words with 4 options (correct translation or usage)
- grammar: Test target-level grammar structures with a fill-in-the-blank or identification question
- comprehension: Short ${lang.name} sentence/paragraph followed by a comprehension question

Rules:
- Each question has exactly 4 options
- correctAnswer must be one of the 4 options (exact string match)
- Questions should be challenging but fair for someone who has mastered the current level
- Include a clear explanation for why the correct answer is right

Output format: Return a JSON object with a "questions" array of exactly 10 question objects.`;
}

export function getWordTranslationSystemPrompt(language: LanguageCode): string {
  const lang = SUPPORTED_LANGUAGES[language];
  return `You are a ${lang.name}-English dictionary assistant. Given a ${lang.name} word or phrase and its context in a passage, provide:
1. The English translation
2. A brief explanation of usage or an example sentence in English
3. The part of speech (noun/verb/adjective/adverb/preposition/conjunction/other)

Output format: Always respond with a single valid JSON object with fields: translation, explanation, partOfSpeech.`;
}

// ─── Legacy exports for backward compatibility ───────────────────────────────
// These still resolve to German, matching the original behavior.
export const PASSAGE_SYSTEM_PROMPT = getPassageSystemPrompt("de");
export const LEVEL_UP_TEST_SYSTEM_PROMPT = getLevelUpTestSystemPrompt("de");
export const WORD_TRANSLATION_SYSTEM_PROMPT = getWordTranslationSystemPrompt("de");

// ─── Topic pools ─────────────────────────────────────────────────────────────

// German topic pools (original, detailed)
const GERMAN_TOPIC_POOLS: Record<CEFRLevel, string[][]> = {
  A1: [
    ["Familie", "Begrüßung", "Zahlen", "Farben", "Wochentage"],
    ["Essen und Trinken", "Wohnen", "Kleidung", "Tiere", "Schule"],
    ["Alltag", "Einkaufen", "Hobbys", "Das Wetter", "Mein Zimmer"],
  ],
  A2: [
    ["Reisen", "Stadtbeschreibung", "Im Restaurant", "Berufe", "Familie und Freunde"],
    ["Freizeit", "Gesundheit", "Einkaufen in der Stadt", "Jahreszeiten", "Sport"],
    ["Arbeit und Schule", "Öffentliche Verkehrsmittel", "Feste und Feiertage", "Urlaubspläne", "Haushalt"],
  ],
  B1: [
    ["Umwelt und Natur", "Technologie im Alltag", "Bildung", "Reiseerlebnisse", "Sport und Fitness"],
    ["Kultur und Traditionen", "Medien und Kommunikation", "Stadtleben vs. Landleben", "Gesundheit und Ernährung", "Arbeitswelt"],
    ["Globalisierung", "Jugendkultur", "Nachhaltigkeit", "Geschichte Deutschlands", "Soziale Netzwerke"],
  ],
  B2: [
    ["Politik und Gesellschaft", "Wirtschaft und Finanzen", "Wissenschaft und Technik", "Kulturelle Unterschiede", "Umweltprobleme"],
    ["Medien und Journalismus", "Bildungssystem", "Migration und Integration", "Philosophische Fragen", "Zukunft der Arbeit"],
    ["Literatur und Kunst", "Ethik und Moral", "Internationale Politik", "Wirtschaftskrise", "Digitale Transformation"],
  ],
  C1: [
    ["Ethik und Moral", "Globalisierung", "Kunst und Literatur", "Medien und Manipulation", "Geschichte und Erinnerung"],
    ["Sprachpolitik", "Gesellschaftlicher Wandel", "Philosophie des Geistes", "Wissenschaftsethik", "Demokratie und Freiheit"],
    ["Postmoderne Literatur", "Interkulturelle Kommunikation", "Technologiefolgen", "Komplexe Wirtschaftsfragen", "Identität und Zugehörigkeit"],
  ],
  C2: [
    ["Sprachphilosophie", "Abstrakte gesellschaftliche Konzepte", "Literarische Analyse", "Komplexe Kausalitäten", "Erkenntnistheorie"],
    ["Politische Theorie", "Ästhetik", "Wissenschaftsphilosophie", "Diskursanalyse", "Kulturkritik"],
    ["Hermeneutik", "Tiefgründige ethische Dilemmata", "Poststrukturalismus", "Komparative Kulturwissenschaft", "Komplexe historische Interpretationen"],
  ],
};

// Generic topic pools for all other languages (CEFR-standard themes)
const GENERIC_TOPIC_POOLS: Record<CEFRLevel, string[][]> = {
  A1: [
    ["Family", "Greetings", "Numbers", "Colors", "Days of the week"],
    ["Food and drink", "Home", "Clothing", "Animals", "School"],
    ["Daily routine", "Shopping", "Hobbies", "Weather", "My room"],
  ],
  A2: [
    ["Travel", "City descriptions", "At the restaurant", "Jobs", "Family and friends"],
    ["Leisure time", "Health", "Shopping in town", "Seasons", "Sports"],
    ["Work and school", "Public transport", "Holidays and festivals", "Vacation plans", "Household"],
  ],
  B1: [
    ["Environment and nature", "Everyday technology", "Education", "Travel experiences", "Sports and fitness"],
    ["Culture and traditions", "Media and communication", "City vs. countryside", "Health and nutrition", "The working world"],
    ["Globalization", "Youth culture", "Sustainability", "History", "Social networks"],
  ],
  B2: [
    ["Politics and society", "Economy and finance", "Science and technology", "Cultural differences", "Environmental issues"],
    ["Media and journalism", "The education system", "Migration and integration", "Philosophical questions", "The future of work"],
    ["Literature and art", "Ethics and morality", "International politics", "Economic crises", "Digital transformation"],
  ],
  C1: [
    ["Ethics and morality", "Globalization", "Art and literature", "Media and manipulation", "History and memory"],
    ["Language policy", "Social change", "Philosophy of mind", "Ethics of science", "Democracy and freedom"],
    ["Postmodern literature", "Intercultural communication", "Consequences of technology", "Complex economic issues", "Identity and belonging"],
  ],
  C2: [
    ["Philosophy of language", "Abstract social concepts", "Literary analysis", "Complex causality", "Epistemology"],
    ["Political theory", "Aesthetics", "Philosophy of science", "Discourse analysis", "Cultural criticism"],
    ["Hermeneutics", "Deep ethical dilemmas", "Post-structuralism", "Comparative cultural studies", "Complex historical interpretations"],
  ],
};

function getTopicPools(language: LanguageCode): Record<CEFRLevel, string[][]> {
  if (language === "de") return GERMAN_TOPIC_POOLS;
  return GENERIC_TOPIC_POOLS;
}

// ─── Grammar focus maps ───────────────────────────────────────────────────────

const GERMAN_GRAMMAR_FOCUS: Record<CEFRLevel, string[][]> = {
  A1: [
    ["Präsens", "sein/haben", "basic nouns and articles"],
    ["Präsens", "Nominativ/Akkusativ", "basic adjectives"],
    ["Präsens", "Possessivartikel", "Verneinung mit nicht/kein"],
  ],
  A2: [
    ["Perfekt with haben", "basic modal verbs", "simple prepositions"],
    ["Perfekt with sein", "Modal verbs (können, müssen, wollen)", "Dative prepositions"],
    ["Perfekt", "dass/weil subordinate clauses", "Akkusativ/Dativ prepositions"],
  ],
  B1: [
    ["Präteritum (common verbs)", "basic relative clauses", "separable verbs"],
    ["Präteritum", "Reflexive verbs", "Relative clauses"],
    ["Futur I", "Passiv (basic)", "complex relative clauses"],
  ],
  B2: [
    ["Konjunktiv II (basics)", "Passiv", "two-way prepositions"],
    ["Konjunktiv II", "Vorgangs- und Zustandspassiv", "extended attributes"],
    ["Konjunktiv II (complex)", "complex Passiv constructions", "Infinitivkonstruktionen"],
  ],
  C1: [
    ["Konjunktiv I (reported speech)", "basic Partizipialkonstruktionen", "academic register"],
    ["Konjunktiv I", "Partizipialkonstruktionen", "Erweiterte Nominalgruppen"],
    ["Konjunktiv I + II combined", "complex Partizipialkonstruktionen", "idiomatic expressions"],
  ],
  C2: [
    ["Complex subordination", "literary constructions", "formal register"],
    ["Complex subordination", "stylistic variation", "rare collocations"],
    ["All tenses and moods combined", "literary and rhetorical devices", "register variation"],
  ],
};

const GENERIC_GRAMMAR_FOCUS: Record<CEFRLevel, string[][]> = {
  A1: [
    ["present tense", "basic nouns and articles", "simple sentences"],
    ["present tense", "nominative/accusative", "basic adjectives"],
    ["present tense", "possessives", "negation"],
  ],
  A2: [
    ["past tense basics", "modal verbs", "simple prepositions"],
    ["past tense", "modal verbs (can, must, want)", "object case prepositions"],
    ["past tense", "subordinate clauses", "common prepositions"],
  ],
  B1: [
    ["narrative past tense", "basic relative clauses", "reflexive verbs"],
    ["past tense", "reflexive verbs", "relative clauses"],
    ["future tense", "passive voice (basic)", "complex relative clauses"],
  ],
  B2: [
    ["conditional mood (basics)", "passive voice", "complex prepositions"],
    ["conditional mood", "complex passive constructions", "extended modifiers"],
    ["conditional mood (complex)", "advanced passive", "infinitive constructions"],
  ],
  C1: [
    ["reported speech structures", "participial constructions", "academic register"],
    ["reported speech", "participial constructions", "extended noun phrases"],
    ["combined conditional/reported speech", "complex participials", "idiomatic expressions"],
  ],
  C2: [
    ["complex subordination", "literary constructions", "formal register"],
    ["complex subordination", "stylistic variation", "rare collocations"],
    ["all tenses and moods combined", "literary and rhetorical devices", "register variation"],
  ],
};

function getGrammarFocusMap(language: LanguageCode): Record<CEFRLevel, string[][]> {
  if (language === "de") return GERMAN_GRAMMAR_FOCUS;
  return GENERIC_GRAMMAR_FOCUS;
}

// ─── Difficulty helpers ───────────────────────────────────────────────────────

const DIFFICULTY_HINTS: Record<string, string> = {
  easy: "Use the simplest vocabulary and sentence structures appropriate for this level. Prefer very short sentences.",
  medium: "Use standard vocabulary and sentence structures for this level. Mix simple and slightly complex sentences.",
  hard: "Push toward the upper boundary of this level. Use more complex vocabulary and sentence structures. Sentences may be longer and more varied.",
};

function getDifficultyTier(xpProgress: number): "easy" | "medium" | "hard" {
  if (xpProgress < 0.33) return "easy";
  if (xpProgress < 0.67) return "medium";
  return "hard";
}

function getTopicTier(xpProgress: number): number {
  if (xpProgress < 0.33) return 0;
  if (xpProgress < 0.67) return 1;
  return 2;
}

// ─── User prompt builders ─────────────────────────────────────────────────────

export function buildPassageUserPrompt(
  level: CEFRLevel,
  xpProgress: number,
  topic?: string,
  language: LanguageCode = "de"
): string {
  const tier = getTopicTier(xpProgress);
  const difficulty = getDifficultyTier(xpProgress);
  const topicPools = getTopicPools(language);
  const grammarFocusMap = getGrammarFocusMap(language);
  const topics = topicPools[level][tier];
  const selectedTopic = topic || topics[Math.floor(Math.random() * topics.length)];
  const grammarFocus = grammarFocusMap[level][tier].join(", ");
  const difficultyHint = DIFFICULTY_HINTS[difficulty];

  return JSON.stringify({
    task: "generate_passage",
    level,
    difficulty,
    difficulty_instruction: difficultyHint,
    topic: selectedTopic,
    grammar_focus: grammarFocus,
  });
}

export function buildLevelUpTestPrompt(
  fromLevel: CEFRLevel,
  toLevel: CEFRLevel,
  language: LanguageCode = "de"
): string {
  const lang = SUPPORTED_LANGUAGES[language];
  return JSON.stringify({
    task: "generate_level_test",
    currentLevel: fromLevel,
    targetLevel: toLevel,
    description: `Generate exactly 10 questions testing readiness for ${toLevel} level ${lang.name}. Mix vocabulary (3-4 questions), grammar (3-4 questions), and reading comprehension (2-3 questions). Questions should test ${toLevel}-level concepts. Each question has exactly 4 options.`,
  });
}
