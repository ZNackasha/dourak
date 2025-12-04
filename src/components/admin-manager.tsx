"use client";

import { addAdminAction, removeAdminAction } from "@/app/actions/admin";
import { useState } from "react";

export function AdminManager({ scheduleId, admins, ownerId }: { scheduleId: string, admins: any[], ownerId: string }) {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">Schedule Admins</h3>
          <p className="text-sm text-zinc-500">Manage who can edit this schedule</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          {isAdding ? "Cancel" : "Add Admin"}
        </button>
      </div>

      {isAdding && (
        <div className="p-4 bg-zinc-50 border-b border-zinc-100">
          <form
            action={async (formData) => {
              await addAdminAction(formData);
              setIsAdding(false);
            }}
            className="flex gap-2"
          >
            <input type="hidden" name="scheduleId" value={scheduleId} />
            <input
              name="email"
              type="email"
              placeholder="admin@example.com"
              className="flex-1 rounded-lg border-zinc-200 text-sm p-2.5"
              required
            />
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
              Add
            </button>
          </form>
        </div>
      )}

      <ul className="divide-y divide-zinc-100">
        {admins.map((admin) => (
          <li key={admin.userId} className="p-4 flex justify-between items-center hover:bg-zinc-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                {admin.user.name?.[0] || admin.user.email[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900">{admin.user.name || "Unknown"}</p>
                <p className="text-xs text-zinc-500">{admin.user.email}</p>
              </div>
            </div>
            {admin.userId !== ownerId && (
              <button
                onClick={() => removeAdminAction(scheduleId, admin.userId)}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Remove
              </button>
            )}
            {admin.userId === ownerId && (
              <span className="text-xs text-zinc-400 font-medium px-2 py-1 bg-zinc-100 rounded">Owner</span>
            )}
          </li>
        ))}
        {admins.length === 0 && (
          <li className="p-8 text-center text-zinc-500 text-sm">
            No additional admins. Only the owner can manage this schedule.
          </li>
        )}
      </ul>
    </div>
  );
}
