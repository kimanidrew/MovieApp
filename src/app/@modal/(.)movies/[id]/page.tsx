import { getContentById, getAllVideos } from "@/lib/api";
import { notFound } from "next/navigation";
import ModalClient from "../../components/ModalClient";

export default async function ModalInterceptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 1. Fetch data using the centralized API layer
  const video = await getContentById(id);
  const allVideos = await getAllVideos();

  // 2. Handle 404
  if (!video) {
    notFound();
  }

  // 3. Determine type based on the API response
  const contentType = video.isTvShow ? "show" : "movie";

  // 4. Return the Client component
  return <ModalClient video={video} allVideos={allVideos} type={contentType} />;
}