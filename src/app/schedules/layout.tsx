import type { ReactNode } from "react";
import { requirePhone } from "@/lib/auth/onboarding";

export default async function SchedulesLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requirePhone("/schedules");
  return <>{children}</>;
}
