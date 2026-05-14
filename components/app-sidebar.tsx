"use client";

import Link from "next/link";
import {
  BarChart3Icon,
  BookOpenTextIcon,
  CalendarDaysIcon,
  CarFrontIcon,
  ClipboardListIcon,
  GaugeIcon,
  LifeBuoyIcon,
  Settings2Icon,
  ShieldCheckIcon,
  UsersRoundIcon,
  WrenchIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { AuthUser } from "@/lib/auth/types";

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: GaugeIcon,
  },
  {
    title: "Órdenes",
    url: "/orders",
    icon: ClipboardListIcon,
    items: [
      { title: "Activas", url: "/orders", disabled: true },
      { title: "Finalizadas", url: "/orders/completed", disabled: true },
      { title: "Crear orden", url: "/orders/new", disabled: true },
    ],
  },
  {
    title: "Taller",
    url: "/workshop",
    icon: WrenchIcon,
    items: [
      { title: "Agenda", url: "/workshop/schedule", disabled: true },
      { title: "Técnicos", url: "/workshop/technicians", disabled: true },
    ],
  },
];

const modules = [
  {
    name: "Clientes",
    url: "/customers",
    icon: UsersRoundIcon,
  },
  {
    name: "Vehículos",
    url: "/vehicles",
    icon: CarFrontIcon,
  },
  {
    name: "Componentes",
    url: "/components",
    icon: WrenchIcon,
  },
  {
    name: "Calendario",
    url: "/calendar",
    icon: CalendarDaysIcon,
    badge: "Próximo",
    disabled: true,
  },
  {
    name: "Reportes",
    url: "/reports",
    icon: BarChart3Icon,
    badge: "Próximo",
    disabled: true,
  },
];

const navSecondary = [
  {
    title: "Guía interna",
    url: "/docs",
    icon: BookOpenTextIcon,
    disabled: true,
  },
  {
    title: "Soporte",
    url: "/support",
    icon: LifeBuoyIcon,
    disabled: true,
  },
  {
    title: "Configuración",
    url: "/settings",
    icon: Settings2Icon,
    disabled: true,
  },
];

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: AuthUser }) {
  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      collapsible="icon"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground [&_svg]:size-4">
                  <ShieldCheckIcon aria-hidden="true" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Mecanismos</span>
                  <span className="truncate text-xs">Operación segura</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={modules} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
