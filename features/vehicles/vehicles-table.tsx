"use client";

import Link from "next/link";
import { AlertCircleIcon, CarFrontIcon, MoreHorizontalIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AssetPagination } from "@/features/assets/asset-pagination";
import { VehicleFormDialog } from "@/features/vehicles/vehicle-form-dialog";
import { extractPlainTextFromRichText } from "@/lib/rich-text";
import type { Vehicle, VehicleListParams, VehiclesPage } from "@/lib/vehicles/types";

export function VehiclesTable({ params, page, isPending, isError, onRetry, onParamsChange }: { params: VehicleListParams; page?: VehiclesPage; isPending: boolean; isError: boolean; onRetry: () => void; onParamsChange: (params: VehicleListParams) => void }) {
  const rows = page?.data ?? [];

  if (isPending) return <VehiclesSkeleton />;
  if (isError) {
    return (
      <Alert>
        <AlertCircleIcon aria-hidden="true" />
        <AlertTitle>No pudimos cargar los vehículos</AlertTitle>
        <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>Reintentá la consulta sin perder los filtros actuales.</span>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>Reintentar</Button>
        </AlertDescription>
      </Alert>
    );
  }
  if (!rows.length) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon"><CarFrontIcon aria-hidden="true" /></EmptyMedia>
          <EmptyTitle>No hay vehículos para mostrar</EmptyTitle>
          <EmptyDescription>Probá con otra búsqueda o cargá el primer vehículo.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent><VehicleFormDialog trigger={<Button type="button">Crear vehículo</Button>} /></EmptyContent>
      </Empty>
    );
  }

  return (
    <Card className="gap-0 p-0">
      <CardContent className="p-0">
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patente</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((vehicle) => <VehicleRow key={vehicle.id} vehicle={vehicle} />)}
            </TableBody>
          </Table>
        </div>
        <div className="grid gap-3 p-4 md:hidden">
          {rows.map((vehicle) => <VehicleMobileCard key={vehicle.id} vehicle={vehicle} />)}
        </div>
      </CardContent>
      {page ? <AssetPagination label="vehículo" params={params} meta={page.meta} onParamsChange={onParamsChange} /> : null}
    </Card>
  );
}

function VehicleRow({ vehicle }: { vehicle: Vehicle }) {
  const notePreview = extractPlainTextFromRichText(vehicle.notes, 80);
  return (
    <TableRow>
      <TableCell className="font-medium"><Link href={`/vehicles/${vehicle.id}`} className="hover:underline">{vehicle.plate}</Link></TableCell>
      <TableCell>{vehicle.brand}</TableCell>
      <TableCell>{vehicle.modelReference}</TableCell>
      <TableCell>{notePreview || "—"}</TableCell>
      <TableCell className="text-right"><VehicleActions vehicle={vehicle} /></TableCell>
    </TableRow>
  );
}

function VehicleMobileCard({ vehicle }: { vehicle: Vehicle }) {
  const notePreview = extractPlainTextFromRichText(vehicle.notes, 120);
  return (
    <div className="rounded-2xl border p-4">
      <Link href={`/vehicles/${vehicle.id}`} className="font-medium hover:underline">{vehicle.plate}</Link>
      <p className="text-sm text-muted-foreground">{vehicle.brand} · {vehicle.modelReference}</p>
      <p className="mt-2 text-sm text-muted-foreground">{notePreview || "Sin notas"}</p>
      <div className="mt-4 flex gap-2">
        <Button asChild variant="outline" size="sm"><Link href={`/vehicles/${vehicle.id}`}>Ver detalle</Link></Button>
        <VehicleFormDialog vehicle={vehicle} trigger={<Button type="button" variant="ghost" size="sm">Editar</Button>} />
      </div>
    </div>
  );
}

export function VehicleActions({ vehicle }: { vehicle: Vehicle }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Acciones de ${vehicle.plate}`}><MoreHorizontalIcon aria-hidden="true" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild><Link href={`/vehicles/${vehicle.id}`}>Ver detalle</Link></DropdownMenuItem>
        <VehicleFormDialog vehicle={vehicle} trigger={<DropdownMenuItem onSelect={(event) => event.preventDefault()}>Editar vehículo</DropdownMenuItem>} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function VehiclesSkeleton() {
  return <Card aria-label="Cargando vehículos" role="status"><CardContent className="flex flex-col gap-3">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</CardContent></Card>;
}
