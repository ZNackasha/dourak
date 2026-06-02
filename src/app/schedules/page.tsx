import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SchedulesPage() {
  const session = await auth();
  if (!session?.user?.id) return <div>Please login</div>;

  const schedules = await db.schedule.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Schedules</h1>
          <p className="mt-1 text-muted-foreground">Manage your service rotations and events.</p>
        </div>
        <Button render={<Link href="/schedules/new" />}>
          Create New
        </Button>
      </div>

      <div className="grid gap-4">
        {schedules.map((schedule, idx) => (
          <Link
            key={schedule.id}
            href={`/schedules/${schedule.id}`}
            style={{ animationDelay: `${idx * 60}ms` }}
            className="block p-6 bg-card rounded-xl border border-border hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all group animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {schedule.name}
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Manage plans and roles
                </p>
              </div>
              <span className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
        {schedules.length === 0 && (
          <div className="text-center py-12 bg-card rounded-xl border border-dashed border-border">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-foreground font-medium">No schedules found</h3>
            <p className="text-muted-foreground text-sm mt-1">Create a new schedule to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
