"use client";

import { deleteScheduleAction } from "@/app/actions/schedule";
import { useState } from "react";
import { toast } from "sonner";

export function DeleteScheduleButton({ scheduleId }: { scheduleId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    toast("Are you sure you want to delete this schedule? This action cannot be undone.", {
      action: {
        label: "Delete",
        onClick: async () => {
          setIsDeleting(true);
          try {
            await deleteScheduleAction(scheduleId);
            toast.success("Schedule deleted");
          } catch (error) {
            console.error("Failed to delete schedule:", error);
            toast.error("Failed to delete schedule");
            setIsDeleting(false);
          }
        }
      },
      cancel: {
        label: "Cancel",
        onClick: () => {}
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-700 text-sm font-medium hover:bg-red-50 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
    >
      {isDeleting ? "Deleting..." : "Delete Schedule"}
    </button>
  );
}
