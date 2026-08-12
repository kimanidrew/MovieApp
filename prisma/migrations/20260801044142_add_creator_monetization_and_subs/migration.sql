/*
  Warnings:

  - You are about to drop the column `maturityRating` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `firebaseUid` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionTier` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `hlsManifestUrl` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `isMovie` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `releaseYear` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnailUrl` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `videoKey` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `videoUrl` on the `Video` table. All the data in the column will be lost.
  - Added the required column `maxMaturityId` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Video` table without a default value. This is not possible if the table is not empty.
  - Made the column `durationSeconds` on table `Video` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'MODERATOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PROCESSING', 'READY', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'EXPIRED', 'PENDING');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('POSTER', 'BACKDROP', 'BANNER', 'STILL', 'LOGO', 'HERO_ART');

-- CreateEnum
CREATE TYPE "VideoResolution" AS ENUM ('P240', 'P360', 'P480', 'P720', 'P1080', 'UHD_4K', 'UHD_8K');

-- CreateEnum
CREATE TYPE "VideoSourceType" AS ENUM ('HLS', 'DASH', 'MP4');

-- CreateEnum
CREATE TYPE "HDRFormat" AS ENUM ('SDR', 'HDR10', 'DOLBY_VISION', 'HLG');

-- CreateEnum
CREATE TYPE "RatingValue" AS ENUM ('THUMBS_DOWN', 'THUMBS_UP', 'DOUBLE_THUMBS_UP');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('WEB', 'MOBILE_IOS', 'MOBILE_ANDROID', 'SMART_TV', 'APPLE_TV', 'ROKU', 'FIRE_TV', 'PLAYSTATION', 'XBOX');

-- CreateEnum
CREATE TYPE "RowRenderStyle" AS ENUM ('STANDARD_POSTER', 'WIDE_BACKDROP', 'HERO_BILLBOARD', 'TOP_10_NUMERIC', 'CONTINUE_WATCHING');

-- CreateEnum
CREATE TYPE "RowDataSource" AS ENUM ('CURATED_COLLECTION', 'TRENDING', 'POPULAR', 'NEW_RELEASES', 'TOP_10', 'CONTINUE_WATCHING', 'RECOMMENDED');

-- DropIndex
DROP INDEX "User_firebaseUid_key";

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "maturityRating",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "maxMaturityId" TEXT NOT NULL,
ADD COLUMN     "pinLockCode" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "firebaseUid",
DROP COLUMN "subscriptionTier",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isCreator" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Video" DROP COLUMN "category",
DROP COLUMN "description",
DROP COLUMN "hlsManifestUrl",
DROP COLUMN "isMovie",
DROP COLUMN "releaseYear",
DROP COLUMN "thumbnailUrl",
DROP COLUMN "title",
DROP COLUMN "videoKey",
DROP COLUMN "videoUrl",
ADD COLUMN     "creditsEnd" INTEGER,
ADD COLUMN     "creditsStart" INTEGER,
ADD COLUMN     "recapEnd" INTEGER DEFAULT 0,
ADD COLUMN     "recapStart" INTEGER DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "durationSeconds" SET NOT NULL;

-- AlterTable
ALTER TABLE "WatchHistory" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "MaturityRating" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "severityRank" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaturityRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LanguageRegistry" (
    "id" TEXT NOT NULL,
    "iso6391" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nativeName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LanguageRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentBalance" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "channelName" TEXT NOT NULL,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "maxResolution" TEXT NOT NULL DEFAULT '1080p',
    "allowsDownloads" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceUuid" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "deviceType" "DeviceType" NOT NULL DEFAULT 'WEB',
    "ipAddress" TEXT,
    "refreshToken" TEXT NOT NULL,
    "lastActiveAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileSettings" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "interfaceLanguage" TEXT NOT NULL DEFAULT 'en',
    "audioLanguage" TEXT NOT NULL DEFAULT 'en',
    "subtitleLanguage" TEXT NOT NULL DEFAULT 'en',
    "autoplayNext" BOOLEAN NOT NULL DEFAULT true,
    "autoplayPreviews" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "storyline" TEXT,
    "releaseYear" INTEGER,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "maturityRatingId" TEXT NOT NULL,
    "imdbId" TEXT,
    "tmdbId" INTEGER,
    "tvdbId" TEXT,
    "traktId" INTEGER,
    "popularityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "viewCount" BIGINT NOT NULL DEFAULT 0,
    "watchSeconds" BIGINT NOT NULL DEFAULT 0,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movie" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "cutVariant" TEXT NOT NULL DEFAULT 'Theatrical',
    "durationTotal" INTEGER NOT NULL,
    "videoId" TEXT NOT NULL,

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Show" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,

    CONSTRAINT "Show_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "seasonNumber" INTEGER NOT NULL,
    "title" TEXT,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "showId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" TEXT NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "releaseDate" TIMESTAMP(3),
    "seasonId" TEXT NOT NULL,
    "nextEpisodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "videoId" TEXT NOT NULL,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "biography" TEXT,
    "avatarUrl" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Studio" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Studio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionCompany" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "isoAlpha2" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cast" (
    "id" TEXT NOT NULL,
    "character" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "personId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,

    CONSTRAINT "Cast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crew" (
    "id" TEXT NOT NULL,
    "job" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,

    CONSTRAINT "Crew_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageRow" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "renderStyle" "RowRenderStyle" NOT NULL DEFAULT 'STANDARD_POSTER',
    "sourceType" "RowDataSource" NOT NULL DEFAULT 'CURATED_COLLECTION',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "collectionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentCategory" (
    "contentId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ContentCategory_pkey" PRIMARY KEY ("contentId","categoryId")
);

-- CreateTable
CREATE TABLE "CollectionItem" (
    "collectionId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("collectionId","contentId")
);

-- CreateTable
CREATE TABLE "ContentLanguage" (
    "contentId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "isDubbed" BOOLEAN NOT NULL DEFAULT false,
    "isSubbed" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ContentLanguage_pkey" PRIMARY KEY ("contentId","languageId")
);

-- CreateTable
CREATE TABLE "ContentStudio" (
    "contentId" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,

    CONSTRAINT "ContentStudio_pkey" PRIMARY KEY ("contentId","studioId")
);

-- CreateTable
CREATE TABLE "ContentProductionCompany" (
    "contentId" TEXT NOT NULL,
    "productionCompanyId" TEXT NOT NULL,

    CONSTRAINT "ContentProductionCompany_pkey" PRIMARY KEY ("contentId","productionCompanyId")
);

-- CreateTable
CREATE TABLE "ContentCountry" (
    "contentId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,

    CONSTRAINT "ContentCountry_pkey" PRIMARY KEY ("contentId","countryId")
);

-- CreateTable
CREATE TABLE "Award" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "academy" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Award_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageAsset" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "AssetType" NOT NULL DEFAULT 'POSTER',
    "width" INTEGER,
    "height" INTEGER,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "languageId" TEXT NOT NULL,
    "contentId" TEXT,
    "seasonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trailer" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "hlsManifestUrl" TEXT NOT NULL,
    "durationSeconds" INTEGER,
    "contentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trailer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoSource" (
    "id" TEXT NOT NULL,
    "type" "VideoSourceType" NOT NULL DEFAULT 'HLS',
    "url" TEXT NOT NULL,
    "resolution" "VideoResolution" NOT NULL DEFAULT 'P1080',
    "bitrate" INTEGER,
    "codec" TEXT NOT NULL,
    "audioCodec" TEXT NOT NULL,
    "fps" DOUBLE PRECISION NOT NULL,
    "hdr" "HDRFormat" NOT NULL DEFAULT 'SDR',
    "aspectRatio" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "widevineKeyId" TEXT,
    "widevineLicenseUrl" TEXT,
    "fairplayAssetId" TEXT,
    "fairplayCertificateUrl" TEXT,
    "playreadyHeader" TEXT,

    CONSTRAINT "VideoSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubtitleTrack" (
    "id" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isCC" BOOLEAN NOT NULL DEFAULT false,
    "videoId" TEXT NOT NULL,

    CONSTRAINT "SubtitleTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioTrack" (
    "id" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT,
    "isDescriptive" BOOLEAN NOT NULL DEFAULT false,
    "videoId" TEXT NOT NULL,

    CONSTRAINT "AudioTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionAvailability" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "isAllowed" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "videoSourceId" TEXT NOT NULL,

    CONSTRAINT "RegionAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MyListItem" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MyListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "value" "RatingValue" NOT NULL,
    "profileId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationScore" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "targetContentId" TEXT NOT NULL,
    "predictedScore" DOUBLE PRECISION NOT NULL,
    "reasonCode" TEXT,
    "sourceContentId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendationScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Download" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "deviceUuid" TEXT NOT NULL,
    "authToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Download_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EarningsEvent" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "sourceType" TEXT NOT NULL,
    "watchHistoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EarningsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorPayout" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MaturityRating_code_key" ON "MaturityRating"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LanguageRegistry_iso6391_key" ON "LanguageRegistry"("iso6391");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorProfile_userId_key" ON "CreatorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_name_key" ON "SubscriptionPlan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_slug_key" ON "SubscriptionPlan"("slug");

-- CreateIndex
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceSession_refreshToken_key" ON "DeviceSession"("refreshToken");

-- CreateIndex
CREATE INDEX "DeviceSession_userId_idx" ON "DeviceSession"("userId");

-- CreateIndex
CREATE INDEX "DeviceSession_deviceUuid_idx" ON "DeviceSession"("deviceUuid");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceSession_userId_deviceUuid_key" ON "DeviceSession"("userId", "deviceUuid");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileSettings_profileId_key" ON "ProfileSettings"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Content_slug_key" ON "Content"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Content_imdbId_key" ON "Content"("imdbId");

-- CreateIndex
CREATE UNIQUE INDEX "Content_tmdbId_key" ON "Content"("tmdbId");

-- CreateIndex
CREATE UNIQUE INDEX "Content_tvdbId_key" ON "Content"("tvdbId");

-- CreateIndex
CREATE UNIQUE INDEX "Content_traktId_key" ON "Content"("traktId");

-- CreateIndex
CREATE INDEX "Content_title_idx" ON "Content"("title");

-- CreateIndex
CREATE INDEX "Content_status_idx" ON "Content"("status");

-- CreateIndex
CREATE INDEX "Content_createdById_idx" ON "Content"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Movie_videoId_key" ON "Movie"("videoId");

-- CreateIndex
CREATE INDEX "Movie_contentId_idx" ON "Movie"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "Show_contentId_key" ON "Show"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "Season_slug_key" ON "Season"("slug");

-- CreateIndex
CREATE INDEX "Season_showId_idx" ON "Season"("showId");

-- CreateIndex
CREATE UNIQUE INDEX "Season_showId_seasonNumber_key" ON "Season"("showId", "seasonNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_slug_key" ON "Episode"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_nextEpisodeId_key" ON "Episode"("nextEpisodeId");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_videoId_key" ON "Episode"("videoId");

-- CreateIndex
CREATE INDEX "Episode_seasonId_idx" ON "Episode"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_seasonId_episodeNumber_key" ON "Episode"("seasonId", "episodeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Person_slug_key" ON "Person"("slug");

-- CreateIndex
CREATE INDEX "Person_name_idx" ON "Person"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Studio_name_key" ON "Studio"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Studio_slug_key" ON "Studio"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionCompany_name_key" ON "ProductionCompany"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionCompany_slug_key" ON "ProductionCompany"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Country_isoAlpha2_key" ON "Country"("isoAlpha2");

-- CreateIndex
CREATE UNIQUE INDEX "Country_name_key" ON "Country"("name");

-- CreateIndex
CREATE INDEX "Cast_personId_idx" ON "Cast"("personId");

-- CreateIndex
CREATE INDEX "Cast_contentId_idx" ON "Cast"("contentId");

-- CreateIndex
CREATE INDEX "Cast_displayOrder_idx" ON "Cast"("displayOrder");

-- CreateIndex
CREATE INDEX "Crew_personId_idx" ON "Crew"("personId");

-- CreateIndex
CREATE INDEX "Crew_contentId_idx" ON "Crew"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "HomepageRow_displayOrder_key" ON "HomepageRow"("displayOrder");

-- CreateIndex
CREATE INDEX "HomepageRow_displayOrder_idx" ON "HomepageRow"("displayOrder");

-- CreateIndex
CREATE INDEX "HomepageRow_sourceType_idx" ON "HomepageRow"("sourceType");

-- CreateIndex
CREATE INDEX "ContentCategory_contentId_idx" ON "ContentCategory"("contentId");

-- CreateIndex
CREATE INDEX "ContentCategory_categoryId_idx" ON "ContentCategory"("categoryId");

-- CreateIndex
CREATE INDEX "CollectionItem_collectionId_idx" ON "CollectionItem"("collectionId");

-- CreateIndex
CREATE INDEX "CollectionItem_contentId_idx" ON "CollectionItem"("contentId");

-- CreateIndex
CREATE INDEX "CollectionItem_displayOrder_idx" ON "CollectionItem"("displayOrder");

-- CreateIndex
CREATE INDEX "Award_contentId_idx" ON "Award"("contentId");

-- CreateIndex
CREATE INDEX "ImageAsset_contentId_idx" ON "ImageAsset"("contentId");

-- CreateIndex
CREATE INDEX "ImageAsset_seasonId_idx" ON "ImageAsset"("seasonId");

-- CreateIndex
CREATE INDEX "Trailer_contentId_idx" ON "Trailer"("contentId");

-- CreateIndex
CREATE INDEX "VideoSource_videoId_idx" ON "VideoSource"("videoId");

-- CreateIndex
CREATE INDEX "SubtitleTrack_videoId_idx" ON "SubtitleTrack"("videoId");

-- CreateIndex
CREATE INDEX "AudioTrack_videoId_idx" ON "AudioTrack"("videoId");

-- CreateIndex
CREATE INDEX "RegionAvailability_videoSourceId_idx" ON "RegionAvailability"("videoSourceId");

-- CreateIndex
CREATE UNIQUE INDEX "RegionAvailability_countryCode_videoSourceId_key" ON "RegionAvailability"("countryCode", "videoSourceId");

-- CreateIndex
CREATE INDEX "MyListItem_profileId_idx" ON "MyListItem"("profileId");

-- CreateIndex
CREATE INDEX "MyListItem_displayOrder_idx" ON "MyListItem"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "MyListItem_profileId_contentId_key" ON "MyListItem"("profileId", "contentId");

-- CreateIndex
CREATE INDEX "Rating_profileId_idx" ON "Rating"("profileId");

-- CreateIndex
CREATE INDEX "Rating_contentId_idx" ON "Rating"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_profileId_contentId_key" ON "Rating"("profileId", "contentId");

-- CreateIndex
CREATE INDEX "RecommendationScore_profileId_predictedScore_idx" ON "RecommendationScore"("profileId", "predictedScore");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationScore_profileId_targetContentId_key" ON "RecommendationScore"("profileId", "targetContentId");

-- CreateIndex
CREATE INDEX "Download_profileId_idx" ON "Download"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Download_profileId_videoId_deviceUuid_key" ON "Download"("profileId", "videoId", "deviceUuid");

-- CreateIndex
CREATE UNIQUE INDEX "EarningsEvent_watchHistoryId_key" ON "EarningsEvent"("watchHistoryId");

-- CreateIndex
CREATE INDEX "EarningsEvent_creatorId_idx" ON "EarningsEvent"("creatorId");

-- CreateIndex
CREATE INDEX "EarningsEvent_createdAt_idx" ON "EarningsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "Profile_userId_idx" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "WatchHistory_profileId_idx" ON "WatchHistory"("profileId");

-- CreateIndex
CREATE INDEX "WatchHistory_videoId_idx" ON "WatchHistory"("videoId");

-- CreateIndex
CREATE INDEX "WatchHistory_updatedAt_idx" ON "WatchHistory"("updatedAt");

-- AddForeignKey
ALTER TABLE "CreatorProfile" ADD CONSTRAINT "CreatorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceSession" ADD CONSTRAINT "DeviceSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_maxMaturityId_fkey" FOREIGN KEY ("maxMaturityId") REFERENCES "MaturityRating"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileSettings" ADD CONSTRAINT "ProfileSettings_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_maturityRatingId_fkey" FOREIGN KEY ("maturityRatingId") REFERENCES "MaturityRating"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movie" ADD CONSTRAINT "Movie_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movie" ADD CONSTRAINT "Movie_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Show" ADD CONSTRAINT "Show_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_nextEpisodeId_fkey" FOREIGN KEY ("nextEpisodeId") REFERENCES "Episode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cast" ADD CONSTRAINT "Cast_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cast" ADD CONSTRAINT "Cast_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crew" ADD CONSTRAINT "Crew_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crew" ADD CONSTRAINT "Crew_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomepageRow" ADD CONSTRAINT "HomepageRow_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentCategory" ADD CONSTRAINT "ContentCategory_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentCategory" ADD CONSTRAINT "ContentCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentLanguage" ADD CONSTRAINT "ContentLanguage_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentLanguage" ADD CONSTRAINT "ContentLanguage_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "LanguageRegistry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentStudio" ADD CONSTRAINT "ContentStudio_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentStudio" ADD CONSTRAINT "ContentStudio_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentProductionCompany" ADD CONSTRAINT "ContentProductionCompany_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentProductionCompany" ADD CONSTRAINT "ContentProductionCompany_productionCompanyId_fkey" FOREIGN KEY ("productionCompanyId") REFERENCES "ProductionCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentCountry" ADD CONSTRAINT "ContentCountry_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentCountry" ADD CONSTRAINT "ContentCountry_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Award" ADD CONSTRAINT "Award_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageAsset" ADD CONSTRAINT "ImageAsset_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "LanguageRegistry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageAsset" ADD CONSTRAINT "ImageAsset_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageAsset" ADD CONSTRAINT "ImageAsset_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trailer" ADD CONSTRAINT "Trailer_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoSource" ADD CONSTRAINT "VideoSource_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubtitleTrack" ADD CONSTRAINT "SubtitleTrack_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "LanguageRegistry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubtitleTrack" ADD CONSTRAINT "SubtitleTrack_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioTrack" ADD CONSTRAINT "AudioTrack_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "LanguageRegistry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioTrack" ADD CONSTRAINT "AudioTrack_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionAvailability" ADD CONSTRAINT "RegionAvailability_videoSourceId_fkey" FOREIGN KEY ("videoSourceId") REFERENCES "VideoSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyListItem" ADD CONSTRAINT "MyListItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyListItem" ADD CONSTRAINT "MyListItem_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationScore" ADD CONSTRAINT "RecommendationScore_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationScore" ADD CONSTRAINT "RecommendationScore_targetContentId_fkey" FOREIGN KEY ("targetContentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationScore" ADD CONSTRAINT "RecommendationScore_sourceContentId_fkey" FOREIGN KEY ("sourceContentId") REFERENCES "Content"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Download" ADD CONSTRAINT "Download_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Download" ADD CONSTRAINT "Download_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
