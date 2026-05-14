import { ShieldCheckIcon } from "lucide-react";
import Image from "next/image";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const loginVisualSrc = "/login-visual-diesel-admin.png";

export function AuthCardShell({
  title,
  description,
  headline = "Gestioná el acceso a Mecanismos Técnicos.",
  supportingText = "Completá los datos solicitados para continuar.",
  children,
}: {
  title: string;
  description: string;
  headline?: string;
  supportingText?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-background md:grid md:grid-cols-2">
      <Image
        src={loginVisualSrc}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-left md:hidden"
      />
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[1px] md:hidden" />

      <section className="relative hidden min-h-dvh overflow-hidden bg-card md:block">
        <Image
          src={loginVisualSrc}
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/10 to-foreground/35" />
      </section>

      <section className="relative z-10 flex min-h-dvh items-center justify-center px-4 py-6 sm:px-6 lg:px-12">
        <Card className="w-full max-w-md bg-card/95 shadow-xl backdrop-blur md:bg-card md:shadow-sm">
          <CardHeader className="gap-5">
            <div className="flex flex-col gap-5 text-pretty">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <ShieldCheckIcon aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium tracking-[0.28em] text-muted-foreground uppercase">
                  Mecanismos Técnicos
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {headline}
                </h1>
                <p className="text-base leading-7 text-muted-foreground">
                  {supportingText}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </section>
    </main>
  );
}
