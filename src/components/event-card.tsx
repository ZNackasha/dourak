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
  adminRemoveAvailabilityAction,
  adminAddAvailabilityAction,
  adminAddEventAvailabilityAction
} from "@/app/actions/assignment";
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

import { format } from "date-fns";

// ... existing imports ...

export function EventCard({
  event,
  scheduleId,
  isOwner,
  currentUserId,
  userRoleIds = [],
  allRoles = [],
  planStatus,
  scheduleUsers = [],
  relatedEvents = []
}: {
  event: any,
  scheduleId: string,
  isOwner: boolean,
  currentUserId: string,
  userRoleIds?: string[],
  allRoles?: any[],
  planStatus?: string,
  scheduleUsers?: any[],
  relatedEvents?: any[]
}) {
  const shifts = event.shifts;
  const hasRoles = shifts.some((s: any) => s.roleId);

  // Visibility Check
  if (!isOwner) {
    if (hasRoles) {
      const hasMatchingRole = shifts.some((s: any) => {
        const rId = s.roleId || s.role?.id;
        // Match if user has the role OR if it's an Any Role position (no role)
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

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const handleAddUser = async (emailOrName: string) => {
    try {
      await adminAddEventAvailabilityAction(event.id, scheduleId, emailOrName.trim());
      toast.success("User added to availability");
      setIsAddUserOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add user");
    }
  };

  const dateStr = format(new Date(event.start), "EEE, MMM d");
  const timeStr = format(new Date(event.start), "h:mm a");

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-100 hover:shadow-md transition-all duration-200 group flex">
      <div className={`w-1.5 flex-shrink-0 rounded-l-xl ${seriesColor}`} title={event.recurringEventId ? "Repeating Event Series" : "Single Event"} />
      <div className="p-2 sm:p-3 flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-3">
          <div className="flex-1 min-w-fit">
            <div className="flex items-center gap-2 sm:gap-3 mb-0.5 sm:mb-1">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                <span>{dateStr}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                <span>{timeStr}</span>
                {relatedEvents && relatedEvents.length > 1 && (
                  <div className="relative group/times ml-1">
                    <span className="bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded text-[10px] cursor-help">
                      +{relatedEvents.length - 1} more
                    </span>
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-zinc-200 rounded-lg shadow-lg p-2 hidden group-hover/times:block z-50 max-h-64 overflow-y-auto">
                      <div className="text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">All Occurrences</div>
                      <div className="space-y-1">
                        {relatedEvents.map((e: any) => (
                          <div key={e.id} className="text-xs text-zinc-600 flex justify-between">
                            <span>{format(new Date(e.start), "MMM d")}</span>
                            <span>{format(new Date(e.start), "h:mm a")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
            {isOwner && (
              <>
                <AddPositionButton
                  eventId={event.id}
                  scheduleId={scheduleId}
                  allRoles={allRoles}
                  existingShifts={event.shifts}
                />
                <button
                  onClick={() => setIsAddUserOpen(true)}
                  className="text-xs font-medium text-zinc-400 hover:text-violet-600 border border-dashed border-zinc-300 hover:border-violet-300 rounded-lg px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-all"
                  title="Add Available User"
                >
                  + User
                </button>
              </>
            )}

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
                scheduleUsers={scheduleUsers}
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
          </div>
        </div>

        <AssignmentsList
          shifts={shifts}
          isOwner={isOwner}
          scheduleId={scheduleId}
          planStatus={planStatus}
        />

        {isAddUserOpen && (
          <AddVolunteerDialog
            isOpen={isAddUserOpen}
            onClose={() => setIsAddUserOpen(false)}
            onAdd={handleAddUser}
            users={scheduleUsers}
          />
        )}
      </div>
    </div>
  );
}

function RoleItem({ shift, event, scheduleId, isOwner, currentUserId, userRoleIds, planStatus, scheduleUsers = [] }: any) {
  const initialIsAvailable = shift.availabilities?.some((a: any) => a.userId === currentUserId);
  const [isAvailable, setIsAvailable] = useState(initialIsAvailable);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssignUserOpen, setIsAssignUserOpen] = useState(false);

  useEffect(() => {
    setIsAvailable(shift.availabilities?.some((a: any) => a.userId === currentUserId));
  }, [shift.availabilities, currentUserId]);

  const roleId = shift.roleId || shift.role?.id;
  const canVolunteer = !roleId || userRoleIds.includes(roleId);
  const needed = shift.needed || 1;
  const assignedCount = shift.assignments.length;

  const userAssignment = shift.assignments?.find((a: any) => a.userId === currentUserId);
  const isConfirmed = userAssignment?.status === 'CONFIRMED';
  const isAssigned = !!userAssignment;

  // For visibility: if not owner, check if they can volunteer OR have already volunteered
  if (!isOwner && !canVolunteer && !isAvailable) return null;

  const handleToggle = async () => {
    if (isOwner || isLoading) return;

    setIsLoading(true);
    const isParticipating = isAvailable || isAssigned;
    const nextState = !isParticipating;
    setIsAvailable(nextState);

    try {
      await toggleAvailabilityAction(event.id, scheduleId, shift.id);
      if (nextState) {
        toast.success("Marked as available");
      } else {
        toast.success(isAssigned ? "Withdrawn from position" : "Removed availability");
      }
    } catch (error) {
      setIsAvailable(!nextState);
      toast.error("Failed to update availability");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignUser = async (userId: string) => {
    try {
      await assignVolunteerAction(shift.id, userId, scheduleId);
      toast.success("User assigned successfully");
      setIsAssignUserOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to assign user");
    }
  };

  const handleAssignManualName = async (name: string) => {
    try {
      await adminAssignVolunteerAction(shift.id, scheduleId, name.trim());
      toast.success("User assigned successfully");
      setIsAssignUserOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to assign user");
    }
  };

  return (
    <div className="relative flex items-center group/role">
      <div
        role="button"
        onClick={!isOwner ? handleToggle : undefined}
        className={`flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${isConfirmed
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
          : isAssigned
            ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100"
            : isAvailable
              ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-100"
              : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:ring-indigo-500 hover:text-indigo-600 hover:shadow-sm"
          } ${isLoading ? "opacity-70 cursor-wait" : ""} ${!isOwner && canVolunteer ? "cursor-pointer" : "cursor-default"}`}
        title={!canVolunteer && !isOwner ? "You do not have this role" : ""}
      >
        {!isOwner ? (
          isConfirmed ? "Confirmed" :
            isAssigned ? "Assigned" :
              "Available"
        ) : (
          isOwner && shift.assignments.length > 0 ? (
            <div className="flex items-center gap-2">
              {shift.assignments.map((assignment: any) => (
                <div key={assignment.id} className="flex items-center gap-1 bg-white/50 px-1.5 py-0.5 rounded border border-zinc-200/50">
                  <span>{assignment.name || assignment.email || assignment.user?.email}</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${assignment.status === 'CONFIRMED' ? 'bg-emerald-500' : 'bg-blue-400'}`}
                    title={assignment.status}
                  />
                  {assignment.status === 'PENDING' && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await confirmAssignmentAction(assignment.id, scheduleId);
                          toast.success("Confirmed");
                        } catch { toast.error("Failed"); }
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-bold px-1 hover:bg-indigo-50 rounded"
                    >✓</button>
                  )}
                  {assignment.status === 'CONFIRMED' && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await unconfirmAssignmentAction(assignment.id, scheduleId);
                          toast.success("Unconfirmed");
                        } catch { toast.error("Failed"); }
                      }}
                      className="text-amber-600 hover:text-amber-800 font-bold px-1 hover:bg-amber-50 rounded"
                    >↺</button>
                  )}
                </div>
              ))}
              <span className="flex items-center">
                {shift.name || shift.role?.name || "Any Role"}
                <span className="ml-1 text-[10px] opacity-70">
                  ({assignedCount}/{needed})
                </span>
              </span>
            </div>
          ) : (
            <>
              {shift.name || shift.role?.name || "Any Role"}
              {isOwner && (
                <span className="ml-1 text-[10px] opacity-70">
                  ({assignedCount}/{needed})
                </span>
              )}
            </>
          )
        )}
      </div>

      {isOwner && (
        <>
          <AdminRoleActions
            shift={shift}
            scheduleId={scheduleId}
            planStatus={planStatus}
            onOpenAssignUser={() => setIsAssignUserOpen(true)}
          />
          {isAssignUserOpen && (
            <AssignVolunteerDialog
              isOpen={isAssignUserOpen}
              onClose={() => setIsAssignUserOpen(false)}
              onAssignUser={handleAssignUser}
              onAssignManual={handleAssignManualName}
              users={scheduleUsers}
              roleId={roleId}
            />
          )}
        </>
      )}
    </div>
  );
}
function AdminRoleActions({ shift, scheduleId, planStatus, onOpenAssignUser }: any) {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-2 hidden group-hover/role:block z-10">
      <div className="flex items-center bg-white shadow-xl border border-zinc-100 rounded-lg p-1 min-w-max">
        <button
          onClick={onOpenAssignUser}
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
            const newName = prompt("Enter new name for this position:", shift.name || shift.role?.name || "Any Role");
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
                onClick: () => { }
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

function AssignVolunteerDialog({ isOpen, onClose, onAssignUser, onAssignManual, users, roleId }: any) {
  const [name, setName] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  if (!isOpen) return null;

  // Filter users who have this role
  const eligibleUsers = roleId
    ? users.filter((u: any) => u.roles?.some((r: any) => r.roleId === roleId))
    : users; // If no role (Any Role position), show all users

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-lg font-semibold mb-4">Assign User to Role</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-700 mb-1">Select User with Role</label>
          <select
            className="w-full rounded-md border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={selectedUserId}
            onChange={(e) => {
              setSelectedUserId(e.target.value);
              if (e.target.value) setName("");
            }}
          >
            <option value="">-- Select a user --</option>
            {eligibleUsers.map((u: any) => (
              <option key={u.id} value={u.id}>{u.name || u.email}</option>
            ))}
          </select>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-zinc-200"></div>
          <span className="flex-shrink-0 mx-4 text-zinc-400 text-xs">OR</span>
          <div className="flex-grow border-t border-zinc-200"></div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 mb-1">Enter Name Manually</label>
          <input
            type="text"
            className="w-full rounded-md border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="John Doe"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (e.target.value) setSelectedUserId("");
            }}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 rounded-md hover:bg-zinc-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (selectedUserId) {
                onAssignUser(selectedUserId);
              } else if (name) {
                onAssignManual(name);
              }
            }}
            disabled={!selectedUserId && !name}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Assign User
          </button>
        </div>
      </div>
    </div>
  );
} function AddVolunteerDialog({ isOpen, onClose, onAdd, users }: any) {
  const [email, setEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-lg font-semibold mb-4">Add Available User</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-700 mb-1">Select Existing User</label>
          <select
            className="w-full rounded-md border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={selectedUser}
            onChange={(e) => {
              setSelectedUser(e.target.value);
              if (e.target.value) setEmail(""); // Clear manual email if user selected
            }}
          >
            <option value="">-- Select a user --</option>
            {users.map((u: any) => (
              <option key={u.id} value={u.email}>{u.name || u.email}</option>
            ))}
          </select>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-zinc-200"></div>
          <span className="flex-shrink-0 mx-4 text-zinc-400 text-xs">OR</span>
          <div className="flex-grow border-t border-zinc-200"></div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 mb-1">Enter Email Manually</label>
          <input
            type="email"
            className="w-full rounded-md border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (e.target.value) setSelectedUser(""); // Clear selection if typing
            }}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 rounded-md hover:bg-zinc-200"
          >
            Cancel
          </button>
          <button
            onClick={() => onAdd(selectedUser || email)}
            disabled={!selectedUser && !email}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add User
          </button>
        </div>
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
                  Any Role (No Specific Role)
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

  const hasAvailability = shifts.some((s: any) => s.availabilities?.length > 0);

  if (!hasAvailability) return null;

  return (
    <div className="border-t border-zinc-50">
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
        {shifts.flatMap((s: any) => (s.availabilities || []).map((a: any) => ({ ...a, shift: s }))).map((availability: any) => (
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
            <button
              onClick={async () => {
                try {
                  await assignVolunteerAction(availability.shiftId, availability.userId, scheduleId);
                  toast.success("Volunteer assigned");
                } catch (error) {
                  toast.error("Failed to assign volunteer");
                }
              }}
              className="ml-1 text-indigo-600 hover:text-indigo-800 font-bold p-0.5 hover:bg-indigo-100 rounded"
              title="Assign"
            >
              +
            </button>
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
                    onClick: () => { }
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

