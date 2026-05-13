"use client";

import { usePathname } from "next/navigation";

import { SearchForm } from "@/components/search-form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const breadcrumbLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/orders": "Órdenes",
  "/customers": "Clientes",
  "/vehicles": "Vehículos",
  "/workshop": "Taller",
  "/calendar": "Calendario",
  "/reports": "Reportes",
  "/settings": "Configuración",
};

export function SiteHeader() {
  const pathname = usePathname();
  const currentPage = breadcrumbLabels[pathname] ?? "Ruta no encontrada";

  return (
    <header className="sticky top-0 z-50 flex w-full items-center border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <Breadcrumb className="hidden md:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Mecanismos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{currentPage}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <SearchForm className="ml-auto hidden w-full sm:flex sm:w-auto" />
      </div>
    </header>
  );
}
