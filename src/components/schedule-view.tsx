"use client";

import { useState } from "react";
import { EventCard } from "@/components/event-card";
import { ScheduleMatrix } from "@/components/schedule-matrix";
import { volunteerForMultipleEventsAction } from "@/app/actions/volunteer";
import { updatePlanStatusAction } from "@/app/actions/schedule";

interface ScheduleViewProps {
  schedule: any;
  plan: any;
  events: any[];
  isOwner: boolean;
  userRoleIds: string[];
  allRoles: any[];
  currentUserId: string;
}

export function ScheduleView({
  schedule,
  plan,
  events,
  isOwner,
  userRoleIds: initialUserRoleIds,
  allRoles,
  currentUserId,
}: ScheduleViewProps) {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedRoleIds, setImpersonatedRoleIds] = useState<string[]>([]);
  const [volunteeringDate, setVolunteeringDate] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const viewMode = (plan.status === "PUBLISHED" || plan.status === "COMPLETED") ? "matrix" : "cards";

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

  const handleVolunteerAll = async (date: string, dateEvents: any[]) => {
    setVolunteeringDate(date);
    try {
      const assignments: { eventId: string; shiftId?: string }[] = [];

      for (const event of dateEvents) {
        // Check if already assigned
        const isAssigned = event.shifts.some((shift: any) =>
          shift.assignments.some((a: any) => a.userId === currentUserId)
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

      if (assignments.length > 0) {
        await volunteerForMultipleEventsAction(schedule.id, assignments);
      }
    } finally {
      setVolunteeringDate(null);
    }
  };

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

    // Filter out events that are not visible to the current user (or impersonated role)
    // This matches the logic in EventCard
    if (!activeIsOwner) {
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

    return visibleEvents;
  };

  const filteredEvents = getVisibleEvents();

  // Group events by date
  const eventsByDate = filteredEvents.reduce((acc: any, event: any) => {
    const dateKey = new Date(event.start).toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-4">
        {!currentUserId && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-indigo-900">Guest View</h3>
              <p className="text-sm text-indigo-700 mt-1">
                You are viewing this schedule as a guest. <a href="/api/auth/signin" className="underline hover:text-indigo-900 font-medium">Sign in</a> to see events that match your roles and to volunteer.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
              <a href={`/schedules/${schedule.id}`} className="hover:underline hover:text-zinc-700 transition-colors">
                {schedule.name}
              </a> <span className="text-zinc-400 font-normal">/ {plan.name}</span>
            </h1>
            <div className="flex items-center gap-2 mt-2 text-zinc-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {plan.startDate.toLocaleDateString(undefined, { dateStyle: 'medium' })} - {plan.endDate.toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isOwner && (
              <>
                <select
                  value={plan.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="text-sm border-zinc-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 py-2 pl-3 pr-8 w-full sm:w-auto"
                >
                  <option value="DRAFT">Draft (Hidden)</option>
                  <option value="OPEN">Open (Volunteers)</option>
                  <option value="PUBLISHED">Published (Final)</option>
                  <option value="COMPLETED">Completed</option>
                </select>

                <button
                  onClick={handleShare}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors shadow-sm flex-1 sm:flex-none"
                >
                  <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  {isCopied ? "Copied!" : "Share"}
                </button>

                <button
                  onClick={() => setIsImpersonating(!isImpersonating)}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors shadow-sm flex-1 sm:flex-none ${isImpersonating
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                    }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {isImpersonating ? "Exit View" : "Volunteer View"}
                </button>
              </>
            )}
          </div>
        </div>

        {isOwner && isImpersonating && (
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0c0 .884-.56 1.6-1.357 1.994M16 6c0 .884.56 1.6 1.357 1.994" />
              </svg>
              <h3 className="text-sm font-semibold text-indigo-900">Impersonating Roles</h3>
              <span className="text-xs text-indigo-600 ml-auto">Select roles to see what they see</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allRoles.map((role) => {
                const isSelected = impersonatedRoleIds.includes(role.id);
                return (
                  <button
                    key={role.id}
                    onClick={() => toggleImpersonatedRole(role.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white text-zinc-600 border-zinc-200 hover:border-indigo-300 hover:text-indigo-600"
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
        <div className="space-y-10">
          {Object.entries(eventsByDate).map(([date, events]: any) => {
            const canVolunteerForAny = events.some((event: any) => {
              const isAssigned = event.shifts.some((shift: any) =>
                shift.assignments.some((a: any) => a.userId === currentUserId)
              );
              if (isAssigned) return false;

              const hasMatchingShift = event.shifts.some((shift: any) => {
                const rId = shift.roleId || shift.role?.id;
                return (rId && activeUserRoleIds.includes(rId)) || !shift.roleId;
              });

              return hasMatchingShift || event.shifts.length === 0;
            });

            return (
              <div key={date} className="relative">
                <div className="sticky top-0 z-10 bg-zinc-50/95 backdrop-blur-sm py-3 mb-4 border-b border-zinc-200/50 flex justify-between items-center">
                  <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    {date}
                  </h2>
                  {canVolunteerForAny && !activeIsOwner && currentUserId && (
                    <button
                      onClick={() => handleVolunteerAll(date, events)}
                      disabled={volunteeringDate === date}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50 bg-indigo-50 px-3 py-1 rounded-full transition-colors"
                    >
                      {volunteeringDate === date
                        ? "Signing up..."
                        : "Volunteer for All"}
                    </button>
                  )}
                </div>
                <div className="grid gap-4">
                  {events.map((event: any) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      scheduleId={schedule.id}
                      isOwner={activeIsOwner}
                      currentUserId={currentUserId}
                      userRoleIds={activeUserRoleIds}
                      allRoles={allRoles}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          {Object.keys(eventsByDate).length === 0 && (
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
