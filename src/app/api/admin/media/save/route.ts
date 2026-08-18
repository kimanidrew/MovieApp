import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ContentStatus, VideoSourceType, VideoResolution, AssetType } from "@/app/generated/prisma";
import { requireRole, CONTENT_MANAGEMENT_ROLES } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const { user: currentUser, error } = await requireRole(request, CONTENT_MANAGEMENT_ROLES);
    if (error) return error;

    const payload = await request.json();
    const {
      type, title, slug, description, storyline, releaseYear, maturityRatingCode,
      tmdbId, categories = [], images = [], trailers = [], movieVideoUrl, movieDuration,
      seasonNumber, episodeNumber, episodeTitle, episodeDescription,
      episodeVideoUrl, episodeDuration, isExistingShow, existingShowId,
      isFeatured, featuredOrder,
      imdbId, originalLanguage, spokenLanguages = [], popularityScore, voteAverage,
      voteCount, runtime, status, homepage, keywords = [],
      cast = [], crew = [], videoDetails = {}, subtitles = [],
      productionInfo = {}, awards = [], collectionIds = [],
    } = payload;

    if (!isExistingShow && (!title || !slug)) {
      return NextResponse.json({ error: "Title and slug are required for new releases." }, { status: 400 });
    }

    // 1. Resolve Prerequisite Entities
    const defaultLanguage = await prisma.languageRegistry.findFirst({ where: { iso6391: "en" } });
    const maturityRating = await prisma.maturityRating.findFirst({ where: { code: maturityRatingCode || "TV-MA" } });
    const activeUploader = await prisma.user.findUnique({ where: { id: currentUser.id } });

    if (!defaultLanguage || !activeUploader || !maturityRating) {
      return NextResponse.json({ error: "Prerequisite database configuration missing." }, { status: 412 });
    }

    const canUpload = activeUploader.role === "ADMIN" || activeUploader.role === "SUPERADMIN" || activeUploader.role === "CONTENT_MANAGER" || activeUploader.isCreator;
    if (!canUpload) {
      return NextResponse.json({ error: "You do not have permission to upload content" }, { status: 403 });
    }

    // 2. Map & Upsert Categories
    const resolvedCategories = await Promise.all(
      (categories || []).map(async (name: string) => {
        const normalizedSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return prisma.category.upsert({
          where: { slug: normalizedSlug },
          update: {},
          create: { name, slug: normalizedSlug },
        });
      })
    );

    // 3. Resolve languages
    const resolvedLanguages = await Promise.all(
      (spokenLanguages.length > 0 ? spokenLanguages : [originalLanguage || "en"]).map(async (iso: string) => {
        const lang = await prisma.languageRegistry.findFirst({ where: { iso6391: iso } });
        if (lang) return lang;
        const found = await prisma.languageRegistry.findFirst({ where: { iso6391: iso.toLowerCase() } });
        return found || defaultLanguage;
      })
    );

    // 4. Resolve cast & crew persons
    const resolvedCast = await Promise.all(
      (cast || []).map(async (c: any) => {
        const personSlug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const person = await prisma.person.upsert({
          where: { slug: personSlug },
          update: {},
          create: { name: c.name, slug: personSlug },
        });
        return { person, character: c.character || "", displayOrder: c.displayOrder || 0 };
      })
    );

    const resolvedCrew = await Promise.all(
      (crew || []).map(async (c: any) => {
        const personSlug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const person = await prisma.person.upsert({
          where: { slug: personSlug },
          update: {},
          create: { name: c.name, slug: personSlug },
        });
        return { person, job: c.job || "Actor", department: c.department || "Acting" };
      })
    );

    // 5. Resolve studios & production companies
    const resolvedStudios = await Promise.all(
      (productionInfo.studios || []).map(async (name: string) => {
        const studioSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return prisma.studio.upsert({
          where: { slug: studioSlug },
          update: {},
          create: { name, slug: studioSlug },
        });
      })
    );

    const resolvedCompanies = await Promise.all(
      (productionInfo.productionCompanies || []).map(async (name: string) => {
        const companySlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return prisma.productionCompany.upsert({
          where: { slug: companySlug },
          update: {},
          create: { name, slug: companySlug },
        });
      })
    );

    // 6. Resolve countries
    const resolvedCountries = await Promise.all(
      (productionInfo.countries || []).map(async (iso: string) => {
        const country = await prisma.country.findFirst({ where: { isoAlpha2: iso } });
        return country;
      })
    ).then(list => list.filter(Boolean));

    // 7. Build common content data fields
    const commonContentData = {
      description, storyline,
      releaseYear: Number(releaseYear || 2026),
      status: ContentStatus.READY,
      maturityRatingId: maturityRating.id,
      tmdbId: tmdbId ? Number(tmdbId) : null,
      imdbId: imdbId || null,
      popularityScore: Number(popularityScore || 0),
      isFeatured: isFeatured || false,
      featuredOrder: featuredOrder || 0,
      createdById: activeUploader.id,
      updatedById: activeUploader.id,
    };

    // =========================================================================
    // MOVIE TRANSACTION PIPELINE
    // =========================================================================
    if (type === "MOVIE") {
      const dbResult = await prisma.$transaction(async (tx) => {
        const content = await tx.content.create({
          data: {
            ...commonContentData,
            title, slug,
            categories: {
              create: resolvedCategories.map((cat, idx) => ({
                category: { connect: { id: cat.id } },
                isPrimary: idx === 0,
              })),
            },
            languages: {
              create: resolvedLanguages.map((lang) => ({
                language: { connect: { id: lang.id } },
                isDubbed: false,
                isSubbed: true,
              })),
            },
            cast: {
              create: resolvedCast.map((c) => ({
                person: { connect: { id: c.person.id } },
                character: c.character,
                displayOrder: c.displayOrder,
              })),
            },
            crew: {
              create: resolvedCrew.map((c) => ({
                person: { connect: { id: c.person.id } },
                job: c.job,
                department: c.department,
              })),
            },
            studios: {
              create: resolvedStudios.map((s) => ({
                studio: { connect: { id: s.id } },
              })),
            },
            productionCos: {
              create: resolvedCompanies.map((c) => ({
                productionCompany: { connect: { id: c.id } },
              })),
            },
            countries: {
              create: resolvedCountries.map((c: any) => ({
                country: { connect: { id: c.id } },
              })),
            },
            awards: {
              create: (awards || []).map((a: any) => ({
                academy: a.academy,
                year: Number(a.year),
                category: a.category,
                isWinner: a.isWinner || false,
              })),
            },
            collections: {
              create: (collectionIds || []).map((colId: string) => ({
                collection: { connect: { id: colId } },
                displayOrder: 0,
              })),
            },
          },
        });

        const durationSec = Number(movieDuration || runtime || videoDetails.durationSeconds || 7200);
        
        // Create video record (even without a URL, so the movie can be saved first)
        const video = await tx.video.create({
          data: {
            durationSeconds: durationSec,
            introStart: Number(videoDetails.introStart || 0),
            introEnd: Number(videoDetails.introEnd || 0),
            creditsStart: videoDetails.creditsStart ? Number(videoDetails.creditsStart) : null,
            creditsEnd: videoDetails.creditsEnd ? Number(videoDetails.creditsEnd) : null,
            recapStart: Number(videoDetails.recapStart || 0),
            recapEnd: Number(videoDetails.recapEnd || 0),
          },
        });

        // Only create a video source if a URL is provided
        if (movieVideoUrl) {
          const videoType = movieVideoUrl.includes(".m3u8") ? VideoSourceType.HLS : VideoSourceType.MP4;
          await tx.videoSource.create({
            data: {
              videoId: video.id, url: movieVideoUrl, type: videoType,
              resolution: (videoDetails.resolution as VideoResolution) || VideoResolution.P1080,
              codec: videoDetails.codec || "h264",
              audioCodec: videoDetails.audioCodec || "aac",
              fps: Number(videoDetails.fps || 24),
              hdr: (videoDetails.hdr as any) || "SDR",
              aspectRatio: videoDetails.aspectRatio || "16:9",
              bitrate: videoDetails.bitrate ? Number(videoDetails.bitrate) : null,
            },
          });
        }

        await tx.movie.create({
          data: { contentId: content.id, videoId: video.id, durationTotal: durationSec, cutVariant: "Theatrical" },
        });

        if (images?.length > 0) {
          await tx.imageAsset.createMany({
            data: images.map((img: any) => ({
              url: img.url, type: img.type as AssetType, languageId: defaultLanguage.id,
              contentId: content.id, displayOrder: Number(img.displayOrder || 0),
            })),
            skipDuplicates: true,
          });
        }

        if (trailers?.length > 0) {
          await tx.trailer.createMany({
            data: trailers.map((tr: any) => ({ contentId: content.id, title: tr.title, hlsManifestUrl: tr.hlsManifestUrl })),
            skipDuplicates: true,
          });
        }

        // Create subtitles
        if (subtitles?.length > 0) {
          await tx.subtitleTrack.createMany({
            data: subtitles.map((s: any) => ({
              videoId: video.id,
              languageId: s.languageId,
              label: s.label || "English",
              url: s.url,
              isCC: s.isCC || false,
            })),
            skipDuplicates: true,
          });
        }

        return { contentId: content.id };
      });
      return NextResponse.json({ success: true, data: dbResult });
    }

    // =========================================================================
    // SHOW EPISODE TRANSACTION PIPELINE
    // =========================================================================
    if (type === "SHOW") {
      const dbResult = await prisma.$transaction(async (tx) => {
        let showContent = null;

        if (existingShowId) {
          const existingShow = await tx.show.findUnique({
            where: { id: existingShowId },
            include: { content: true }
          });
          if (existingShow) {
            showContent = existingShow.content;
          } else {
            showContent = await tx.content.findUnique({ where: { id: existingShowId } });
          }
        }

        if (!showContent && slug) {
          showContent = await tx.content.findUnique({ where: { slug } });
        }

        if (!showContent) {
          showContent = await tx.content.create({
            data: {
              ...commonContentData,
              title: title || "Untitled Show",
              slug: slug || `show-${Date.now()}`,
              categories: {
                create: resolvedCategories.map((cat, idx) => ({
                  category: { connect: { id: cat.id } },
                  isPrimary: idx === 0,
                })),
              },
              languages: {
                create: resolvedLanguages.map((lang) => ({
                  language: { connect: { id: lang.id } },
                  isDubbed: false,
                  isSubbed: true,
                })),
              },
              cast: {
                create: resolvedCast.map((c) => ({
                  person: { connect: { id: c.person.id } },
                  character: c.character,
                  displayOrder: c.displayOrder,
                })),
              },
              crew: {
                create: resolvedCrew.map((c) => ({
                  person: { connect: { id: c.person.id } },
                  job: c.job,
                  department: c.department,
                })),
              },
              studios: {
                create: resolvedStudios.map((s) => ({
                  studio: { connect: { id: s.id } },
                })),
              },
              productionCos: {
                create: resolvedCompanies.map((c) => ({
                  productionCompany: { connect: { id: c.id } },
                })),
              },
              countries: {
                create: resolvedCountries.map((c: any) => ({
                  country: { connect: { id: c.id } },
                })),
              },
              awards: {
                create: (awards || []).map((a: any) => ({
                  academy: a.academy,
                  year: Number(a.year),
                  category: a.category,
                  isWinner: a.isWinner || false,
                })),
              },
              collections: {
                create: (collectionIds || []).map((colId: string) => ({
                  collection: { connect: { id: colId } },
                  displayOrder: 0,
                })),
              },
            },
          });
          await tx.show.create({ data: { contentId: showContent.id } });
        }

        // Save Images (only for new shows, skip for existing)
        if (images?.length > 0 && !existingShowId) {
          await tx.imageAsset.createMany({
            data: images.map((img: any) => ({
              url: img.url, type: img.type as AssetType, languageId: defaultLanguage.id,
              contentId: showContent!.id, displayOrder: Number(img.displayOrder || 0),
            })),
            skipDuplicates: true,
          });
        }

        // Save Trailers (only for new shows, skip for existing)
        if (trailers?.length > 0 && !existingShowId) {
          await tx.trailer.createMany({
            data: trailers.map((tr: any) => ({
              contentId: showContent!.id,
              title: tr.title,
              hlsManifestUrl: tr.hlsManifestUrl,
            })),
            skipDuplicates: true,
          });
        }

        const show = await tx.show.findUniqueOrThrow({ where: { contentId: showContent.id } });
        const baseSlug = showContent.slug || slug || "show";

        let season = await tx.season.findFirst({
          where: { showId: show.id, seasonNumber: Number(seasonNumber || 1) },
        });

        if (!season) {
          season = await tx.season.create({
            data: {
              showId: show.id,
              seasonNumber: Number(seasonNumber || 1),
              title: `Season ${seasonNumber || 1}`,
              slug: `${baseSlug}-season-${seasonNumber || 1}`.toLowerCase(),
            },
          });
        }

        const durationSec = Number(episodeDuration || runtime || videoDetails.durationSeconds || 2700);
        const video = await tx.video.create({
          data: {
            durationSeconds: durationSec,
            introStart: Number(videoDetails.introStart || 0),
            introEnd: Number(videoDetails.introEnd || 0),
            creditsStart: videoDetails.creditsStart ? Number(videoDetails.creditsStart) : null,
            creditsEnd: videoDetails.creditsEnd ? Number(videoDetails.creditsEnd) : null,
            recapStart: Number(videoDetails.recapStart || 0),
            recapEnd: Number(videoDetails.recapEnd || 0),
          },
        });

        // Only create a video source if a URL is provided
        if (episodeVideoUrl) {
          const videoType = episodeVideoUrl.includes(".m3u8") ? VideoSourceType.HLS : VideoSourceType.MP4;
          await tx.videoSource.create({
            data: {
              videoId: video.id, url: episodeVideoUrl, type: videoType,
              resolution: (videoDetails.resolution as VideoResolution) || VideoResolution.P1080,
              codec: videoDetails.codec || "h264",
              audioCodec: videoDetails.audioCodec || "aac",
              fps: Number(videoDetails.fps || 24),
              hdr: (videoDetails.hdr as any) || "SDR",
              aspectRatio: videoDetails.aspectRatio || "16:9",
              bitrate: videoDetails.bitrate ? Number(videoDetails.bitrate) : null,
            },
          });
        }

        // Create subtitles for episode
        if (subtitles?.length > 0) {
          await tx.subtitleTrack.createMany({
            data: subtitles.map((s: any) => ({
              videoId: video.id,
              languageId: s.languageId,
              label: s.label || "English",
              url: s.url,
              isCC: s.isCC || false,
            })),
            skipDuplicates: true,
          });
        }

        const episodeSlug = `${baseSlug}-s${seasonNumber || 1}-e${episodeNumber || 1}`.toLowerCase();
        const finalEpisodeTitle = episodeTitle || `${showContent.title} - S${seasonNumber || 1} E${episodeNumber || 1}`;

        const episode = await tx.episode.upsert({
          where: { slug: episodeSlug },
          update: { title: finalEpisodeTitle, description: episodeDescription || description, videoId: video.id },
          create: {
            seasonId: season.id, videoId: video.id, episodeNumber: Number(episodeNumber || 1),
            title: finalEpisodeTitle, slug: episodeSlug, description: episodeDescription || description,
          },
        });

        return { contentId: showContent.id, episodeId: episode.id };
      });
      return NextResponse.json({ success: true, data: dbResult });
    }

    return NextResponse.json({ error: "Invalid media type." }, { status: 400 });
  } catch (error: any) {
    console.error("Content metadata transaction failed:", error);
    return NextResponse.json({ error: error.message || "An error occurred." }, { status: 500 });
  }
}