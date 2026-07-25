import prisma from "@/lib/prisma";

export interface ResolvedVideo {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  hlsManifestUrl: string | null;
  videoUrl: string | null;
  introStart: number;
  introEnd: number;
  recapStart: number;
  recapEnd: number;
  creditsStart: number | null;
  creditsEnd: number | null;
  durationSeconds: number;
  sources: any[];
  subtitles: any[];
  audioTracks: any[];
}

export async function getVideoById(
  id: string,
  params?: { season?: string; ep?: string; episode?: string }
): Promise<ResolvedVideo> {
  const seasonParam = params?.season;
  const epParam = params?.ep || params?.episode;

  try {
    // 1. Check Video table directly by ID
    const directVideo = await prisma.video.findUnique({
      where: { id },
      include: {
        sources: true,
        subtitles: { include: { language: true } },
        audioTracks: { include: { language: true } },
        movie: {
          include: {
            content: {
              include: { images: true, trailers: true }
            }
          }
        },
        episode: {
          include: {
            season: {
              include: {
                show: {
                  include: {
                    content: { include: { images: true, trailers: true } }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (directVideo) {
      return formatVideoResponse(directVideo);
    }

    // 2. Check Episode table by ID
    const episode = await prisma.episode.findUnique({
      where: { id },
      include: {
        video: {
          include: {
            sources: true,
            subtitles: { include: { language: true } },
            audioTracks: { include: { language: true } }
          }
        },
        season: {
          include: {
            show: {
              include: {
                content: { include: { images: true, trailers: true } }
              }
            }
          }
        }
      }
    });

    if (episode && episode.video) {
      return formatVideoResponse({
        ...episode.video,
        episode
      });
    }

    // 3. Check Movie table by ID
    const movie = await prisma.movie.findUnique({
      where: { id },
      include: {
        video: {
          include: {
            sources: true,
            subtitles: { include: { language: true } },
            audioTracks: { include: { language: true } }
          }
        },
        content: {
          include: { images: true, trailers: true }
        }
      }
    });

    if (movie && movie.video) {
      return formatVideoResponse({
        ...movie.video,
        movie
      });
    }

    // 4. Check Content table by ID or Slug
    let content = await prisma.content.findUnique({
      where: { id },
      include: {
        images: true,
        trailers: true,
        movies: {
          include: {
            video: {
              include: {
                sources: true,
                subtitles: { include: { language: true } },
                audioTracks: { include: { language: true } }
              }
            }
          }
        },
        show: {
          include: {
            seasons: {
              orderBy: { seasonNumber: "asc" },
              include: {
                episodes: {
                  orderBy: { episodeNumber: "asc" },
                  include: {
                    video: {
                      include: {
                        sources: true,
                        subtitles: { include: { language: true } },
                        audioTracks: { include: { language: true } }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!content) {
      content = await prisma.content.findUnique({
        where: { slug: id },
        include: {
          images: true,
          trailers: true,
          movies: {
            include: {
              video: {
                include: {
                  sources: true,
                  subtitles: { include: { language: true } },
                  audioTracks: { include: { language: true } }
                }
              }
            }
          },
          show: {
            include: {
              seasons: {
                orderBy: { seasonNumber: "asc" },
                include: {
                  episodes: {
                    orderBy: { episodeNumber: "asc" },
                    include: {
                      video: {
                        include: {
                          sources: true,
                          subtitles: { include: { language: true } },
                          audioTracks: { include: { language: true } }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });
    }

    if (content) {
      // 4a. If content has movies
      if (content.movies && content.movies.length > 0) {
        const selMovie = content.movies[0];
        if (selMovie.video) {
          return formatVideoResponse({
            ...selMovie.video,
            movie: {
              ...selMovie,
              content
            }
          });
        }
      }

      // 4b. If content has show
      if (content.show && content.show.seasons.length > 0) {
        const targetSeasonNum = seasonParam ? parseInt(seasonParam, 10) : undefined;
        const targetEpNum = epParam ? parseInt(epParam, 10) : undefined;

        let targetSeason = targetSeasonNum !== undefined
          ? content.show.seasons.find((s) => s.seasonNumber === targetSeasonNum)
          : content.show.seasons[0];

        if (!targetSeason) targetSeason = content.show.seasons[0];

        let targetEpisode = targetEpNum !== undefined
          ? targetSeason.episodes.find((e) => e.episodeNumber === targetEpNum)
          : targetSeason.episodes[0];

        if (!targetEpisode && targetSeason.episodes.length > 0) {
          targetEpisode = targetSeason.episodes[0];
        }

        if (targetEpisode && targetEpisode.video) {
          return formatVideoResponse({
            ...targetEpisode.video,
            episode: {
              ...targetEpisode,
              season: {
                ...targetSeason,
                show: {
                  ...content.show,
                  content
                }
              }
            }
          });
        }
      }

      // 4c. Content found but no movie/episode video attached -> fallback to trailer or content metadata
      const posterAsset = content.images.find((img) => img.type === "POSTER" || img.type === "BACKDROP" || img.type === "STILL")?.url || null;
      const trailerUrl = content.trailers?.[0]?.hlsManifestUrl || null;

      return {
        id: content.id,
        title: content.title,
        thumbnailUrl: posterAsset,
        hlsManifestUrl: trailerUrl && trailerUrl.includes(".m3u8") ? trailerUrl : null,
        videoUrl: trailerUrl && !trailerUrl.includes(".m3u8") ? trailerUrl : null,
        introStart: 0,
        introEnd: 0,
        recapStart: 0,
        recapEnd: 0,
        creditsStart: null,
        creditsEnd: null,
        durationSeconds: 0,
        sources: [],
        subtitles: [],
        audioTracks: []
      };
    }

    // 5. Check Trailer table by ID
    const trailer = await prisma.trailer.findUnique({
      where: { id },
      include: {
        content: { include: { images: true } }
      }
    });

    if (trailer) {
      const posterAsset = trailer.content?.images?.find((img) => img.type === "POSTER" || img.type === "BACKDROP")?.url || null;
      return {
        id: trailer.id,
        title: trailer.title || trailer.content?.title || "Trailer",
        thumbnailUrl: posterAsset,
        hlsManifestUrl: trailer.hlsManifestUrl.includes(".m3u8") ? trailer.hlsManifestUrl : null,
        videoUrl: !trailer.hlsManifestUrl.includes(".m3u8") ? trailer.hlsManifestUrl : null,
        introStart: 0,
        introEnd: 0,
        recapStart: 0,
        recapEnd: 0,
        creditsStart: null,
        creditsEnd: null,
        durationSeconds: trailer.durationSeconds || 0,
        sources: [],
        subtitles: [],
        audioTracks: []
      };
    }

    // 6. Generic Fallback so Watch Page NEVER 404s
    return {
      id,
      title: "MovieFlix Video Stream",
      thumbnailUrl: null,
      hlsManifestUrl: null,
      videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      introStart: 0,
      introEnd: 0,
      recapStart: 0,
      recapEnd: 0,
      creditsStart: null,
      creditsEnd: null,
      durationSeconds: 0,
      sources: [],
      subtitles: [],
      audioTracks: []
    };
  } catch (error) {
    console.error("Error in getVideoById:", error);
    return {
      id,
      title: "MovieFlix Stream",
      thumbnailUrl: null,
      hlsManifestUrl: null,
      videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      introStart: 0,
      introEnd: 0,
      recapStart: 0,
      recapEnd: 0,
      creditsStart: null,
      creditsEnd: null,
      durationSeconds: 0,
      sources: [],
      subtitles: [],
      audioTracks: []
    };
  }
}

function formatVideoResponse(targetVideo: any): ResolvedVideo {
  const sources = targetVideo.sources || [];

  let hlsSource = sources.find((s: any) => s.type === "HLS" || (s.url && s.url.includes(".m3u8")))?.url || null;
  let mp4Source = sources.find((s: any) => s.type === "MP4" || (s.url && s.url.includes(".mp4")))?.url || null;
  const fallbackSource = sources[0]?.url || null;

  if (!hlsSource && fallbackSource && (fallbackSource.includes(".m3u8") || !fallbackSource.includes(".mp4"))) {
    hlsSource = fallbackSource;
  }

  if (!mp4Source && fallbackSource && !fallbackSource.includes(".m3u8")) {
    mp4Source = fallbackSource;
  }

  // Fallback check to trailers if video has no sources
  if (!hlsSource && !mp4Source) {
    const trailers = targetVideo.movie?.content?.trailers || targetVideo.episode?.season?.show?.content?.trailers || [];
    if (trailers.length > 0 && trailers[0].hlsManifestUrl) {
      const tUrl = trailers[0].hlsManifestUrl;
      if (tUrl.includes(".m3u8")) hlsSource = tUrl;
      else mp4Source = tUrl;
    }
  }

  let title = "MovieFlix Stream";
  if (targetVideo.episode) {
    const contentTitle = targetVideo.episode.season?.show?.content?.title;
    const epTitle = targetVideo.episode.title;
    const sNum = targetVideo.episode.season?.seasonNumber;
    const eNum = targetVideo.episode.episodeNumber;
    title = contentTitle ? `${contentTitle}: S${sNum} E${eNum} - ${epTitle}` : epTitle;
  } else if (targetVideo.movie?.content?.title) {
    title = targetVideo.movie.content.title;
  }

  let thumbnailUrl = null;
  const images = targetVideo.movie?.content?.images || targetVideo.episode?.season?.show?.content?.images || [];
  const posterAsset = images.find((img: any) => img.type === "STILL") ||
                      images.find((img: any) => img.type === "POSTER") ||
                      images.find((img: any) => img.type === "BACKDROP");
  if (posterAsset) {
    thumbnailUrl = posterAsset.url;
  }

  return {
    id: targetVideo.id,
    title,
    thumbnailUrl,
    hlsManifestUrl: hlsSource,
    videoUrl: mp4Source || (hlsSource ? null : fallbackSource),
    introStart: targetVideo.introStart ?? 0,
    introEnd: targetVideo.introEnd ?? 0,
    recapStart: targetVideo.recapStart ?? 0,
    recapEnd: targetVideo.recapEnd ?? 0,
    creditsStart: targetVideo.creditsStart ?? null,
    creditsEnd: targetVideo.creditsEnd ?? null,
    durationSeconds: targetVideo.durationSeconds ?? 0,
    sources,
    subtitles: targetVideo.subtitles || [],
    audioTracks: targetVideo.audioTracks || []
  };
}
