import Link from "next/link";
import { ArrowLeftIcon, RouteOffIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function AppNotFound() {
  return (
    <main className="flex flex-1 p-4 sm:p-6">
      <Empty className="min-h-[calc(100dvh-var(--header-height)-2rem)] border bg-card/40 sm:min-h-[calc(100dvh-var(--header-height)-3rem)]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RouteOffIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Ruta no encontrada</EmptyTitle>
          <EmptyDescription>
            Esta pantalla no existe o todavía no forma parte del dashboard. Volvé
            al inicio operativo para seguir trabajando sin perder contexto.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/dashboard">
              <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
              Volver al dashboard
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
