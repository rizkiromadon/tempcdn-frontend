import { FileDetail } from "@/components/tempcdn/file-detail";

interface FilePageProps {
  params: { id: string };
}

export default function FilePage({ params }: FilePageProps) {
  return <FileDetail id={params.id} />;
}
