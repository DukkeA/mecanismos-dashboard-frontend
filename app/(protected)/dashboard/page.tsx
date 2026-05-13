import {
  ClipboardListIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  WrenchIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const summary = [
  {
    title: "Órdenes activas",
    value: "—",
    description: "Listo para conectar al módulo operativo.",
    icon: ClipboardListIcon,
  },
  {
    title: "Taller protegido",
    value: "Protegido",
    description: "Esta vista solo renderiza después de verificar /auth/me.",
    icon: WrenchIcon,
  },
  {
    title: "Crecimiento",
    value: "—",
    description: "Reportes y métricas operativas entran en la próxima etapa.",
    icon: TrendingUpIcon,
  },
];

export default function DashboardPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex max-w-2xl flex-col gap-2">
            <Badge className="w-fit" variant="secondary">
              Dashboard
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Operación de Mecanismos
            </h1>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              Base protegida para órdenes, clientes, vehículos y taller. El
              sidebar ya refleja la estructura operativa que vamos a ir
              completando módulo por módulo.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            <ShieldCheckIcon aria-hidden="true" />
            Sesión validada por backend
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {summary.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.title}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Icon aria-hidden="true" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tracking-tight">{item.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </main>
  );
}
