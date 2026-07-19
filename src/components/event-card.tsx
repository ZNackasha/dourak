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
  isAdmin = false,
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
  isAdmin?: boolean,
  currentUserId: string,
  userRoleIds?: string[],
  allRoles?: any[],
  planStatus?: string,
  scheduleUsers?: any[],
  relatedEvents?: any[]
}) {
  const shifts = event.shifts;
  const hasRoles = shifts.some((s: any) => s.roleId);

  // The shift (if any) the current user is already on for this event
  const userActiveShift = !isOwner && currentUserId
    ? shifts.find((s: any) =>
      s.assignments?.some((a: any) => a.userId === currentUserId) ||
      s.availabilities?.some((a: any) => a.userId === currentUserId)
    )
    : undefined;

  // Visibility Check
  if (!isOwner) {
    if (hasRoles) {
      const hasMatchingRole = isAdmin || shifts.some((s: any) => {
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
    : "bg-muted";

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
    <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border hover:shadow-md transition-all duration-200 group flex">
      <div className={`w-1.5 flex-shrink-0 rounded-l-xl ${seriesColor}`} title={event.recurringEventId ? "Repeating Event Series" : "Single Event"} />
      <div className="p-2 sm:p-3 flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-3">
          <div className="flex-1 min-w-fit">
            <div className="flex items-center gap-2 sm:gap-3 mb-0.5 sm:mb-1">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <span>{dateStr}</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/40"></span>
                <span>{timeStr}</span>
                {relatedEvents && relatedEvents.length > 1 && (
                  <div className="relative group/times ml-1">
                    <span className="bg-muted text-foreground px-1.5 py-0.5 rounded text-[10px] cursor-help">
                      +{relatedEvents.length - 1} more
                    </span>
                    <div className="absolute top-full left-0 mt-1 w-48 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg p-2 hidden group-hover/times:block z-50 max-h-64 overflow-y-auto">
                      <div className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">All Occurrences</div>
                      <div className="space-y-1">
                        {relatedEvents.map((e: any) => (
                          <div key={e.id} className="text-xs text-muted-foreground flex justify-between">
                            <span>{format(new Date(e.start), "MMM d")}</span>
                            <span>{format(new Date(e.start), "h:mm a")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="h-px flex-1 bg-border sm:hidden"></div>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground leading-tight flex items-center gap-2">
              {event.title}
              {event.recurringEventId && (
                <span className="text-muted-foreground" title="Repeating Event">
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
                  className="text-xs font-medium text-muted-foreground hover:text-violet-500 dark:hover:text-violet-300 border border-dashed border-border hover:border-violet-400/60 rounded-lg px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-all"
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
                isAdmin={isAdmin}
                currentUserId={currentUserId}
                userRoleIds={userRoleIds}
                planStatus={planStatus}
                scheduleUsers={scheduleUsers}
                userActiveShift={userActiveShift}
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
                className="flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 bg-card text-foreground ring-1 ring-border hover:ring-primary/60 hover:bg-primary/5 hover:text-primary cursor-pointer"
              >
                <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span>I'm available</span>
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

const CONFETTI_PIECES = [
  { emoji: "🎉", cx: "-22px", cr: "-220deg", delay: "0ms" },
  { emoji: "✨", cx: "0px", cr: "180deg", delay: "60ms" },
  { emoji: "🎊", cx: "22px", cr: "260deg", delay: "30ms" },
  { emoji: "⭐", cx: "-10px", cr: "-160deg", delay: "120ms" },
  { emoji: "💫", cx: "12px", cr: "200deg", delay: "90ms" },
];

function ConfettiBurst() {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      <span className="absolute inset-0 rounded-lg animate-ring-burst" style={{ boxShadow: "0 0 0 2px var(--primary)" }} />
      {CONFETTI_PIECES.map((p, i) => (
        <span
          key={i}
          className="absolute text-base animate-confetti will-change-transform"
          style={{
            // @ts-expect-error custom CSS vars
            "--cx": p.cx,
            "--cr": p.cr,
            animationDelay: p.delay,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </span>
  );
}

function VolunteerStatusIcon({
  isConfirmed,
  isAssigned,
  isAvailable,
  isOnOtherShift,
  isFull,
}: {
  isConfirmed: boolean;
  isAssigned: boolean;
  isAvailable: boolean;
  isOnOtherShift: boolean;
  isFull: boolean;
}) {
  const baseClass = "w-3 h-3 flex-shrink-0";
  if (isConfirmed) {
    return (
      <svg className={baseClass} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path fillRule="evenodd" d="M16.704 5.296a1 1 0 010 1.408l-7.5 7.5a1 1 0 01-1.408 0l-3.5-3.5a1 1 0 011.408-1.408L8.5 12.092l6.796-6.796a1 1 0 011.408 0z" clipRule="evenodd" />
      </svg>
    );
  }
  if (isAssigned || isAvailable) {
    return <span className={`${baseClass} rounded-full bg-current opacity-80`} aria-hidden />;
  }
  if (isOnOtherShift) {
    return (
      <svg className={baseClass} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path fillRule="evenodd" d="M10 1a4 4 0 00-4 4v3H5a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2h-1V5a4 4 0 00-4-4zm2 7V5a2 2 0 10-4 0v3h4z" clipRule="evenodd" />
      </svg>
    );
  }
  if (isFull) {
    return (
      <svg className={baseClass} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7.5 9a1 1 0 100-2 1 1 0 000 2zm5 0a1 1 0 100-2 1 1 0 000 2zm-5.5 4a3 3 0 016 0H7z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg className={baseClass} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
  );
}

function RoleItem({ shift, event, scheduleId, isOwner, isAdmin, currentUserId, userRoleIds, planStatus, scheduleUsers = [], userActiveShift }: any) {
  const initialIsAvailable = shift.availabilities?.some((a: any) => a.userId === currentUserId);
  const [isAvailable, setIsAvailable] = useState(initialIsAvailable);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssignUserOpen, setIsAssignUserOpen] = useState(false);
  const [cheering, setCheering] = useState(false);

  useEffect(() => {
    setIsAvailable(shift.availabilities?.some((a: any) => a.userId === currentUserId));
  }, [shift.availabilities, currentUserId]);

  const roleId = shift.roleId || shift.role?.id;
  const canVolunteer = isAdmin || !roleId || userRoleIds.includes(roleId);
  const needed = shift.needed || 1;
  const assignedCount = shift.assignments.length;

  const userAssignment = shift.assignments?.find((a: any) => a.userId === currentUserId);
  const isConfirmed = userAssignment?.status === 'CONFIRMED';
  const isAssigned = !!userAssignment;

  // User is already on a different shift in this event
  const isOnOtherShift = !isOwner
    && !!userActiveShift
    && userActiveShift.id !== shift.id
    && !isAvailable
    && !isAssigned;
  const otherShiftLabel = userActiveShift?.name || userActiveShift?.role?.name || "Any Role";
  const isFull = assignedCount >= needed;
  const roleLabel = shift.name || shift.role?.name || "Any Role";

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
        setCheering(true);
        setTimeout(() => setCheering(false), 900);
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

  // Volunteer (non-owner) tooltip
  const volunteerTitle = !canVolunteer
    ? "You do not have this role"
    : isOnOtherShift
      ? `You're volunteering as ${otherShiftLabel} for this event`
      : isConfirmed
        ? `Confirmed for ${roleLabel}`
        : isAssigned
          ? `Assigned to ${roleLabel} — tap to withdraw`
          : isAvailable
            ? `Available for ${roleLabel} — tap to remove`
            : isFull
              ? `${roleLabel} is full`
              : `Volunteer for ${roleLabel}`;

  const ownerHasAssignees = isOwner && shift.assignments.length > 0;

  return (
    <div className="relative flex items-center group/role">
      <div
        role="button"
        aria-pressed={!isOwner ? (isAvailable || isAssigned) : undefined}
        onClick={!isOwner && !isOnOtherShift ? handleToggle : undefined}
        className={`relative flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 ${ownerHasAssignees ? "rounded-lg" : "rounded-full"} text-xs sm:text-sm font-medium transition-all duration-200 ${cheering ? "animate-cheer" : ""} ${isConfirmed
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/50 dark:hover:bg-emerald-950/60"
          : isAssigned
            ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900/50 dark:hover:bg-blue-950/60"
            : isAvailable
              ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-900/50 dark:hover:bg-indigo-950/60"
              : isOnOtherShift
                ? "bg-muted/40 text-muted-foreground ring-1 ring-border/60 opacity-60"
                : isFull && !isOwner
                  ? "bg-muted/30 text-muted-foreground ring-1 ring-border/60 opacity-70"
                  : "bg-card text-foreground ring-1 ring-border hover:ring-primary/60 hover:text-primary hover:bg-primary/5"
          } ${isLoading ? "opacity-70 cursor-wait" : ""} ${!isOwner && canVolunteer && !isOnOtherShift && !isFull ? "cursor-pointer" : !isOwner && (isAvailable || isAssigned) ? "cursor-pointer" : "cursor-default"}`}
        title={!isOwner ? volunteerTitle : ""}
      >
        {cheering && <ConfettiBurst />}
        {!isOwner ? (
          <>
            <VolunteerStatusIcon
              isConfirmed={isConfirmed}
              isAssigned={isAssigned}
              isAvailable={isAvailable}
              isOnOtherShift={isOnOtherShift}
              isFull={isFull}
            />
            <span className="truncate max-w-[10rem]">{roleLabel}</span>
            {needed > 1 && (
              <span className="text-[10px] font-semibold opacity-70 tabular-nums">
                {assignedCount}/{needed}
              </span>
            )}
          </>
        ) : (
          ownerHasAssignees ? (
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="font-semibold text-foreground/90 truncate max-w-[8rem]">
                {shift.name || shift.role?.name || "Any Role"}
              </span>
              <span
                className={`text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full ${assignedCount >= needed
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200"
                  : "bg-background/70 text-muted-foreground border border-border/60"
                  }`}
              >
                {assignedCount}/{needed}
              </span>
              <span className="w-px h-4 bg-border/70 mx-0.5" aria-hidden />
              <div className="flex items-center gap-1 flex-wrap">
                {shift.assignments.map((assignment: any) => {
                  const displayName: string = assignment.name || assignment.user?.name || assignment.email || assignment.user?.email || "?";
                  const initial = displayName.trim().charAt(0).toUpperCase();
                  const firstName = displayName.split(/[\s@]/)[0];
                  const confirmed = assignment.status === "CONFIRMED";
                  return (
                    <div
                      key={assignment.id}
                      className="group/asn flex items-center gap-1 pl-0.5 pr-1.5 py-0.5 rounded-full bg-background/70 dark:bg-background/30 hover:bg-background dark:hover:bg-background/60 transition-colors"
                      title={`${displayName} — ${confirmed ? "Confirmed" : "Pending"}`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold uppercase ring-2 ${confirmed
                          ? "ring-emerald-500/70 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200"
                          : "ring-blue-400/70 bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200"
                          }`}
                      >
                        {initial}
                      </span>
                      <span className="text-xs text-foreground/90 max-w-[7rem] truncate">{firstName}</span>
                      {!confirmed ? (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await confirmAssignmentAction(assignment.id, scheduleId);
                              toast.success("Confirmed");
                            } catch { toast.error("Failed"); }
                          }}
                          className="ml-0.5 w-4 h-4 flex items-center justify-center rounded-full text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors opacity-60 group-hover/asn:opacity-100"
                          title="Confirm"
                        >
                          <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 5.296a1 1 0 010 1.408l-7.5 7.5a1 1 0 01-1.408 0l-3.5-3.5a1 1 0 011.408-1.408L8.5 12.092l6.796-6.796a1 1 0 011.408 0z" clipRule="evenodd" /></svg>
                        </button>
                      ) : (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await unconfirmAssignmentAction(assignment.id, scheduleId);
                              toast.success("Unconfirmed");
                            } catch { toast.error("Failed"); }
                          }}
                          className="ml-0.5 w-4 h-4 flex items-center justify-center rounded-full text-amber-600 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors opacity-0 group-hover/asn:opacity-100"
                          title="Unconfirm"
                        >
                          <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a7 7 0 100 14 7 7 0 000-14zm3 8H7a1 1 0 110-2h6a1 1 0 110 2z" /></svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
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
      <div className="flex items-center bg-popover text-popover-foreground shadow-xl border border-border rounded-lg p-1 min-w-max">
        <button
          onClick={onOpenAssignUser}
          className="p-1.5 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md transition-all"
          title="Assign User"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </button>
        <div className="w-px h-4 bg-border mx-0.5"></div>
        <button
          onClick={async () => {
            const newName = prompt("Enter new name for this position:", shift.name || shift.role?.name || "Any Role");
            if (newName && newName.trim() !== "") {
              await updateShiftAction(shift.id, scheduleId, { name: newName.trim() });
            }
          }}
          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-all"
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
          className="p-1.5 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition-all"
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
          className="p-1.5 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-all"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground rounded-xl p-6 w-full max-w-md shadow-2xl border border-border animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-semibold mb-4">Assign User to Role</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-1">Select User with Role</label>
          <select
            className="w-full rounded-md border border-input bg-background text-foreground shadow-sm focus:border-ring focus:ring-ring px-2.5 py-1.5 text-sm transition-colors"
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
          <div className="flex-grow border-t border-border"></div>
          <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs">OR</span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-1">Enter Name Manually</label>
          <input
            type="text"
            className="w-full rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground shadow-sm focus:border-ring focus:ring-ring px-2.5 py-1.5 text-sm transition-colors"
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
            className="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-md hover:bg-muted/80 transition-colors"
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
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground rounded-xl p-6 w-full max-w-md shadow-2xl border border-border animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-semibold mb-4">Add Available User</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-1">Select Existing User</label>
          <select
            className="w-full rounded-md border border-input bg-background text-foreground shadow-sm focus:border-ring focus:ring-ring px-2.5 py-1.5 text-sm transition-colors"
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
          <div className="flex-grow border-t border-border"></div>
          <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs">OR</span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-1">Enter Email Manually</label>
          <input
            type="email"
            className="w-full rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground shadow-sm focus:border-ring focus:ring-ring px-2.5 py-1.5 text-sm transition-colors"
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
            className="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-md hover:bg-muted/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onAdd(selectedUser || email)}
            disabled={!selectedUser && !email}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        className="text-xs font-medium text-muted-foreground hover:text-primary border border-dashed border-border hover:border-primary/40 rounded-lg px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-all"
      >
        + Position
      </button>
      {isAddingPosition && (
        <div className="absolute right-0 top-full mt-2 bg-popover text-popover-foreground border border-border shadow-xl rounded-xl p-4 z-50 w-72 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
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
            <label className="block text-xs font-medium text-muted-foreground mb-2">Select Role</label>
            <select
              name="roleId"
              className="w-full text-sm border border-input bg-background text-foreground rounded-md focus:ring-ring focus:border-ring mb-3 px-2.5 py-1.5 transition-colors"
              size={5}
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              {!hasAnyShifts && (
                <option value="" className="py-1.5 px-2 cursor-pointer rounded font-medium text-primary">
                  Any Role (No Specific Role)
                </option>
              )}
              {allRoles.map((role: any) => (
                <option key={role.id} value={role.id} className="py-1.5 px-2 cursor-pointer rounded">
                  {role.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => router.push(`/schedules/${scheduleId}/roles`)}
              className="w-full text-sm font-medium text-primary hover:opacity-80 border border-dashed border-primary/40 hover:border-primary/60 hover:bg-primary/5 rounded-md px-3 py-2 mb-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              + Create New Role
            </button>

            <label className="block text-xs font-medium text-muted-foreground mb-1">Needed Count</label>
            <input
              type="number"
              name="needed"
              defaultValue={1}
              min={1}
              className="w-full text-sm border border-input bg-background text-foreground rounded-md focus:ring-ring focus:border-ring px-2.5 py-1.5 transition-colors"
            />

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsAddingPosition(false)}
                className="text-xs font-medium text-muted-foreground px-3 py-2 hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="text-xs font-medium bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary/90 shadow-sm transition-colors"
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
    <div className="border-t border-border">
      {isOwner && <AvailableVolunteersList shifts={shifts} scheduleId={scheduleId} planStatus={planStatus} />}
    </div>
  );
}

function AvailableVolunteersList({ shifts, scheduleId, planStatus }: any) {
  const hasAvailability = shifts.some((s: any) => s.availabilities?.length > 0);
  if (!hasAvailability) return null;

  return (
    <div className="mt-3">
      <h4 className="text-xs font-semibold text-muted-foreground mb-2">Available Users:</h4>
      <div className="flex flex-wrap gap-2">
        {shifts.flatMap((s: any) => (s.availabilities || []).map((a: any) => ({ ...a, shift: s }))).map((availability: any) => (
          <div
            key={availability.id}
            className="flex items-center gap-2 bg-primary/10 px-2.5 py-1.5 rounded-md text-xs border border-primary/20"
          >
            <span className="font-medium text-primary">{availability.user?.name || availability.user?.email}</span>
            {availability.shift?.role && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-card border border-border shadow-sm"
                style={{ color: availability.shift.role.color || 'var(--foreground)' }}
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
              className="ml-1 text-primary hover:opacity-80 font-bold p-0.5 hover:bg-primary/15 rounded"
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
              className="ml-1 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-bold p-0.5 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
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

