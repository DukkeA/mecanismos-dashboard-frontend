import { VehicleDetailPage } from "@/features/vehicles/vehicle-detail-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <VehicleDetailPage vehicleId={id} />;
}
