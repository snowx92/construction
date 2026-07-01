import { ApiProjectDetail } from "@/components/projects/api-project-detail";

export default function ProjectPage({ params }: { params: { id: string } }) {
  return <ApiProjectDetail projectId={params.id} />;
}
