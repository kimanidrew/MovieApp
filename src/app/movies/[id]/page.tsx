import VideoDetailsPage from "@/components/VideoDetailsPage";
import { getMovieById, getAllVideos } from "@/lib/api"; // Your data fetching functions

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movie = await getMovieById(id);
  const all = await getAllVideos();

  if (!movie) return <div>Not Found</div>;

  return <VideoDetailsPage video={movie} allVideos={all} type="movie" />;
}