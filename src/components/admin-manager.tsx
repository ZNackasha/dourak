"use client";

import { addAdminAction, removeAdminAction } from "@/app/actions/admin";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trash2, UserPlus, X } from "lucide-react";

export function AdminManager({ scheduleId, admins, ownerId }: { scheduleId: string, admins: any[], ownerId: string }) {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-lg">Schedule Admins</CardTitle>
          <CardDescription>Manage who can edit this schedule</CardDescription>
        </div>
        <Button
          variant={isAdding ? "outline" : "default"}
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? (
            <>
              <X className="w-4 h-4 mr-1" /> Cancel
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-1" /> Add Admin
            </>
          )}
        </Button>
      </CardHeader>

      {isAdding && (
        <CardContent className="pb-4 bg-muted/50 pt-4 border-t border-b">
          <form
            action={async (formData) => {
              await addAdminAction(formData);
              setIsAdding(false);
            }}
            className="flex gap-2"
          >
            <input type="hidden" name="scheduleId" value={scheduleId} />
            <Input
              name="email"
              type="email"
              placeholder="admin@example.com"
              required
              className="bg-background"
            />
            <Button type="submit" size="sm">Add</Button>
          </form>
        </CardContent>
      )}

      <CardContent className={`px-0 ${!isAdding ? "pt-0" : "pt-4"}`}>
        <ul className="divide-y">
          {admins.map((admin) => (
            <li key={admin.userId} className="p-4 flex justify-between items-center hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-indigo-100 text-indigo-600 font-bold">
                    {admin.user.name?.[0] || admin.user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{admin.user.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{admin.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {admin.userId !== ownerId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeAdminAction(scheduleId, admin.userId)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Remove
                  </Button>
                )}
                {admin.userId === ownerId && (
                  <Badge variant="secondary">Owner</Badge>
                )}
              </div>
            </li>
          ))}
          {admins.length === 0 && (
            <li className="p-8 text-center text-muted-foreground text-sm">
              No additional admins. Only the owner can manage this schedule.
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}