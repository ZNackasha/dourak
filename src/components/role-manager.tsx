"use client";

import { createRoleAction, addUserToRoleAction, removeUserFromRoleAction, updateRoleAction, regenerateRoleInviteTokenAction } from "@/app/actions/role";
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

export function RoleManager({ roles, scheduleId }: { roles: any[], scheduleId: string }) {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Left Column: Role List & Create */}
      <div className="md:col-span-1 space-y-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-zinc-100">
          <h2 className="font-semibold mb-4 text-zinc-900">Create Role</h2>
          <form action={createRoleAction} className="space-y-4">
            <input type="hidden" name="scheduleId" value={scheduleId} />
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Role Name</label>
              <input
                name="name"
                placeholder="e.g. Guitarist"
                className="w-full rounded-lg border-zinc-200 shadow-sm text-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Role Type</label>
              <select
                name="type"
                className="w-full rounded-lg border-zinc-200 shadow-sm text-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="required">Required (Critical)</option>
                <option value="optional">Optional (Nice to have)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Color Label</label>
              <div className="flex items-center gap-2">
                <input
                  name="color"
                  type="color"
                  className="h-9 w-16 p-0 border-0 rounded cursor-pointer"
                  defaultValue="#4F46E5"
                />
                <span className="text-xs text-zinc-400">Pick a color for the badge</span>
              </div>
            </div>
            <button className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors">
              Add Role
            </button>
          </form>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">Existing Roles</h3>
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRoleId(role.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all duration-200 flex items-center justify-between group ${selectedRoleId === role.id
                ? "border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500 shadow-sm"
                : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
                }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full ring-1 ring-black/5"
                  style={{ backgroundColor: role.color || "#ccc" }}
                />
                <span className={`font-medium ${selectedRoleId === role.id ? 'text-indigo-900' : 'text-zinc-700'}`}>
                  {role.name}
                </span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${selectedRoleId === role.id
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200'
                }`}>
                {role.users.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Right Column: Role Details & Members */}
      <div className="md:col-span-2">
        {selectedRoleId ? (
          <RoleDetails role={roles.find((r) => r.id === selectedRoleId)} />
        ) : (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-zinc-400 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="font-medium">Select a role to manage volunteers</p>
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
    <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-zinc-100 bg-zinc-50/30">
        {isEditing ? (
          <form
            action={async (formData) => {
              await updateRoleAction(formData);
              setIsEditing(false);
            }}
            className="flex items-end gap-4"
          >
            <input type="hidden" name="roleId" value={role.id} />
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">
                  Role Name
                </label>
                <input
                  name="name"
                  defaultValue={role.name}
                  className="w-full rounded-lg border-zinc-200 shadow-sm text-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">
                  Role Type
                </label>
                <select
                  name="type"
                  defaultValue={role.type || "required"}
                  className="w-full rounded-lg border-zinc-200 shadow-sm text-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="required">Required</option>
                  <option value="optional">Optional</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">
                  Color Label
                </label>
                <div className="flex items-center gap-2">
                  <input
                    name="color"
                    type="color"
                    className="h-9 w-16 p-0 border-0 rounded cursor-pointer"
                    defaultValue={role.color || "#4F46E5"}
                  />
                  <span className="text-xs text-zinc-400">
                    Pick a color for the badge
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-full shadow-sm ring-2 ring-white"
                style={{ backgroundColor: role.color || "#ccc" }}
              />
              <div>
                <h2 className="text-2xl font-bold text-zinc-900">
                  {role.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${role.type === 'optional'
                    ? 'bg-zinc-50 text-zinc-500 border-zinc-200'
                    : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                    }`}>
                    {role.type === 'optional' ? 'Optional' : 'Required'}
                  </span>
                  <p className="text-sm text-zinc-500">
                    Manage members for this role
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Edit Role
            </button>
          </div>
        )}
      </div>

      <div className="p-6 space-y-8">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
            Invite Link
          </h3>
          <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-100">
            {role.inviteToken && origin ? (
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="bg-white p-2 rounded-lg border border-zinc-200 shadow-sm w-fit">
                  <QRCodeSVG
                    value={`${origin}/invites/${role.inviteToken}`}
                    size={120}
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-sm text-zinc-600">
                    Share this link or QR code with volunteers. When they visit it, they will be automatically added to the <strong>{role.name}</strong> role.
                  </p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={`${origin}/invites/${role.inviteToken}`}
                      className="flex-1 rounded-lg border-zinc-200 shadow-sm text-sm p-2.5 bg-white text-zinc-500"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${origin}/invites/${role.inviteToken}`);
                      }}
                      className="bg-white border border-zinc-200 text-zinc-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-50 shadow-sm transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <button
                    onClick={() => regenerateRoleInviteTokenAction(role.id)}
                    className="text-xs text-zinc-400 hover:text-zinc-600 underline"
                  >
                    Reset Invite Link
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-zinc-500 mb-3">
                  {role.inviteToken ? "Loading invite link..." : "No invite link generated for this role."}
                </p>
                {!role.inviteToken && (
                  <button
                    onClick={() => regenerateRoleInviteTokenAction(role.id)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors"
                  >
                    Generate Invite Link
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
            Add Volunteer
          </h3>
          <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-100">
            <form action={addUserToRoleAction} className="space-y-3">
              <input type="hidden" name="roleId" value={role.id} />
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    name="email"
                    type="email"
                    placeholder="volunteer@example.com"
                    className="w-full rounded-lg border-zinc-200 shadow-sm text-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors whitespace-nowrap">
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <span className="w-1 h-4 bg-zinc-300 rounded-full"></span>
              Assigned Volunteers
            </h3>
            <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-1 rounded-full">
              {role.users.length} members
            </span>
          </div>

          {role.users.length === 0 ? (
            <div className="text-center py-8 bg-zinc-50 rounded-lg border border-dashed border-zinc-200">
              <p className="text-sm text-zinc-500">No volunteers assigned to this role yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100 border border-zinc-100 rounded-lg overflow-hidden">
              {role.users.map((ur: any) => (
                <li key={ur.userId} className="p-3 flex justify-between items-center hover:bg-zinc-50 transition-colors bg-white">
                  <div className="flex items-center gap-3">
                    {ur.user.image ? (
                      <img
                        src={ur.user.image}
                        alt=""
                        className="w-9 h-9 rounded-full bg-zinc-200 ring-1 ring-zinc-100"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                        {ur.user.name?.[0]}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-zinc-900">{ur.user.name || "Unknown"}</p>
                      </div>
                      <p className="text-xs text-zinc-500">{ur.user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeUserFromRoleAction(ur.userId, role.id)}
                    className="text-zinc-400 hover:text-red-600 text-xs font-medium px-3 py-1.5 rounded hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
