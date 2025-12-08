"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  toggleAvailabilityAction,
  confirmAssignmentAction,
  unconfirmAssignmentAction,
  adminAssignVolunteerAction,
  assignVolunteerAction,
  adminRemoveAvailabilityAction
} from "@/app/actions/volunteer";
import {
  addShiftAction,
  removeShiftAction,
  updateShiftAction
} from "@/app/actions/schedule";

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
  allRoles = [],
  planStatus
}: {
  event: any,
  scheduleId: string,
  isOwner: boolean,
  currentUserId: string,
  userRoleIds?: string[],
  allRoles?: any[],
  planStatus?: string
}) {
  const shifts = event.shifts;
  const hasRoles = shifts.some((s: any) => s.roleId);

  // Visibility Check
  if (!isOwner) {
    if (hasRoles) {
      const hasMatchingRole = shifts.some((s: any) => {
        const rId = s.roleId || s.role?.id;
        // Match if user has the role OR if it's a general position (no role)
        return !rId || (rId && userRoleIds.includes(rId));
      });
      const isAssigned = shifts.some((s: any) => s.assignments.some((a: any) => a.userId === currentUserId));
      const isAvailable = shifts.some((s: any) => s.availabilities?.some((a: any) => a.userId === currentUserId));

      if (!hasMatchingRole && !isAssigned && !isAvailable) {
        return null;
      }
    }
  }

  const seriesColor = event.recurringEventId
    ? getSeriesColor(event.recurringEventId)
    : "bg-zinc-100";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-100 hover:shadow-md transition-all duration-200 group flex">
      <div className={`w-1.5 flex-shrink-0 rounded-l-xl ${seriesColor}`} title={event.recurringEventId ? "Repeating Event Series" : "Single Event"} />
      <div className="p-2 sm:p-3 flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-0.5 sm:mb-1">
              <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                {new Date(event.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
              <div className="h-px flex-1 bg-zinc-100 sm:hidden"></div>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-zinc-900 leading-tight flex items-center gap-2">
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

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-start sm:justify-end mt-1 sm:mt-0">
            {shifts.map((shift: any) => (
              <RoleItem
                key={shift.id}
                shift={shift}
                event={event}
                scheduleId={scheduleId}
                isOwner={isOwner}
                currentUserId={currentUserId}
                userRoleIds={userRoleIds}
                planStatus={planStatus}
              />
            ))}

            {shifts.length === 0 && !isOwner && (
              <button
                onClick={async () => {
                  try {
                    await toggleAvailabilityAction(event.id, scheduleId);
                    toast.success("Marked as available");
                  } catch (error) {
                    toast.error("Failed to update availability");
                  }
                }}
                className="flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 bg-white text-zinc-700 ring-1 ring-zinc-200 hover:ring-indigo-500 hover:text-indigo-600 hover:shadow-sm"
              >
                Available
              </button>
            )}

            {isOwner && (
              <AddPositionButton
                eventId={event.id}
                scheduleId={scheduleId}
                allRoles={allRoles}
                existingShifts={event.shifts}
              />
            )}
          </div>
        </div>

        <AssignmentsList
          shifts={shifts}
          isOwner={isOwner}
          scheduleId={scheduleId}
          planStatus={planStatus}
        />
      </div>
    </div>
  );
}

function RoleItem({ shift, event, scheduleId, isOwner, currentUserId, userRoleIds, planStatus }: any) {
  const initialIsAvailable = shift.availabilities?.some((a: any) => a.userId === currentUserId);
  const [isAvailable, setIsAvailable] = useState(initialIsAvailable);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsAvailable(shift.availabilities?.some((a: any) => a.userId === currentUserId));
  }, [shift.availabilities, currentUserId]);

  const roleId = shift.roleId || shift.role?.id;
  const canVolunteer = !roleId || userRoleIds.includes(roleId);
  const needed = shift.needed || 1;
  const assignedCount = shift.assignments.length;

  // For visibility: if not owner, check if they can volunteer OR have already volunteered
  if (!isOwner && !canVolunteer && !isAvailable) return null;

  const handleToggle = async () => {
    if (isOwner || isLoading) return;

    setIsLoading(true);
    const nextState = !isAvailable;
    setIsAvailable(nextState);

    try {
      await toggleAvailabilityAction(event.id, scheduleId, shift.id);
      if (nextState) {
        toast.success("Marked as available");
      } else {
        toast.success("Removed availability");
      }
    } catch (error) {
      setIsAvailable(!nextState);
      toast.error("Failed to update availability");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center group/role">
      <button
        onClick={handleToggle}
        disabled={isOwner || isLoading}
        className={`flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${isAvailable
            ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-100"
            : canVolunteer
              ? "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:ring-indigo-500 hover:text-indigo-600 hover:shadow-sm"
              : "bg-zinc-50 text-zinc-400 ring-1 ring-zinc-100 cursor-not-allowed"
          } ${isLoading ? "opacity-70 cursor-wait" : ""}`}
        title={!canVolunteer && !isOwner ? "You do not have this role" : ""}
      >
        {!isOwner ? "Available" : (shift.name || shift.role?.name || "General Position")}
        {isOwner && (
          <span className="ml-1 text-[10px] opacity-70">
            ({assignedCount}/{needed})
          </span>
        )}
      </button>

      {isOwner && <AdminRoleActions shift={shift} scheduleId={scheduleId} planStatus={planStatus} />}
    </div>
  );
} function AdminRoleActions({ shift, scheduleId, planStatus }: any) {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-2 hidden group-hover/role:block z-10">
      <div className="flex items-center bg-white shadow-xl border border-zinc-100 rounded-lg p-1 min-w-max">
        <button
          onClick={async () => {
            const name = prompt("Enter name of user to assign:");
            if (name && name.trim() !== "") {
              await adminAssignVolunteerAction(shift.id, scheduleId, name.trim());
            }
          }}
          className="p-1.5 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-md transition-all"
          title="Assign User"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </button>
        <div className="w-px h-4 bg-zinc-100 mx-0.5"></div>
        <button
          onClick={async () => {
            const newName = prompt("Enter new name for this position:", shift.name || shift.role?.name || "General Position");
            if (newName && newName.trim() !== "") {
              await updateShiftAction(shift.id, scheduleId, { name: newName.trim() });
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
            const newNeeded = prompt("Enter number of users needed:", shift.needed || 1);
            if (newNeeded && !isNaN(parseInt(newNeeded))) {
              await updateShiftAction(shift.id, scheduleId, { needed: parseInt(newNeeded) });
            }
          }}
          className="p-1.5 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-all"
          title="Change Needed Count"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
        </button>
        <button
          onClick={() => {
            toast("Are you sure you want to remove this role?", {
              action: {
                label: "Delete",
                onClick: async () => {
                  await removeShiftAction(shift.id, scheduleId);
                  toast.success("Role removed");
                }
              },
              cancel: {
                label: "Cancel",
                onClick: () => {}
              }
            });
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
  );
}

function AddPositionButton({ eventId, scheduleId, allRoles, existingShifts }: any) {
  const router = useRouter();
  const [isAddingPosition, setIsAddingPosition] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsAddingPosition(false);
      }
    }

    if (isAddingPosition) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAddingPosition]);

  // Check if there are any shifts at all
  const hasAnyShifts = existingShifts && existingShifts.length > 0;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => {
          setIsAddingPosition(!isAddingPosition);
          setSelectedRole("");
        }}
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
              setSelectedRole("");
              toast.success("Position added successfully");
            } catch (error) {
              console.error("Error adding shift:", error);
              toast.error(error instanceof Error ? error.message : "Failed to add role");
            }
          }}>
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="scheduleId" value={scheduleId} />
            <label className="block text-xs font-medium text-zinc-500 mb-2">Select Role</label>
            <select
              name="roleId"
              className="w-full text-sm border-zinc-200 rounded-md text-zinc-700 focus:ring-indigo-500 focus:border-indigo-500 mb-3"
              size={5}
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              {!hasAnyShifts && (
                <option value="" className="py-1.5 px-2 hover:bg-indigo-50 cursor-pointer rounded font-medium text-indigo-600">
                  General Position (No Role)
                </option>
              )}
              {allRoles.map((role: any) => (
                <option key={role.id} value={role.id} className="py-1.5 px-2 hover:bg-indigo-50 cursor-pointer rounded">
                  {role.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => router.push(`/schedules/${scheduleId}/roles`)}
              className="w-full text-sm font-medium text-indigo-600 hover:text-indigo-700 border border-dashed border-indigo-300 hover:border-indigo-400 hover:bg-indigo-50 rounded-md px-3 py-2 mb-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              + Create New Role
            </button>

            <label className="block text-xs font-medium text-zinc-500 mb-1">Needed Count</label>
            <input
              type="number"
              name="needed"
              defaultValue={1}
              min={1}
              className="w-full text-sm border-zinc-200 rounded-md text-zinc-700 focus:ring-indigo-500 focus:border-indigo-500"
            />

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
  );
}

function AssignmentsList({ shifts, isOwner, scheduleId, planStatus }: any) {
  if (!isOwner) return null;

  const hasAssignments = shifts.some((s: any) => s.assignments.length > 0);
  const hasAvailability = shifts.some((s: any) => s.availabilities?.length > 0);

  if (!hasAssignments && !hasAvailability) return null;

  return (
    <div className="mt-3 border-t border-zinc-50">
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
            <span
              className={`w-1.5 h-1.5 rounded-full ${assignment.status === 'CONFIRMED' ? 'bg-emerald-500' : 'bg-blue-400'}`}
              title={assignment.status}
            />

            {isOwner && assignment.status === 'PENDING' && planStatus !== "RECRUITMENT" && (
              <button
                onClick={() => confirmAssignmentAction(assignment.id, scheduleId)}
                className="ml-1 text-indigo-600 hover:text-indigo-800 font-bold p-0.5 hover:bg-indigo-50 rounded"
                title="Confirm"
              >
                ✓
              </button>
            )}
            {isOwner && assignment.status === 'CONFIRMED' && planStatus !== "RECRUITMENT" && (
              <button
                onClick={() => unconfirmAssignmentAction(assignment.id, scheduleId)}
                className="ml-1 text-amber-600 hover:text-amber-800 font-bold p-0.5 hover:bg-amber-50 rounded"
                title="Unconfirm (Revert to Pending)"
              >
                ↺
              </button>
            )}
          </div>
        ))}
      </div>

      {isOwner && <AvailableVolunteersList shifts={shifts} scheduleId={scheduleId} planStatus={planStatus} />}
    </div>
  );
}

