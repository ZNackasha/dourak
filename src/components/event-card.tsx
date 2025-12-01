"use client";

import { addVolunteerAction, toggleAvailabilityAction, confirmAssignmentAction, adminAssignVolunteerAction } from "@/app/actions/volunteer";
import { addShiftAction, removeShiftAction, updateShiftAction } from "@/app/actions/schedule";
import { useState } from "react";

const getSeriesColor = (id: string) => {
  const colors = [
    "bg-red-400", "bg-orange-400", "bg-amber-400", "bg-lime-400",
    "bg-emerald-400", "bg-teal-400", "bg-cyan-400", "bg-sky-400",
    "bg-blue-400", "bg-indigo-400", "bg-violet-400", "bg-fuchsia-400",
    "bg-pink-400", "bg-rose-400"
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export function EventCard({
  event,
  scheduleId,
  isOwner,
  currentUserId,
  userRoleIds = [],
  allRoles = []
}: {
  event: any,
  scheduleId: string,
  isOwner: boolean,
  currentUserId: string,
  userRoleIds?: string[],
  allRoles?: any[]
}) {
  const [isAddingPosition, setIsAddingPosition] = useState(false);

  // Group assignments by shift/role
  const shifts = event.shifts;
  const hasRoles = shifts.some((s: any) => s.roleId);

  // Helper to check if user is assigned to a specific shift
  const isAssignedToShift = (shiftId: string) => {
    const shift = shifts.find((s: any) => s.id === shiftId);
    return shift?.assignments.some((a: any) => a.userId === currentUserId);
  };

  const seriesColor = event.recurringEventId
    ? getSeriesColor(event.recurringEventId)
    : "bg-zinc-100";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-100 hover:shadow-md transition-all duration-200 group flex">
      <div className={`w-1.5 flex-shrink-0 rounded-l-xl ${seriesColor}`} title={event.recurringEventId ? "Repeating Event Series" : "Single Event"} />
      <div className="p-4 flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                {new Date(event.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
              <div className="h-px flex-1 bg-zinc-100 sm:hidden"></div>
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 leading-tight flex items-center gap-2">
              {event.title}
              {event.recurringEventId && (
                <span className="text-zinc-400" title="Repeating Event">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </span>
              )}
            </h3>
          </div>

          {/* Action Area */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* If no specific roles defined, use generic availability */}
            {!hasRoles && (
              <GenericAvailabilityButton
                event={event}
                scheduleId={scheduleId}
                isOwner={isOwner}
                currentUserId={currentUserId}
              />
            )}

            {/* If roles defined, show role buttons */}
            {hasRoles && shifts.map((shift: any) => {
              if (!shift.role) return null;
              const isAssigned = isAssignedToShift(shift.id);
              const canVolunteer = userRoleIds.includes(shift.roleId);

              // Only show button if user has role OR is already assigned OR is owner
              if (!isOwner && !canVolunteer && !isAssigned) return null;

              return (
                <div key={shift.id} className="relative flex items-center group/role">
                  <button
                    onClick={() => !isOwner && toggleAvailabilityAction(event.id, scheduleId, shift.id)}
                    disabled={isOwner}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${isAssigned
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
                        : canVolunteer
                          ? "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:ring-indigo-500 hover:text-indigo-600 hover:shadow-sm"
                          : "bg-zinc-50 text-zinc-400 ring-1 ring-zinc-100 cursor-not-allowed"
                      }`}
                    title={!canVolunteer && !isOwner ? "You do not have this role" : ""}
                  >
                    <div
                      className="w-2 h-2 rounded-full ring-1 ring-black/5"
                      style={{ backgroundColor: shift.role.color || '#ccc' }}
                    />
                    {shift.name || shift.role.name}
                    {isAssigned && " ✓"}
                  </button>
                  {isOwner && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-2 hidden group-hover/role:block z-10">
                      <div className="flex items-center bg-white shadow-xl border border-zinc-100 rounded-lg p-1 min-w-max">
                        <button
                          onClick={async () => {
                            const name = prompt("Enter name of volunteer to assign:");
                            if (name && name.trim() !== "") {
                              await adminAssignVolunteerAction(shift.id, scheduleId, name.trim());
                            }
                          }}
                          className="p-1.5 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-md transition-all"
                          title="Assign Volunteer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                        </button>
                        <div className="w-px h-4 bg-zinc-100 mx-0.5"></div>
                        <button
                          onClick={async () => {
                            const newName = prompt("Enter new name for this position:", shift.name || shift.role.name);
                            if (newName && newName.trim() !== "") {
                              await updateShiftAction(shift.id, scheduleId, newName.trim());
                            }
                          }}
                          className="p-1.5 text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-md transition-all"
                          title="Rename Position"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm("Are you sure you want to remove this role?")) {
                              await removeShiftAction(shift.id, scheduleId);
                            }
                          }}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                          title="Remove Role"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {isOwner && (
              <div className="relative">
                <button
                  onClick={() => setIsAddingPosition(!isAddingPosition)}
                  className="text-xs font-medium text-zinc-400 hover:text-indigo-600 border border-dashed border-zinc-300 hover:border-indigo-300 rounded-lg px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-all"
                >
                  + Position
                </button>
                {isAddingPosition && (
                  <div className="absolute right-0 top-full mt-2 bg-white border border-zinc-100 shadow-xl rounded-xl p-4 z-50 w-72 ring-1 ring-black/5">
                    <form action={async (formData) => {
                      try {
                        await addShiftAction(formData);
                        setIsAddingPosition(false);
                      } catch (error) {
                        console.error("Error adding shift:", error);
                        alert("Failed to add role. Please try again.");
                      }
                    }}>
                      <input type="hidden" name="eventId" value={event.id} />
                      <input type="hidden" name="scheduleId" value={scheduleId} />
                      <label className="block text-xs font-medium text-zinc-500 mb-2">Select Role</label>
                      {allRoles.length > 0 ? (
                        <select
                          name="roleId"
                          className="w-full text-sm border-zinc-200 rounded-md text-zinc-700 focus:ring-indigo-500 focus:border-indigo-500"
                          required
                          size={5}
                        >
                          {allRoles.map(role => (
                            <option key={role.id} value={role.id} className="py-1.5 px-2 hover:bg-indigo-50 cursor-pointer rounded">{role.name}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-xs text-zinc-400 mb-3 italic">No roles available. Create roles in settings first.</div>
                      )}
                      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-zinc-50">
                        <button
                          type="button"
                          onClick={() => setIsAddingPosition(false)}
                          className="text-xs font-medium text-zinc-500 px-3 py-2 hover:text-zinc-800 hover:bg-zinc-50 rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="text-xs font-medium bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 shadow-sm transition-colors"
                        >
                          Add Position
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Expanded Details (Volunteers List) - Only show if there are assignments or owner */}
        {(isOwner || shifts.some((s: any) => s.assignments.length > 0)) && (
          <div className="mt-4 pt-4 border-t border-zinc-50">
            <div className="flex flex-wrap gap-2">
              {shifts.flatMap((s: any) => s.assignments).map((assignment: any) => (
                <div
                  key={assignment.id}
                  className="flex items-center gap-2 bg-zinc-50 px-2.5 py-1.5 rounded-md text-xs border border-zinc-100"
                >
                  <span className="font-medium text-zinc-700">{assignment.name || assignment.email || assignment.user?.email}</span>
                  {assignment.shift?.role && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white border border-zinc-100 shadow-sm"
                      style={{ color: assignment.shift.role.color || '#666' }}
                    >
                      {assignment.shift.role.name}
                    </span>
                  )}
                  <span className={`w-1.5 h-1.5 rounded-full ${assignment.status === 'CONFIRMED' ? 'bg-emerald-500' : 'bg-blue-400'
                    }`} title={assignment.status} />

                  {isOwner && assignment.status === 'AVAILABLE' && (
                    <button
                      onClick={() => confirmAssignmentAction(assignment.id, scheduleId)}
                      className="ml-1 text-indigo-600 hover:text-indigo-800 font-bold p-0.5 hover:bg-indigo-50 rounded"
                      title="Confirm"
                    >
                      ✓
                    </button>
                  )}
                </div>
              ))}
            </div>

            {isOwner && (
              <div className="mt-3 text-xs text-zinc-400 flex justify-between items-center">
                <span>Manage roles in <a href="/roles" className="text-indigo-600 hover:underline">Role Settings</a></span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function GenericAvailabilityButton({ event, scheduleId, isOwner, currentUserId }: any) {
  const assignments = event.shifts.flatMap((shift: any) => shift.assignments);
  const myAssignment = assignments.find((a: any) => a.userId === currentUserId);
  const isAvailable = !!myAssignment;

  if (isOwner) return null;

  return (
    <button
      onClick={() => toggleAvailabilityAction(event.id, scheduleId)}
      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm ${isAvailable
          ? "bg-red-50 text-red-700 ring-1 ring-red-200 hover:bg-red-100"
          : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:ring-indigo-500 hover:text-indigo-600"
        }`}
    >
      {isAvailable ? "Cancel" : "I'm Available"}
    </button>
  );
}

