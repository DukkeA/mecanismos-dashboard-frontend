"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

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
  "/components": "Componentes",
  "/workshop": "Taller",
  "/calendar": "Calendario",
  "/reports": "Reportes",
  "/settings": "Configuración",
};

function getBreadcrumbs(pathname: string) {
  if (pathname.startsWith("/customers/")) {
    return [{ label: "Clientes", href: "/customers" }, { label: "Detalle" }];
  }

  if (pathname.startsWith("/vehicles/")) {
    return [{ label: "Vehículos", href: "/vehicles" }, { label: "Detalle" }];
  }

  if (pathname.startsWith("/components/")) {
    return [{ label: "Componentes", href: "/components" }, { label: "Detalle" }];
  }

  return [{ label: breadcrumbLabels[pathname] ?? "Ruta no encontrada" }];
}

export function SiteHeader() {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

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
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Mecanismos</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {breadcrumbs.map((breadcrumb, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <Fragment key={breadcrumb.label}>
                  {index > 0 ? <BreadcrumbSeparator /> : null}
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={breadcrumb.href ?? "/dashboard"}>{breadcrumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <SearchForm className="ml-auto hidden w-full sm:flex sm:w-auto" />
      </div>
    </header>
  );
}
