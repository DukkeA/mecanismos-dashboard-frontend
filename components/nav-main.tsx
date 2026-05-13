"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { ChevronRightIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

type NavMainItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: string;
  disabled?: boolean;
  items?: {
    title: string;
    url: string;
    disabled?: boolean;
  }[];
};

export function NavMain({
  items,
}: {
  items: NavMainItem[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Principal</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(pathname, item.url);
            const hasActiveChild = item.items?.some((subItem) =>
              isActivePath(pathname, subItem.url),
            );

            return (
              <Collapsible key={item.title} asChild defaultOpen={isActive || hasActiveChild}>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild={!item.disabled}
                    disabled={item.disabled}
                    isActive={isActive || hasActiveChild}
                    tooltip={item.title}
                  >
                    {item.disabled ? (
                      <>
                        <Icon aria-hidden="true" />
                        <span>{item.title}</span>
                      </>
                    ) : (
                      <Link href={item.url}>
                        <Icon aria-hidden="true" />
                        <span>{item.title}</span>
                      </Link>
                    )}
                  </SidebarMenuButton>
                  {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
                  {item.items?.length ? (
                    <>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuAction className="data-[state=open]:rotate-90">
                          <ChevronRightIcon aria-hidden="true" />
                          <span className="sr-only">Abrir {item.title}</span>
                        </SidebarMenuAction>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                aria-disabled={subItem.disabled}
                                isActive={isActivePath(pathname, subItem.url)}
                              >
                                {subItem.disabled ? (
                                  <button type="button" disabled>
                                    <span>{subItem.title}</span>
                                  </button>
                                ) : (
                                  <Link href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                )}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </>
                  ) : null}
                </SidebarMenuItem>
              </Collapsible>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function isActivePath(pathname: string, url: string) {
  return (
    pathname === url ||
    (url !== "/dashboard" && pathname.startsWith(`${url}/`))
  );
}
