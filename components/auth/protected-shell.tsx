"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { useMeQuery } from "@/hooks/use-auth";
import { sanitizeNextPath } from "@/lib/auth/backend";

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const me = useMeQuery();
  const user = me.data;

  const search = searchParams.toString();
  const currentPath = `${pathname}${search ? `?${search}` : ""}`;

  useEffect(() => {
    if (me.isPending) return;

    if (me.isError) {
      router.replace(`/login?next=${encodeURIComponent(sanitizeNextPath(currentPath))}`);
      return;
    }

    if (user?.mustChangePassword && pathname !== "/change-password") {
      router.replace("/change-password");
    }
  }, [currentPath, me.isError, me.isPending, pathname, router, user]);

  if (me.isPending || me.isError || !user || user.mustChangePassword) {
    return <ProtectedShellSkeleton />;
  }

  return (
    <div className="min-h-dvh bg-background [--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex min-h-dvh flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar user={user} />
          <SidebarInset>{children}</SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

export function ProtectedShellSkeleton() {
  return (
    <div className="min-h-dvh bg-background [--header-height:calc(--spacing(14))]">
      <header className="flex h-(--header-height) items-center gap-3 border-b px-4">
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="ml-auto hidden h-9 w-80 rounded-4xl sm:block" />
      </header>
      <div className="flex min-h-[calc(100dvh-var(--header-height))]">
        <aside className="hidden w-64 border-r p-3 md:flex md:flex-col md:gap-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-4/5 rounded-lg" />
          <Skeleton className="mt-auto h-14 w-full rounded-xl" />
        </aside>
        <main className="flex flex-1 flex-col gap-4 p-4">
          <p className="sr-only">Verificando sesión</p>
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </main>
      </div>
    </div>
  );
}
