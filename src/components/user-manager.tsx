"use client";

import { useState } from "react";
import { updateUserRoles } from "@/app/actions/user";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, UserCog, Check, X } from "lucide-react";

type Role = {
  id: string;
  name: string;
  color: string | null;
};

type UserRole = {
  roleId: string;
  role: Role;
};

type User = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  roles: UserRole[];
  isOwner: boolean;
  isAdmin: boolean;
};

export function UserManager({
  scheduleId,
  initialUsers,
  availableRoles,
}: {
  scheduleId: string;
  initialUsers: User[];
  availableRoles: Role[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const startEditing = (user: User) => {
    setEditingUserId(user.id);
    setSelectedRoleIds(new Set(user.roles.map((r) => r.roleId)));
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setSelectedRoleIds(new Set());
  };

  const toggleRole = (roleId: string) => {
    const newSet = new Set(selectedRoleIds);
    if (newSet.has(roleId)) {
      newSet.delete(roleId);
    } else {
      newSet.add(roleId);
    }
    setSelectedRoleIds(newSet);
  };

  const saveRoles = async () => {
    if (!editingUserId) return;

    setIsSaving(true);
    try {
      await updateUserRoles(scheduleId, editingUserId, Array.from(selectedRoleIds));

      // Optimistic update
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === editingUserId) {
            return {
              ...u,
              roles: availableRoles
                .filter((r) => selectedRoleIds.has(r.id))
                .map((r) => ({ roleId: r.id, role: r })),
            };
          }
          return u;
        })
      );

      setEditingUserId(null);
      router.refresh();
      toast.success("Roles updated successfully");
    } catch (error) {
      console.error("Failed to update roles", error);
      toast.error("Failed to update roles");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <ul className="divide-y">
          {users.map((user) => (
            <li key={user.id} className="p-4 sm:p-6 hover:bg-muted/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                    <AvatarFallback className="bg-indigo-100 text-indigo-600 font-medium">
                      {user.name?.[0] || user.email?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-sm font-medium">
                      {user.name || "Unknown Name"}
                      {user.isOwner && (
                        <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                          Owner
                        </Badge>
                      )}
                      {user.isAdmin && !user.isOwner && (
                        <Badge variant="secondary" className="ml-2">
                          Admin
                        </Badge>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                {editingUserId !== user.id && (
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    <div className="flex flex-wrap gap-1.5">
                      {user.roles.length > 0 ? (
                        user.roles.map((ur) => (
                          <Badge
                            key={ur.roleId}
                            variant="outline"
                            className="text-xs"
                            style={{
                              backgroundColor: ur.role.color ? `${ur.role.color}15` : "transparent",
                              borderColor: ur.role.color || "currentColor",
                              color: ur.role.color || "currentColor"
                            }}
                          >
                            {ur.role.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No roles</span>
                      )}
                    </div>
                    {!user.isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(user)}
                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                      >
                        <UserCog className="w-4 h-4 mr-2" />
                        Edit Roles
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {editingUserId === user.id && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium mb-3 text-foreground">
                    Assign Roles for {user.name?.split(" ")[0] || "User"}
                  </h4>
                  {availableRoles.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                      {availableRoles.map((role) => (
                        <div
                          key={role.id}
                          className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                            selectedRoleIds.has(role.id) ? "bg-muted/50 border-primary" : "bg-card border-border hover:bg-muted"
                          }`}
                        >
                          <Checkbox
                            id={`role-${role.id}`}
                            checked={selectedRoleIds.has(role.id)}
                            onCheckedChange={() => toggleRole(role.id)}
                            className="mt-0.5"
                          />
                          <div className="flex flex-col flex-1">
                            <Label
                              htmlFor={`role-${role.id}`}
                              className="text-sm font-medium cursor-pointer flex items-center gap-2"
                            >
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: role.color || "#e4e4e7" }}
                              ></span>
                              {role.name}
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-muted text-muted-foreground text-sm rounded-lg mb-4">
                      No roles available. Create roles first before assigning them to users.
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelEditing}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveRoles}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" /> Save Roles
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {users.length === 0 && (
            <li className="p-8 text-center text-muted-foreground text-sm">
              No users found. Users will appear here when they access the plan or when imported.
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
