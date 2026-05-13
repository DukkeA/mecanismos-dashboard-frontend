"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
    <div className="min-h-dvh bg-background">
      <header className="border-b bg-card/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Mecanismos Dashboard</p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">Hola, {user.name}</h1>
              <Badge variant="secondary">{user.role}</Badge>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>
      {children}
    </div>
  );
}

export function ProtectedShellSkeleton() {
  return (
    <main className="min-h-dvh bg-background px-4 py-6 sm:px-6 lg:px-8">
      <Card className="mx-auto w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Verificando sesión</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </CardContent>
      </Card>
    </main>
  );
}
