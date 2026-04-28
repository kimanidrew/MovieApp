-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "category" TEXT,
ADD COLUMN     "introEnd" INTEGER DEFAULT 0,
ADD COLUMN     "introStart" INTEGER DEFAULT 0,
ADD COLUMN     "isMovie" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "WatchHistory" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "lastTime" INTEGER NOT NULL DEFAULT 0,
    "isFinished" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WatchHistory_profileId_videoId_key" ON "WatchHistory"("profileId", "videoId");

-- AddForeignKey
ALTER TABLE "WatchHistory" ADD CONSTRAINT "WatchHistory_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchHistory" ADD CONSTRAINT "WatchHistory_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
