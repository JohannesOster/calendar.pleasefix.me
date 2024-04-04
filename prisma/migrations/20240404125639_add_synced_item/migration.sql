-- CreateTable
CREATE TABLE "SyncedItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "syncRuleId" TEXT NOT NULL,
    "sourceEventId" TEXT NOT NULL,
    "targetEventId" TEXT NOT NULL,
    "history" TEXT NOT NULL,
    CONSTRAINT "SyncedItem_syncRuleId_fkey" FOREIGN KEY ("syncRuleId") REFERENCES "SyncRule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
