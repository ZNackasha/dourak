import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SchedulesPage() {
  const session = await auth();
  if (!session?.user?.id) return <div>Please login</div>;

  const schedules = await db.schedule.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { admins: { some: { userId: session.user.id } } },
      ],
    },
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
          <div className="text-center py-12 px-6 bg-card rounded-xl border border-dashed border-border animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20 animate-float">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-foreground font-semibold text-lg">Let&apos;s set up your first schedule</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-md mx-auto">
              A schedule lets you coordinate volunteers for its events. Add
              events yourself, or optionally import them from a Google Calendar.
            </p>

            <ol className="grid gap-3 mt-6 max-w-md mx-auto text-left">
              {[
                { n: 1, title: "Create a schedule", desc: "Name it — a Google Calendar is optional." },
                { n: 2, title: "Add roles & users", desc: "Define what needs to be filled and invite people." },
                { n: 3, title: "Open a plan for recruitment", desc: "Add events, then volunteers sign up for the dates that work." },
              ].map((s) => (
                <li key={s.n} className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border border-border/60">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                    {s.n}
                  </span>
                  <div className="text-sm">
                    <div className="font-medium text-foreground">{s.title}</div>
                    <div className="text-muted-foreground text-xs">{s.desc}</div>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6">
              <Button render={<Link href="/schedules/new" />}>Create your first schedule</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