function AvailableVolunteersList({ shifts, scheduleId, planStatus }: any) {
  const hasAvailability = shifts.some((s: any) => s.availabilities?.length > 0);
  if (!hasAvailability) return null;

  return (
    <div className="mt-3">
      <h4 className="text-xs font-semibold text-zinc-500 mb-2">Available Users:</h4>
      <div className="flex flex-wrap gap-2">
        {shifts.flatMap((s: any) => s.availabilities || []).map((availability: any) => (
          <div
            key={availability.id}
            className="flex items-center gap-2 bg-indigo-50 px-2.5 py-1.5 rounded-md text-xs border border-indigo-100"
          >
            <span className="font-medium text-indigo-700">{availability.user?.name || availability.user?.email}</span>
            {availability.shift?.role && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white border border-indigo-100 shadow-sm"
                style={{ color: availability.shift.role.color || '#666' }}
              >
                {availability.shift.role.name}
              </span>
            )}
            {planStatus !== "RECRUITMENT" && (
              <button
                onClick={() => assignVolunteerAction(availability.shiftId, availability.userId, scheduleId)}
                className="ml-1 text-indigo-600 hover:text-indigo-800 font-bold p-0.5 hover:bg-indigo-100 rounded"
                title="Assign"
              >
                +
              </button>
            )}
            <button
              onClick={() => {
                toast("Remove this user from availability?", {
                  action: {
                    label: "Remove",
                    onClick: async () => {
                      await adminRemoveAvailabilityAction(availability.shiftId, availability.userId, scheduleId);
                      toast.success("Availability removed");
                    }
                  },
                  cancel: {
                    label: "Cancel",
                    onClick: () => {}
                  }
                });
              }}
              className="ml-1 text-red-400 hover:text-red-600 font-bold p-0.5 hover:bg-red-50 rounded"
              title="Remove Availability"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

