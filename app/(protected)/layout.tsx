import { Suspense } from "react";

import {
  ProtectedShell,
  ProtectedShellSkeleton,
} from "@/components/auth/protected-shell";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ProtectedShellSkeleton />}>
      <ProtectedShell>{children}</ProtectedShell>
    </Suspense>
  );
}
