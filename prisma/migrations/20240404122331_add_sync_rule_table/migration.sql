-- CreateTable
CREATE TABLE "SyncChannel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "nextSyncToken" TEXT,
    "resourceId" TEXT,
    "expiration" DATETIME,
    CONSTRAINT "SyncChannel_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SyncRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceAccountId" TEXT NOT NULL,
    "sourceCalendarId" TEXT NOT NULL,
    "targetAccountId" TEXT NOT NULL,
    "targetCalendarId" TEXT NOT NULL,
    CONSTRAINT "SyncRule_sourceAccountId_fkey" FOREIGN KEY ("sourceAccountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SyncRule_targetAccountId_fkey" FOREIGN KEY ("targetAccountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
