import VideoDetailsPage from "@/components/VideoDetailsPage";
import { getShowById, getAllVideos } from "@/lib/api"; 

export default async function ShowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const show = await getShowById(id);
  const all = await getAllVideos();

  if (!show) return <div>Not Found</div>;

  return <VideoDetailsPage video={show} allVideos={all} type="show" />;
}