"use client";

import { useState } from "react";
import { syncScheduleEventsAction } from "@/app/actions/schedule";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";

export function SyncScheduleButton({ scheduleId }: { scheduleId: string }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await syncScheduleEventsAction(scheduleId);
      router.refresh();
      toast.success("Schedule synced successfully");
    } catch (error) {
      console.error("Failed to sync schedule:", error);
      toast.error("Failed to sync schedule");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleSync}
      disabled={isSyncing}
    >
      {isSyncing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync Events
        </>
      )}
    </Button>
  );
}
