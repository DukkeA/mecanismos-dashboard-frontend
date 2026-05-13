"use client";

import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useLogoutMutation } from "@/hooks/use-auth";

export function LogoutButton() {
  const router = useRouter();
  const logout = useLogoutMutation();

  async function onLogout() {
    await logout.mutateAsync();
    router.replace("/login");
  }

  return (
    <Button variant="outline" onClick={onLogout} disabled={logout.isPending}>
      {logout.isPending ? (
        <Spinner data-icon="inline-start" />
      ) : (
        <LogOutIcon data-icon="inline-start" aria-hidden="true" />
      )}
      Salir
    </Button>
  );
}
