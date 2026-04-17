-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LevelUpTest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'de',
    "fromLevel" TEXT NOT NULL,
    "toLevel" TEXT NOT NULL,
    "questions" TEXT NOT NULL,
    "score" INTEGER,
    "passed" BOOLEAN,
    "takenAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LevelUpTest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LevelUpTest" ("createdAt", "fromLevel", "id", "passed", "questions", "score", "takenAt", "toLevel", "userId") SELECT "createdAt", "fromLevel", "id", "passed", "questions", "score", "takenAt", "toLevel", "userId" FROM "LevelUpTest";
DROP TABLE "LevelUpTest";
ALTER TABLE "new_LevelUpTest" RENAME TO "LevelUpTest";
CREATE TABLE "new_Passage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'de',
    "level" TEXT NOT NULL,
    "germanText" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "grammarFocus" TEXT NOT NULL,
    "wordListJson" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Passage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Passage" ("createdAt", "germanText", "grammarFocus", "id", "level", "status", "topic", "userId", "wordListJson") SELECT "createdAt", "germanText", "grammarFocus", "id", "level", "status", "topic", "userId", "wordListJson" FROM "Passage";
DROP TABLE "Passage";
ALTER TABLE "new_Passage" RENAME TO "Passage";
CREATE TABLE "new_UserProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'de',
    "currentLevel" TEXT NOT NULL DEFAULT 'A1',
    "xp" INTEGER NOT NULL DEFAULT 0,
    "totalPassages" INTEGER NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserProgress" ("createdAt", "currentLevel", "id", "lastActivityAt", "streakDays", "totalPassages", "updatedAt", "userId", "xp") SELECT "createdAt", "currentLevel", "id", "lastActivityAt", "streakDays", "totalPassages", "updatedAt", "userId", "xp" FROM "UserProgress";
DROP TABLE "UserProgress";
ALTER TABLE "new_UserProgress" RENAME TO "UserProgress";
CREATE UNIQUE INDEX "UserProgress_userId_language_key" ON "UserProgress"("userId", "language");
CREATE TABLE "new_VocabularyWord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'de',
    "passageId" TEXT NOT NULL,
    "germanWord" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "partOfSpeech" TEXT,
    "savedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "lastReviewAt" DATETIME,
    CONSTRAINT "VocabularyWord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VocabularyWord_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "Passage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VocabularyWord" ("explanation", "germanWord", "id", "lastReviewAt", "partOfSpeech", "passageId", "reviewCount", "savedAt", "translation", "userId") SELECT "explanation", "germanWord", "id", "lastReviewAt", "partOfSpeech", "passageId", "reviewCount", "savedAt", "translation", "userId" FROM "VocabularyWord";
DROP TABLE "VocabularyWord";
ALTER TABLE "new_VocabularyWord" RENAME TO "VocabularyWord";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
