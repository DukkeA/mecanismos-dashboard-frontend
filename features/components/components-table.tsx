"use client";

import Link from "next/link";
import { AlertCircleIcon, MoreHorizontalIcon, WrenchIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AssetPagination } from "@/features/assets/asset-pagination";
import { ComponentFormDialog } from "@/features/components/component-form-dialog";
import type { ComponentListParams, ComponentsPage, WorkshopComponent } from "@/lib/components/types";
import { extractPlainTextFromRichText } from "@/lib/rich-text";

export function ComponentsTable({ params, page, isPending, isError, onRetry, onParamsChange }: { params: ComponentListParams; page?: ComponentsPage; isPending: boolean; isError: boolean; onRetry: () => void; onParamsChange: (params: ComponentListParams) => void }) {
  const rows = page?.data ?? [];
  if (isPending) return <ComponentsSkeleton />;
  if (isError) return <Alert><AlertCircleIcon aria-hidden="true" /><AlertTitle>No pudimos cargar los componentes</AlertTitle><AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><span>Reintentá la consulta sin perder los filtros actuales.</span><Button type="button" variant="outline" size="sm" onClick={onRetry}>Reintentar</Button></AlertDescription></Alert>;
  if (!rows.length) return <Empty><EmptyHeader><EmptyMedia variant="icon"><WrenchIcon aria-hidden="true" /></EmptyMedia><EmptyTitle>No hay componentes para mostrar</EmptyTitle><EmptyDescription>Probá con otros filtros o cargá el primer componente.</EmptyDescription></EmptyHeader><EmptyContent><ComponentFormDialog trigger={<Button type="button">Crear componente</Button>} /></EmptyContent></Empty>;
  return (
    <Card className="gap-0 p-0">
      <CardContent className="p-0">
        <div className="hidden md:block"><Table><TableHeader><TableRow><TableHead>Componente</TableHead><TableHead>Tipo</TableHead><TableHead>Marca</TableHead><TableHead>Vehículo</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader><TableBody>{rows.map((component) => <ComponentRow key={component.id} component={component} />)}</TableBody></Table></div>
        <div className="grid gap-3 p-4 md:hidden">{rows.map((component) => <ComponentMobileCard key={component.id} component={component} />)}</div>
      </CardContent>
      {page ? <AssetPagination label="componente" params={params} meta={page.meta} onParamsChange={onParamsChange} /> : null}
    </Card>
  );
}

function ComponentRow({ component }: { component: WorkshopComponent }) {
  const notePreview = extractPlainTextFromRichText(component.notes, 80);
  return <TableRow><TableCell className="font-medium"><Link href={`/components/${component.id}`} className="hover:underline">{displayName(component)}</Link>{notePreview ? <p className="text-sm font-normal text-muted-foreground">{notePreview}</p> : null}</TableCell><TableCell>{component.componentType?.name ?? "Sin tipo"}</TableCell><TableCell>{component.brand} · {component.reference}</TableCell><TableCell>{component.vehicleId ? <Link href={`/vehicles/${component.vehicleId}`} className="hover:underline">Ver vehículo</Link> : <Badge variant="outline">Sin vehículo</Badge>}</TableCell><TableCell className="text-right"><ComponentActions component={component} /></TableCell></TableRow>;
}

function ComponentMobileCard({ component }: { component: WorkshopComponent }) {
  const notePreview = extractPlainTextFromRichText(component.notes, 120);
  return <div className="rounded-2xl border p-4"><Link href={`/components/${component.id}`} className="font-medium hover:underline">{displayName(component)}</Link><p className="text-sm text-muted-foreground">{component.componentType?.name ?? "Sin tipo"} · {component.brand} · {component.reference}</p><p className="mt-2 text-sm text-muted-foreground">{component.vehicleId ? "Vinculado a vehículo" : "Sin vehículo vinculado"}</p><p className="mt-1 text-sm text-muted-foreground">{notePreview || "Sin notas"}</p><div className="mt-4 flex gap-2"><Button asChild variant="outline" size="sm"><Link href={`/components/${component.id}`}>Ver detalle</Link></Button><ComponentFormDialog component={component} trigger={<Button type="button" variant="ghost" size="sm">Editar</Button>} /></div></div>;
}

export function ComponentActions({ component }: { component: WorkshopComponent }) {
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Acciones de ${displayName(component)}`}><MoreHorizontalIcon aria-hidden="true" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem asChild><Link href={`/components/${component.id}`}>Ver detalle</Link></DropdownMenuItem><ComponentFormDialog component={component} trigger={<DropdownMenuItem onSelect={(event) => event.preventDefault()}>Editar componente</DropdownMenuItem>} /></DropdownMenuContent></DropdownMenu>;
}

export function displayName(component: WorkshopComponent) {
  return component.identifier ?? `${component.componentType?.name ?? "Componente"} ${component.reference}`;
}

function ComponentsSkeleton() {
  return <Card aria-label="Cargando componentes" role="status"><CardContent className="flex flex-col gap-3">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</CardContent></Card>;
}
