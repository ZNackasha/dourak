"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createEventAction,
  importGoogleEventsAction,
} from "@/app/actions/schedule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarPlus, DownloadCloud, Loader2, X } from "lucide-react";

export function PlanEventTools({
  planId,
  scheduleId,
  canImportGoogle,
}: {
  planId: string;
  scheduleId: string;
  canImportGoogle: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  async function handleCreate(formData: FormData) {
    formData.set("planId", planId);
    formData.set("scheduleId", scheduleId);
    setSaving(true);
    try {
      await createEventAction(formData);
      toast.success("Event added");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add event",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleImport() {
    setImporting(true);
    try {
      const result = await importGoogleEventsAction(planId, scheduleId);
      if (result?.success) {
        toast.success(result.message ?? "Imported");
        router.refresh();
      } else {
        toast.error(result?.message ?? "Import failed", {
          description: result?.error,
        });
      }
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setOpen((v) => !v)} size="sm">
          {open ? (
            <>
              <X className="w-4 h-4 mr-1" /> Close
            </>
          ) : (
            <>
              <CalendarPlus className="w-4 h-4 mr-1" /> Add Event
            </>
          )}
        </Button>

        {canImportGoogle && (
          <Button
            onClick={handleImport}
            disabled={importing}
            variant="outline"
            size="sm"
          >
            {importing ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <DownloadCloud className="w-4 h-4 mr-1" />
            )}
            Import from Google
          </Button>
        )}
      </div>

      {open && (
        <Card className="mt-3">
          <CardContent className="pt-6">
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event-title">Title</Label>
                <Input
                  id="event-title"
                  name="title"
                  required
                  placeholder="e.g. Sunday Morning Service"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event-start">Starts</Label>
                  <Input
                    id="event-start"
                    name="start"
                    type="datetime-local"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-end">Ends</Label>
                  <Input
                    id="event-end"
                    name="end"
                    type="datetime-local"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-needed">Volunteers needed</Label>
                <Input
                  id="event-needed"
                  name="needed"
                  type="number"
                  min={1}
                  defaultValue={1}
                  className="w-28"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  Add Event
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
