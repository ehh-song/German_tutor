import type { CEFRLevel } from "@/lib/levels";
import type { LanguageCode } from "@/lib/languages";

export type { LanguageCode };

export interface ProgressData {
  language: string;
  currentLevel: CEFRLevel;
  xp: number;
  totalPassages: number;
  streakDays: number;
  levelUpAvailable: boolean;
  xpToNextTest: number | null;
  passagesToNextTest: number | null;
}

export interface PassageWithQuestions {
  id: string;
  level: string;
  language: string;
  text: string;
  topic: string;
  grammarFocus: string;
  wordList: WordItem[];
  questions: QuestionItem[];
  createdAt: string;
}

export interface QuestionItem {
  id: string;
  type: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  orderIndex: number;
}

export interface WordItem {
  word: string;
  translation: string;
  partOfSpeech: string;
}

export interface AttemptResult {
  score: number;
  xpEarned: number;
  correctAnswers: number;
  totalQuestions: number;
  explanations: Record<string, { correct: boolean; explanation: string; correctAnswer: string }>;
  levelUpAvailable: boolean;
  language?: string;
}

export interface VocabWord {
  id: string;
  word: string;
  translation: string;
  explanation: string;
  partOfSpeech: string | null;
  savedAt: string;
  reviewCount: number;
}

export interface LevelUpTestData {
  id: string;
  fromLevel: string;
  toLevel: string;
  language: string;
  questions: QuestionItem[];
}
