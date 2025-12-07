"use client";

import { deleteScheduleAction } from "@/app/actions/schedule";
import { useState } from "react";

export function DeleteScheduleButton({ scheduleId }: { scheduleId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this schedule? This action cannot be undone.")) {
      setIsDeleting(true);
      try {
        await deleteScheduleAction(scheduleId);
      } catch (error) {
        console.error("Failed to delete schedule:", error);
        alert("Failed to delete schedule");
        setIsDeleting(false);
      }
    }
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
