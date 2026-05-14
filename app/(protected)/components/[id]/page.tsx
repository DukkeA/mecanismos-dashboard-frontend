import { ComponentDetailPage } from "@/features/components/component-detail-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <ComponentDetailPage componentId={id} />;
}
