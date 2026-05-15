"use client";

import Link from "next/link";
import { Children } from "react";
import {
  AlertCircleIcon,
  CarFrontIcon,
  ClipboardListIcon,
  HistoryIcon,
  MailIcon,
  PhoneIcon,
  WrenchIcon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RichTextViewer } from "@/components/rich-text/rich-text-viewer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomerFormDialog } from "@/features/customers/customer-form-dialog";
import { CustomerStatusBadge } from "@/features/customers/customers-columns";
import { ComponentFormDialog } from "@/features/components/component-form-dialog";
import { displayName } from "@/features/components/components-table";
import { VehicleFormDialog } from "@/features/vehicles/vehicle-form-dialog";
import { useComponentsQuery } from "@/hooks/use-components";
import { useCustomerQuery } from "@/hooks/use-customers";
import { useVehiclesQuery } from "@/hooks/use-vehicles";
import type { WorkshopComponent } from "@/lib/components/types";
import type { Customer } from "@/lib/customers/types";
import { extractPlainTextFromRichText } from "@/lib/rich-text";
import type { Vehicle } from "@/lib/vehicles/types";

export function CustomerDetailPage({ customerId }: { customerId: string }) {
  const query = useCustomerQuery(customerId);

  if (query.isPending) {
    return (
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <Skeleton className="h-36 w-full" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </main>
    );
  }

  if (query.isError || !query.data) {
    return (
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <Alert>
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>No pudimos cargar el cliente</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>El cliente no existe o no está disponible en este momento.</span>
            <Button asChild variant="outline" size="sm">
              <Link href="/customers">Volver a clientes</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  return <CustomerDetail customer={query.data} />;
}

function CustomerDetail({ customer }: { customer: Customer }) {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{customer.name}</CardTitle>
          <CardDescription>{customer.documentNumber}</CardDescription>
          <CardAction className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/customers">Volver</Link>
            </Button>
            <CustomerFormDialog
              customer={customer}
              trigger={<Button type="button">Editar</Button>}
            />
          </CardAction>
        </CardHeader>
        <CardContent>
          <CustomerStatusBadge status={customer.status} />
          <div className="mt-4 rounded-xl bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Notas</p>
            <RichTextViewer value={customer.notes} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard title="Contacto" description="Canales disponibles para coordinar trabajos.">
          <InfoRow icon={<MailIcon aria-hidden="true" />} label="Email" value={customer.email ?? "Sin email"} />
          <InfoRow icon={<PhoneIcon aria-hidden="true" />} label="Teléfono" value={customer.phone ?? "Sin teléfono"} />
        </InfoCard>
        <InfoCard title="Datos comerciales" description="Información base para órdenes y facturación.">
          <InfoRow label="Documento" value={customer.documentNumber} />
          <InfoRow label="Tipo de documento" value={customer.documentType} />
        </InfoCard>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Secciones relacionadas">
        <CustomerVehiclesPreview customerId={customer.id} />
        <CustomerComponentsPreview customerId={customer.id} />
        <PlaceholderCard icon={<ClipboardListIcon aria-hidden="true" />} title="Órdenes" />
        <PlaceholderCard icon={<HistoryIcon aria-hidden="true" />} title="Historial" />
      </section>
    </main>
  );
}

function InfoCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">{children}</CardContent>
    </Card>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
      {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-medium">{value}</p>
      </div>
    </div>
  );
}

function PlaceholderCard({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Empty className="min-h-48 border bg-card p-6">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>Próximamente vas a ver esta información relacionada.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function CustomerVehiclesPreview({ customerId }: { customerId: string }) {
  const query = useVehiclesQuery({ customerId, page: 1, limit: 5 });

  return (
    <RelatedCard
      title="Vehículos"
      description="Últimos vehículos asociados al cliente."
      action={<VehicleFormDialog initialCustomerId={customerId} trigger={<Button type="button" size="sm">Crear</Button>} />}
      isPending={query.isPending}
      isError={query.isError}
      emptyIcon={<CarFrontIcon aria-hidden="true" />}
      emptyTitle="Sin vehículos"
      emptyDescription="Cargá el primer vehículo de este cliente."
      onRetry={() => void query.refetch()}
    >
      {(query.data?.data ?? []).map((vehicle) => (
        <VehiclePreviewRow key={vehicle.id} vehicle={vehicle} />
      ))}
    </RelatedCard>
  );
}

function CustomerComponentsPreview({ customerId }: { customerId: string }) {
  const query = useComponentsQuery({ customerId, page: 1, limit: 5 });

  return (
    <RelatedCard
      title="Componentes"
      description="Componentes y repuestos asociados al cliente."
      action={<ComponentFormDialog initialCustomerId={customerId} trigger={<Button type="button" size="sm">Crear</Button>} />}
      isPending={query.isPending}
      isError={query.isError}
      emptyIcon={<WrenchIcon aria-hidden="true" />}
      emptyTitle="Sin componentes"
      emptyDescription="Cargá el primer componente de este cliente."
      onRetry={() => void query.refetch()}
    >
      {(query.data?.data ?? []).map((component) => (
        <ComponentPreviewRow key={component.id} component={component} />
      ))}
    </RelatedCard>
  );
}

function RelatedCard({
  title,
  description,
  action,
  isPending,
  isError,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  onRetry,
  children,
}: {
  title: string;
  description: string;
  action: React.ReactNode;
  isPending: boolean;
  isError: boolean;
  emptyIcon: React.ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  onRetry: () => void;
  children: React.ReactNode;
}) {
  const childArray = Children.toArray(children);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>{action}</CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isPending ? (
          Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)
        ) : isError ? (
          <Alert>
            <AlertCircleIcon aria-hidden="true" />
            <AlertTitle>No pudimos cargar {title.toLowerCase()}</AlertTitle>
            <AlertDescription>
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>Reintentar</Button>
            </AlertDescription>
          </Alert>
        ) : childArray.length ? (
          childArray
        ) : (
          <Empty className="min-h-40 border bg-card p-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">{emptyIcon}</EmptyMedia>
              <EmptyTitle>{emptyTitle}</EmptyTitle>
              <EmptyDescription>{emptyDescription}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}

function VehiclePreviewRow({ vehicle }: { vehicle: Vehicle }) {
  const notePreview = extractPlainTextFromRichText(vehicle.notes, 80);
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3">
      <div className="min-w-0">
        <Link href={`/vehicles/${vehicle.id}`} className="truncate font-medium underline-offset-4 hover:underline">{vehicle.plate}</Link>
        <p className="truncate text-sm text-muted-foreground">{vehicle.brand} · {vehicle.modelReference}</p>
        {notePreview ? <p className="truncate text-sm text-muted-foreground">{notePreview}</p> : null}
      </div>
      <VehicleFormDialog vehicle={vehicle} trigger={<Button type="button" variant="ghost" size="sm">Editar</Button>} />
    </div>
  );
}

function ComponentPreviewRow({ component }: { component: WorkshopComponent }) {
  const notePreview = extractPlainTextFromRichText(component.notes, 80);
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3">
      <div className="min-w-0">
        <Link href={`/components/${component.id}`} className="truncate font-medium underline-offset-4 hover:underline">{displayName(component)}</Link>
        <p className="truncate text-sm text-muted-foreground">{component.componentType?.name ?? "Sin tipo"} · {component.brand}</p>
        {notePreview ? <p className="truncate text-sm text-muted-foreground">{notePreview}</p> : null}
      </div>
      <ComponentFormDialog component={component} trigger={<Button type="button" variant="ghost" size="sm">Editar</Button>} />
    </div>
  );
}
