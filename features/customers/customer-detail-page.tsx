"use client";

import Link from "next/link";
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
import { useCustomerQuery } from "@/hooks/use-customers";
import type { Customer } from "@/lib/customers/types";

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
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard title="Contacto" description="Canales disponibles para coordinar trabajos.">
          <InfoRow icon={<MailIcon aria-hidden="true" />} label="Email" value={customer.email ?? "Sin email"} />
          <InfoRow icon={<PhoneIcon aria-hidden="true" />} label="Teléfono" value={customer.phone ?? "Sin teléfono"} />
        </InfoCard>
        <InfoCard title="Datos comerciales" description="Información base para órdenes y facturación.">
          <InfoRow label="Documento" value={customer.documentNumber} />
          <InfoRow label="Dirección" value={customer.address ?? "Sin dirección"} />
        </InfoCard>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Secciones relacionadas">
        <PlaceholderCard icon={<CarFrontIcon aria-hidden="true" />} title="Vehículos" />
        <PlaceholderCard icon={<WrenchIcon aria-hidden="true" />} title="Componentes" />
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
