"use client";

import { createPlanAction } from "@/app/actions/schedule";
import { useFormStatus } from "react-dom";
import { useEffect, useActionState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? "Creating..." : "Create Plan"}
    </Button>
  );
}

export function CreatePlanForm({ scheduleId }: { scheduleId: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(createPlanAction, null);

  useEffect(() => {
    if (state?.success && state.planId) {
      toast.success(state.message);
      router.push(`/schedules/${scheduleId}/plans/${state.planId}/admin`);
      return;
    }

    if (state?.message && state.error) {
      toast.error(state.message, {
        description: state.error,
        duration: 5000,
      });
    }
  }, [state, router, scheduleId]);

  return (
    <div className="space-y-6">
      <form
        action={(formData) => {
          formAction(formData);
        }}
        className="space-y-6"
      >
        <input type="hidden" name="scheduleId" value={scheduleId} />

        {state?.message && state.error && (
          <Alert variant="destructive">
            <AlertTitle>{state.message}</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <Label htmlFor="name">Plan Name</Label>
          <Input
            type="text"
            name="name"
            id="name"
            required
            placeholder="e.g. December 2025"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="startDate">Start Date</Label>
            <Input type="date" name="startDate" id="startDate" required />
          </div>

          <div className="space-y-3">
            <Label htmlFor="endDate">End Date</Label>
            <Input type="date" name="endDate" id="endDate" required />
          </div>
        </div>

        <p className="text-[0.8rem] text-muted-foreground">
          After creating the plan you can add events yourself, or import them
          from a linked Google Calendar.
        </p>

        <div className="pt-4 flex justify-end gap-3">
          <Button
            variant="outline"
            render={<Link href={`/schedules/${scheduleId}`} />}
          >
            Cancel
          </Button>
          <SubmitButton />
        </div>

      </form>
    </div>
  );
}
