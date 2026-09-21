"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updatePhoneAction } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PhoneForm({
  initial,
  redirectTo,
  submitLabel = "Save",
}: Readonly<{
  initial?: string | null;
  redirectTo?: string;
  submitLabel?: string;
}>) {
  const [phone, setPhone] = useState(initial ?? "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updatePhoneAction(phone);
      toast.success("Phone number saved");
      if (redirectTo) {
        router.replace(redirectTo);
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Couldn't save your phone number",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          placeholder="+1 555 123 4567"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Organizers use this to reach you about shifts.
        </p>
      </div>
      <Button type="submit" disabled={saving} className="w-full">
        {saving ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
