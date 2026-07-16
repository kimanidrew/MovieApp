import React from "react";
import prisma from "@/lib/prisma";
import Footer from "@/components/Footer";
import PageBackground from "@/components/PageBackground";
import MoviesPageClient from "@/components/MoviesPageClient";

export const metadata = {
  title: "Movies - MovieFlix",
  description: "Explore blockbuster movies.",
};

export const dynamic = "force-dynamic";

export default async function MoviesPage() {
  let movies: any[] = [];
  let categories: string[] = [];

  try {
    const rawMovies = await prisma.movie.findMany({
      include: {
        content: {
          include: {
            images: true,
            trailers: true,
            maturityRating: true,

            categories: {
              include: {
                category: true,
              },
            },

            languages: {
              include: {
                language: true,
              },
            },

            studios: {
              include: {
                studio: true,
              },
            },

            productionCos: {
              include: {
                productionCompany: true,
              },
            },

            countries: {
              include: {
                country: true,
              },
            },

            awards: true,

            cast: {
              include: {
                person: true,
              },
              orderBy: {
                displayOrder: "asc",
              },
            },

            crew: {
              include: {
                person: true,
              },
            },
          },
        },

        video: {
          include: {
            sources: true,

            subtitles: {
              include: {
                language: true,
              },
            },

            audioTracks: {
              include: {
                language: true,
              },
            },
          },
        },
      },

      orderBy: {
        content: {
          createdAt: "desc",
        },
      },
    });

    movies = rawMovies.map((movie) => {
      const content = movie.content;
      const video = movie.video;

      const images = content.images;

      const randomImage = (type: string) => {
        const filtered = images.filter((i) => i.type === type);

        if (!filtered.length) return null;

        return filtered[
          Math.floor(Math.random() * filtered.length)
        ].url;
      };

      return {
        ...movie,

        title: content.title,

        description: content.description,

        releaseYear: content.releaseYear,

        storyline: content.storyline,

        thumbnailUrl: randomImage("POSTER"),

        backdropUrl: randomImage("BACKDROP"),

        maturityRating: content.maturityRating.code,

        trailerUrl:
          content.trailers[0]?.hlsManifestUrl ?? null,

        categories: content.categories.map(
          (x) => x.category.name
        ),

        languages: content.languages.map(
          (x) => x.language.name
        ),

        studios: content.studios.map(
          (x) => x.studio.name
        ),

        productionCompanies:
          content.productionCos.map(
            (x) => x.productionCompany.name
          ),

        countries: content.countries.map(
          (x) => x.country.name
        ),

        cast: content.cast.map((c) => ({
          name: c.person.name,
          character: c.character,
        })),

        crew: content.crew.map((c) => ({
          name: c.person.name,
          job: c.job,
        })),

        awards: content.awards,

        videoSources: video.sources,

        subtitles: video.subtitles,

        audioTracks: video.audioTracks,
      };
    });

    categories = [
      ...new Set(
        movies.flatMap((m) => m.categories)
      ),
    ].sort();

    console.log(
      JSON.stringify(
        movies,
        (_, value) =>
          typeof value === "bigint"
            ? value.toString()
            : value,
        2
      )
    );
  } catch (err) {
    console.error(err);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <PageBackground overlayOpacity={0.82} />

      <MoviesPageClient
        movies={movies}
        categories={categories}
      />

      <Footer />
    </main>
  );
}