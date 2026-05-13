"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheckIcon,
  ChevronsUpDownIcon,
  KeyRoundIcon,
  LogOutIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { ChangePasswordDialog } from "@/components/auth/change-password-dialog";
import { RecoveryPhraseDialog } from "@/components/auth/recovery-phrase-dialog";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { useLogoutMutation } from "@/hooks/use-auth";
import type { AuthUser } from "@/lib/auth/types";

export function NavUser({
  user,
}: {
  user: AuthUser;
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const logout = useLogoutMutation();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const initials = getInitials(user.name || user.email);

  async function onLogout() {
    await logout.mutateAsync();
    router.replace("/login");
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <ChevronsUpDownIcon className="ml-auto" aria-hidden="true" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  <Badge variant="secondary">{user.role}</Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem disabled>
                  <BadgeCheckIcon aria-hidden="true" />
                  Mi cuenta
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setPasswordOpen(true)}>
                  <KeyRoundIcon aria-hidden="true" />
                  Cambiar contraseña
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setRecoveryOpen(true)}>
                  <ShieldCheckIcon aria-hidden="true" />
                  Frase de recuperación
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={logout.isPending}
                onSelect={(event) => {
                  event.preventDefault();
                  void onLogout();
                }}
                variant="destructive"
              >
                {logout.isPending ? (
                  <Spinner aria-hidden="true" />
                ) : (
                  <LogOutIcon aria-hidden="true" />
                )}
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
      <RecoveryPhraseDialog open={recoveryOpen} onOpenChange={setRecoveryOpen} />
    </>
  );
}

function getInitials(value: string) {
  const [first = "", second = ""] = value.trim().split(/\s+/);
  return `${first.at(0) ?? "M"}${second.at(0) ?? ""}`.toUpperCase();
}
