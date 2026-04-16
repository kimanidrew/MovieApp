import Tabs from "@/components/TabComponent";

const tabs = [
  { label: "Upload Video", path: "/upload/storage" },
  { label: "YouTube Import", path: "/upload/youtube" },
];

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ paddingTop: "6rem"}}>
      <Tabs tabs={tabs} />

      <div style={{ padding: "2rem" }}>
        {children}
      </div>
    </div>
  );
}