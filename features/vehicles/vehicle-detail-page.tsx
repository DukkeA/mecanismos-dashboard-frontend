"use client";

import Link from "next/link";
import { AlertCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RichTextViewer } from "@/components/rich-text/rich-text-viewer";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VehicleFormDialog } from "@/features/vehicles/vehicle-form-dialog";
import { useVehicleQuery } from "@/hooks/use-vehicles";
import type { Vehicle } from "@/lib/vehicles/types";

export function VehicleDetailPage({ vehicleId }: { vehicleId: string }) {
  const query = useVehicleQuery(vehicleId);

  if (query.isPending) return <main className="flex flex-1 flex-col gap-6 p-4 md:p-6"><Skeleton className="h-36 w-full" /><Skeleton className="h-48 w-full" /></main>;
  if (query.isError || !query.data) {
    return (
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <Alert>
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>No pudimos cargar el vehículo</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>El vehículo no existe o no está disponible.</span>
            <Button asChild variant="outline" size="sm"><Link href="/vehicles">Volver a vehículos</Link></Button>
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  return <VehicleDetail vehicle={query.data} />;
}

function VehicleDetail({ vehicle }: { vehicle: Vehicle }) {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{vehicle.plate}</CardTitle>
          <CardDescription>{vehicle.brand} · {vehicle.modelReference}</CardDescription>
          <CardAction className="flex gap-2"><Button asChild variant="outline"><Link href="/vehicles">Volver</Link></Button><VehicleFormDialog vehicle={vehicle} trigger={<Button type="button">Editar</Button>} /></CardAction>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Info label="Cliente" value={vehicle.customerId} href={`/customers/${vehicle.customerId}`} />
          <NoteInfo label="Notas" value={vehicle.notes} />
          <Info label="Creado" value={formatDate(vehicle.createdAt)} />
          <Info label="Actualizado" value={formatDate(vehicle.updatedAt)} />
        </CardContent>
      </Card>
    </main>
  );
}

function Info({ label, value, href }: { label: string; value: string; href?: string }) {
  return <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">{label}</p>{href ? <Link href={href} className="font-medium underline-offset-4 hover:underline">{value}</Link> : <p className="font-medium">{value}</p>}</div>;
}

function NoteInfo({ label, value }: { label: string; value: Vehicle["notes"] }) {
  return <div className="rounded-xl bg-muted/40 p-3 md:col-span-2"><p className="text-xs text-muted-foreground">{label}</p><RichTextViewer value={value} className="mt-1" /></div>;
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("es-AR").format(new Date(value)) : "Sin fecha";
}
