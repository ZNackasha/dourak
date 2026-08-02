"use client";

import { createRoleAction, addUserToRoleAction, removeUserFromRoleAction, updateRoleAction, regenerateRoleInviteTokenAction } from "@/app/actions/role";
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Plus, Users, Trash2, Edit2, Key, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function RoleManager({ roles, scheduleId }: { roles: any[], scheduleId: string }) {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Left Column: Role List & Create */}
      <div className="md:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create Role</CardTitle>
            <CardDescription>Add a new role to this schedule.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createRoleAction} className="space-y-4">
              <input type="hidden" name="scheduleId" value={scheduleId} />
              <div className="space-y-2">
                <Label htmlFor="name">Role Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. Guitarist"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color Label</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="color"
                    name="color"
                    type="color"
                    className="h-10 w-20 p-1 cursor-pointer"
                    defaultValue="#4F46E5"
                  />
                  <span className="text-xs text-muted-foreground">Pick a color for the badge</span>
                </div>
              </div>
              <Button type="submit" className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add Role
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">Existing Roles</h3>
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRoleId(role.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all duration-200 flex items-center justify-between group ${selectedRoleId === role.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                  : "border-border bg-card hover:border-primary/50 hover:shadow-sm"
                }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full ring-1 ring-black/5"
                  style={{ backgroundColor: role.color || "#ccc" }}
                />
                <span className={`font-medium ${selectedRoleId === role.id ? 'text-primary' : 'text-foreground'}`}>
                  {role.name}
                </span>
              </div>
              <Badge variant={selectedRoleId === role.id ? "default" : "secondary"}>
                {role.users.length}
              </Badge>
            </button>
          ))}
          {roles.length === 0 && (
            <div className="text-center p-4 text-sm text-muted-foreground border rounded-lg border-dashed">
              No roles created yet.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Role Details & Members */}
      <div className="md:col-span-2">
        {selectedRoleId ? (
          <RoleDetails role={roles.find((r) => r.id === selectedRoleId)} />
        ) : (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/30">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-muted-foreground/60" />
            </div>
            <p className="font-medium">Select a role to manage users</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RoleDetails({ role }: { role: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  if (!role) return null;

  return (
    <Card className="overflow-hidden">
      <div className="p-6 border-b bg-muted/30">
        {isEditing ? (
          <form
            action={async (formData) => {
              await updateRoleAction(formData);
              setIsEditing(false);
            }}
            className="flex flex-wrap items-center gap-3"
          >
            <input type="hidden" name="roleId" value={role.id} />
            <Input
              name="name"
              defaultValue={role.name}
              className="max-w-[200px] bg-background"
              required
            />
            <Input
              name="color"
              type="color"
              defaultValue={role.color || "#cccccc"}
              className="w-12 h-10 p-1 cursor-pointer bg-background"
            />
            <Button type="submit" size="sm">Save</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
          </form>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded-md shadow-sm"
                style={{ backgroundColor: role.color || "#cccccc" }}
              />
              <div>
                <h2 className="text-xl font-bold">{role.name}</h2>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 className="w-4 h-4 mr-2" /> Edit
            </Button>
          </div>
        )}
      </div>

      <div className="p-6 space-y-8">
        {/* Invite Link Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-primary" />
            Invite Link
          </h3>
          <Card className="bg-muted/50 border-none shadow-none">
            <CardContent className="p-4">
              {role.inviteToken && origin ? (
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="bg-white p-2 rounded-lg border shadow-sm w-fit">
                    <QRCodeSVG
                      value={`${origin}/invites/${role.inviteToken}`}
                      size={100}
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Share this link or QR code with users. When they visit it, they will be automatically added to the <strong>{role.name}</strong> role.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={`${origin}/invites/${role.inviteToken}`}
                        className="flex-1 bg-background"
                      />
                      <Button
                        variant="secondary"
                        onClick={() => {
                          navigator.clipboard.writeText(`${origin}/invites/${role.inviteToken}`);
                        }}
                      >
                        <Copy className="w-4 h-4 mr-2" /> Copy
                      </Button>
                    </div>
                    <Button
                      variant="link"
                      className="px-0 h-auto text-xs text-muted-foreground"
                      onClick={() => regenerateRoleInviteTokenAction(role.id)}
                    >
                      Reset Invite Link
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    {role.inviteToken ? "Loading invite link..." : "No invite link generated for this role."}
                  </p>
                  {!role.inviteToken && (
                    <Button
                      onClick={() => regenerateRoleInviteTokenAction(role.id)}
                    >
                      <Key className="w-4 h-4 mr-2" /> Generate Invite Link
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add User Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            Add User
          </h3>
          <form action={addUserToRoleAction} className="flex gap-3">
            <input type="hidden" name="roleId" value={role.id} />
            <Input
              name="email"
              type="email"
              placeholder="user@example.com"
              required
              className="flex-1"
            />
            <Button type="submit">
              Add Member
            </Button>
          </form>
        </div>

        {/* Assigned Volunteers Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Assigned Volunteers
            </h3>
            <Badge variant="secondary">{role.users.length} members</Badge>
          </div>

          {role.users.length === 0 ? (
            <div className="text-center py-8 rounded-lg border border-dashed text-muted-foreground text-sm">
              No volunteers assigned to this role yet.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <ul className="divide-y">
                {role.users.map((ur: any) => (
                  <li key={ur.userId} className="p-3 flex justify-between items-center hover:bg-muted/50 transition-colors bg-card">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={ur.user.image} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {ur.user.name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{ur.user.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{ur.user.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeUserFromRoleAction(ur.userId, role.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
