import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getHomepageData } from "@/lib/homepage-service";
import HomePageContent from "@/components/home/HomePageContent";

export default async function BrowsePage() {
  const cookieStore = await cookies();
  const profileId = cookieStore.get("profile_id")?.value;

  if (!profileId) {
    redirect("/profiles");
  }

  const homepageData = await getHomepageData(profileId);

  return <HomePageContent data={homepageData} />;
}