"use client";

import { useState } from "react";
import { toast } from "sonner";
import { EventCard } from "@/components/event-card";
import { ScheduleMatrix } from "@/components/schedule-matrix";
import { volunteerForMultipleEventsAction, cancelMultipleVolunteersAction } from "@/app/actions/assignment";
import { updatePlanStatusAction, deletePlanAction, sendScheduleNotificationsAction } from "@/app/actions/schedule";

interface ScheduleViewProps {
  schedule: any;
  plan: any;
  events: any[];
  isOwner: boolean;
  userRoleIds: string[];
  allRoles: any[];
  currentUserId: string;
  scheduleUsers?: any[];
}

function DateGroup({
  date,
  events,
  schedule,
  isOwner,
  currentUserId,
  userRoleIds,
  allRoles,
  planStatus,
  scheduleUsers,
  recurringInstances,
  onVolunteerAll,
  volunteeringDate
}: {
  date: string;
  events: any[];
  schedule: any;
  isOwner: boolean;
  currentUserId: string;
  userRoleIds: string[];
  allRoles: any[];
  planStatus: string;
  scheduleUsers: any[];
  recurringInstances: Map<string, any[]>;
  onVolunteerAll: (date: string, events: any[], action: "volunteer" | "cancel") => void;
  volunteeringDate: string | null;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const eligibleEvents = events.filter((event: any) => {
    if (event.shifts.length === 0) return true;
    return event.shifts.some((shift: any) => {
      const rId = shift.roleId || shift.role?.id;
      if (!rId) return true;
      return userRoleIds.includes(rId);
    });
  });

  const isFullyBooked = eligibleEvents.length > 0 && eligibleEvents.every((event: any) =>
    event.shifts.some((shift: any) =>
      shift.assignments.some((a: any) => a.userId === currentUserId) ||
      shift.availabilities?.some((a: any) => a.userId === currentUserId)
    )
  );

  return (
    <div className="space-y-4">
      <div
        className="flex items-center justify-between sticky top-0 bg-zinc-50/95 backdrop-blur-sm z-10 py-3 border-b border-zinc-200/50 group"
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:text-zinc-600 transition-colors focus:outline-none"
        >
          <svg
            className={`w-5 h-5 text-zinc-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h2 className="text-lg font-semibold text-zinc-900">{date}</h2>
          <span className="text-sm text-zinc-400 font-normal ml-2">
            ({events.length} event{events.length !== 1 ? 's' : ''})
          </span>
        </button>

        {!isOwner && currentUserId && eligibleEvents.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onVolunteerAll(date, events, isFullyBooked ? "cancel" : "volunteer");
            }}
            disabled={volunteeringDate === date}
            className={`text-sm font-medium px-4 py-1.5 rounded-full transition-colors border ${isFullyBooked
              ? "text-red-600 border-red-200 hover:bg-red-50"
              : "text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              }`}
          >
            {volunteeringDate === date ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Updating...
              </span>
            ) : isFullyBooked ? (
              "Not available"
            ) : (
              "I'm available all day"
            )}
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
          {events.map((event: any) => {
            const relatedEvents = (isOwner && event.recurringEventId)
              ? recurringInstances.get(event.recurringEventId)
              : undefined;

            return (
              <EventCard
                key={event.id}
                event={event}
                scheduleId={schedule.id}
                isOwner={isOwner}
                currentUserId={currentUserId}
                userRoleIds={userRoleIds}
                allRoles={allRoles}
                planStatus={planStatus}
                scheduleUsers={scheduleUsers}
                relatedEvents={relatedEvents}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ScheduleView({
  schedule,
  plan,
  events,
  isOwner,
  userRoleIds: initialUserRoleIds,
  allRoles,
  currentUserId,
  scheduleUsers = [],
}: ScheduleViewProps) {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedRoleIds, setImpersonatedRoleIds] = useState<string[]>([]);
  const [volunteeringDate, setVolunteeringDate] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const viewMode = (plan.status === "SCHEDULED" || plan.status === "ARCHIVED") ? "matrix" : "cards";

  const activeUserRoleIds = isImpersonating ? impersonatedRoleIds : initialUserRoleIds;
  const activeIsOwner = isImpersonating ? false : isOwner;

  const toggleImpersonatedRole = (roleId: string) => {
    setImpersonatedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleStatusChange = async (newStatus: string) => {
    await updatePlanStatusAction(plan.id, schedule.id, newStatus as any);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/schedules/${schedule.id}/plans/${plan.id}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDeletePlan = async () => {
    toast("Are you sure you want to delete this plan? This action cannot be undone.", {
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await deletePlanAction(plan.id, schedule.id);
            toast.success("Plan deleted");
          } catch (error) {
            console.error("Failed to delete plan:", error);
            toast.error("Failed to delete plan");
          }
        }
      },
      cancel: {
        label: "Cancel",
        onClick: () => { }
      }
    });
  };

  const handleSendNotifications = async () => {
    toast("Are you sure you want to send schedule notifications to all assigned users?", {
      action: {
        label: "Send",
        onClick: async () => {
          try {
            await sendScheduleNotificationsAction(plan.id, schedule.id);
            toast.success("Notifications sent successfully!");
          } catch (error) {
            console.error("Failed to send notifications:", error);
            toast.error("Failed to send notifications");
          }
        }
      },
      cancel: {
        label: "Cancel",
        onClick: () => { }
      }
    });
  };

  const handleVolunteerAll = async (date: string, dateEvents: any[], action: "volunteer" | "cancel") => {
    setVolunteeringDate(date);
    try {
      const assignments: { eventId: string; shiftId?: string }[] = [];

      for (const event of dateEvents) {
        if (action === "cancel") {
          // Find shifts user is assigned/available for
          const myShifts = event.shifts.filter((shift: any) =>
            shift.assignments.some((a: any) => a.userId === currentUserId) ||
            shift.availabilities?.some((a: any) => a.userId === currentUserId)
          );

          myShifts.forEach((s: any) => {
            assignments.push({ eventId: event.id, shiftId: s.id });
          });
        } else {
          // Volunteer logic
          // Check if already assigned/available
          const isAssigned = event.shifts.some((shift: any) =>
            shift.assignments.some((a: any) => a.userId === currentUserId) ||
            shift.availabilities?.some((a: any) => a.userId === currentUserId)
          );
          if (isAssigned) continue;

          let targetShiftId: string | undefined = undefined;
          let canVolunteer = false;

          const matchingShift = event.shifts.find((shift: any) => {
            const rId = shift.roleId || shift.role?.id;
            return rId && activeUserRoleIds.includes(rId);
          });

          if (matchingShift) {
            targetShiftId = matchingShift.id;
            canVolunteer = true;
          } else {
            const genericShift = event.shifts.find((shift: any) => !shift.roleId);
            if (genericShift) {
              targetShiftId = genericShift.id;
              canVolunteer = true;
            } else if (event.shifts.length === 0) {
              // No shifts defined, allow generic
              targetShiftId = undefined;
              canVolunteer = true;
            }
          }

          if (canVolunteer) {
            assignments.push({ eventId: event.id, shiftId: targetShiftId });
          }
        }
      }

      if (assignments.length > 0) {
        if (action === "volunteer") {
          await volunteerForMultipleEventsAction(schedule.id, assignments);
        } else {
          await cancelMultipleVolunteersAction(schedule.id, assignments);
        }
      }
    } finally {
      setVolunteeringDate(null);
    }
  };

  // Group recurring events for the owner to pass to EventCard
  const recurringInstances = new Map<string, any[]>();
  if (isOwner) {
    events.forEach((event) => {
      if (event.recurringEventId) {
        if (!recurringInstances.has(event.recurringEventId)) {
          recurringInstances.set(event.recurringEventId, []);
        }
        recurringInstances.get(event.recurringEventId)?.push(event);
      }
    });
  }

  // Filter events based on view mode
  const getVisibleEvents = () => {
    let visibleEvents = events;

    if (isOwner && !isImpersonating && viewMode === "cards") {
      const seenRecurringIds = new Set<string>();
      visibleEvents = visibleEvents.filter((event) => {
        if (event.recurringEventId) {
          if (seenRecurringIds.has(event.recurringEventId)) {
            return false;
          }
          seenRecurringIds.add(event.recurringEventId);
        }
        return true;
      });
    }
    // ... existing logic ...

    // Filter out events that are not visible to the current user (or impersonated role)
    // This matches the logic in EventCard
    if (!activeIsOwner) {
      if (viewMode === "matrix") {
        // In matrix view (Scheduled), users only see their own assignments
        visibleEvents = visibleEvents
          .map((event) => {
            // Find shifts where the current user is assigned
            const userShifts = event.shifts.filter((s: any) =>
              s.assignments.some((a: any) => a.userId === currentUserId)
            );

            if (userShifts.length === 0) return null;

            return { ...event, shifts: userShifts };
          })
          .filter((e): e is typeof events[0] => e !== null);
      } else {
        visibleEvents = visibleEvents.filter((event) => {
          const shifts = event.shifts;
          const hasRoles = shifts.some((s: any) => s.roleId);

          if (hasRoles) {
            const hasMatchingRole = shifts.some((s: any) => {
              const rId = s.roleId || s.role?.id;
              return rId && activeUserRoleIds.includes(rId);
            });
            const isAssigned = shifts.some((s: any) =>
              s.assignments.some((a: any) => a.userId === currentUserId)
            );

            if (!hasMatchingRole && !isAssigned) {
              return false;
            }
          }
          return true;
        });
      }
    }

    return visibleEvents;
  };

  const filteredEvents = getVisibleEvents();

  // Group events by date
  const eventsByDate = filteredEvents.reduce((groups: { date: string; events: any[] }[], event: any) => {
    const dateKey = new Date(event.start).toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.date === dateKey) {
      lastGroup.events.push(event);
    } else {
      groups.push({ date: dateKey, events: [event] });
    }
    return groups;
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-6">
        {!currentUserId && (
          <div className="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
            <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-indigo-900">Guest View</h3>
              <p className="text-sm text-indigo-700 mt-1 leading-relaxed">
                You are viewing this schedule as a guest. <a href="/api/auth/signin" className="underline hover:text-indigo-900 font-medium decoration-indigo-300 underline-offset-2">Sign in</a> to see events that match your roles and to volunteer.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
          <div className="space-y-2">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
                <a href={`/schedules/${schedule.id}`} className="hover:text-zinc-600 transition-colors">
                  {schedule.name}
                </a>
              </h1>
              <span className="text-zinc-300 text-2xl font-light">/</span>
              <span className="text-2xl font-medium text-zinc-500">{plan.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 bg-zinc-50 w-fit px-3 py-1 rounded-full border border-zinc-100">
              <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {plan.startDate.toLocaleDateString(undefined, { dateStyle: 'medium' })} - {plan.endDate.toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isOwner && (
              <>
                <div className="flex items-center gap-2 bg-zinc-50 p-1 rounded-xl border border-zinc-200">
                  <select
                    value={plan.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="appearance-none cursor-pointer px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors shadow-sm focus:ring-indigo-500 focus:border-indigo-500 pr-8"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: `right 0.5rem center`,
                      backgroundRepeat: `no-repeat`,
                      backgroundSize: `1.2em 1.2em`,
                      paddingRight: `2rem`
                    }}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="RECRUITMENT">Recruitment</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>

                  <div className="h-4 w-px bg-zinc-200 mx-1"></div>

                  <div className="relative group/share">
                    <button
                      onClick={handleShare}
                      disabled={plan.status === "DRAFT" || plan.status === "ARCHIVED"}
                      className={`p-1.5 rounded-lg transition-colors ${plan.status === "DRAFT" || plan.status === "ARCHIVED"
                        ? "text-zinc-300 cursor-not-allowed"
                        : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50"
                        }`}
                      title="Share Plan"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>
                  </div>

                  {plan.status === "SCHEDULED" && (
                    <button
                      onClick={handleSendNotifications}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50 transition-colors"
                      title="Send Notifications"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}

                  <button
                    onClick={handleDeletePlan}
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete Plan"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <button
                  onClick={() => setIsImpersonating(!isImpersonating)}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2 border rounded-xl text-sm font-medium transition-all shadow-sm ${isImpersonating
                    ? "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300"
                    }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {isImpersonating ? "Exit View" : "User View"}
                </button>
              </>
            )}
          </div>
        </div>

        {isOwner && isImpersonating && (
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0c0 .884-.56 1.6-1.357 1.994M16 6c0 .884.56 1.6 1.357 1.994" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-indigo-900">Impersonating Roles</h3>
                <p className="text-xs text-indigo-600">Select roles to see what they see</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {allRoles.map((role) => {
                const isSelected = impersonatedRoleIds.includes(role.id);
                return (
                  <button
                    key={role.id}
                    onClick={() => toggleImpersonatedRole(role.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-200 ring-offset-1"
                      : "bg-white text-zinc-600 border-zinc-200 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm"
                      }`}
                  >
                    {role.name}
                    {isSelected && " ✓"}
                  </button>
                );
              })}
              {allRoles.length === 0 && (
                <span className="text-xs text-zinc-400 italic">No roles available to impersonate.</span>
              )}
            </div>
          </div>
        )}
      </div>

      {viewMode === "cards" ? (
        <div className="space-y-8">
          {activeIsOwner ? (
            <div className="space-y-4">
              {filteredEvents.map((event: any) => {
                const relatedEvents = (activeIsOwner && event.recurringEventId)
                  ? recurringInstances.get(event.recurringEventId)
                  : undefined;

                return (
                  <EventCard
                    key={event.id}
                    event={event}
                    scheduleId={schedule.id}
                    isOwner={activeIsOwner}
                    currentUserId={currentUserId}
                    userRoleIds={activeUserRoleIds}
                    allRoles={allRoles}
                    planStatus={plan.status}
                    scheduleUsers={scheduleUsers}
                    relatedEvents={relatedEvents}
                  />
                );
              })}
            </div>
          ) : (
            eventsByDate.map(({ date, events: dateEvents }) => (
              <DateGroup
                key={date}
                date={date}
                events={dateEvents}
                schedule={schedule}
                isOwner={activeIsOwner}
                currentUserId={currentUserId}
                userRoleIds={activeUserRoleIds}
                allRoles={allRoles}
                planStatus={plan.status}
                scheduleUsers={scheduleUsers}
                recurringInstances={recurringInstances}
                onVolunteerAll={handleVolunteerAll}
                volunteeringDate={volunteeringDate}
              />
            ))
          )}
          {filteredEvents.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-zinc-200">
              <p className="text-zinc-500">No events found in this schedule.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto pb-10">
          <ScheduleMatrix events={filteredEvents} allRoles={allRoles} />
        </div>
      )}
    </div>
  );
}
