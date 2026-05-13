import { ClipboardListIcon, WrenchIcon } from "lucide-react";

import { RecoveryOnboarding } from "@/components/auth/recovery-onboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const summary = [
  {
    title: "Órdenes activas",
    value: "—",
    description: "Listo para conectar al módulo operativo.",
    icon: ClipboardListIcon,
  },
  {
    title: "Taller",
    value: "Protegido",
    description: "Esta vista solo renderiza después de verificar /auth/me.",
    icon: WrenchIcon,
  },
];

export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <RecoveryOnboarding enabled />

      <section className="grid gap-4 md:grid-cols-2">
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
