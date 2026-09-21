import { redirect } from "next/navigation";
import { Phone } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { PhoneForm } from "@/components/phone-form";
import { safeCallbackUrl } from "@/lib/auth/callback-url";

export const dynamic = "force-dynamic";

export default async function PhoneOnboardingPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}>) {
  const { callbackUrl } = await searchParams;
  const redirectTo = safeCallbackUrl(callbackUrl);

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(redirectTo)}`);
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true },
  });
  if (user?.phone) redirect(redirectTo);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-border bg-card/70 p-8 shadow-xl backdrop-blur sm:p-10">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/30">
            <Phone className="h-7 w-7 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              One last step
            </h1>
            <p className="text-sm text-muted-foreground">
              Add your phone number so your team can reach you about shifts.
            </p>
          </div>
        </div>

        <PhoneForm redirectTo={redirectTo} submitLabel="Continue" />
      </div>
    </div>
  );
}
