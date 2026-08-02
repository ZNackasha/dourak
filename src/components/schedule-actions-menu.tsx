"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  syncScheduleEventsAction,
  deleteScheduleAction,
} from "@/app/actions/schedule";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  RefreshCw,
  Download,
  CalendarCog,
  Users,
  Tags,
  Trash2,
  Loader2,
} from "lucide-react";

function isRedirectError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export function ScheduleActionsMenu({
  scheduleId,
  isGoogleLinked,
}: {
  scheduleId: string;
  isGoogleLinked: boolean;
}) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncScheduleEventsAction(scheduleId);
      toast.success("Schedule synced");
      router.refresh();
    } catch {
      toast.error("Failed to sync schedule");
    } finally {
      setSyncing(false);
    }
  };

  const confirmDelete = () => {
    toast(
      "Delete this schedule? This permanently removes all its plans and events.",
      {
        action: {
          label: "Delete",
          onClick: async () => {
            try {
              await deleteScheduleAction(scheduleId);
            } catch (error) {
              // deleteScheduleAction redirects on success (throws NEXT_REDIRECT).
              if (isRedirectError(error)) throw error;
              toast.error("Failed to delete schedule");
            }
          },
        },
        cancel: { label: "Cancel", onClick: () => {} },
      },
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline">
            <MoreHorizontal className="w-4 h-4 mr-1" /> Actions
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-52">
        {isGoogleLinked ? (
          <>
            <DropdownMenuItem onClick={handleSync} disabled={syncing}>
              {syncing ? (
                <Loader2 className="animate-spin" />
              ) : (
                <RefreshCw />
              )}
              Sync events
            </DropdownMenuItem>
            <DropdownMenuItem
              render={
                <a href={`/schedules/${scheduleId}/events/export`} download />
              }
            >
              <Download />
              Export .ics
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem
            render={<Link href={`/schedules/${scheduleId}/calendar`} />}
          >
            <CalendarCog />
            Edit calendar
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          render={<Link href={`/schedules/${scheduleId}/users`} />}
        >
          <Users />
          Manage users
        </DropdownMenuItem>
        <DropdownMenuItem
          render={<Link href={`/schedules/${scheduleId}/roles`} />}
        >
          <Tags />
          Manage roles
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onClick={confirmDelete}>
          <Trash2 />
          Delete schedule
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
