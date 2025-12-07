"use client";

import { format } from "date-fns";

interface ScheduleMatrixProps {
  events: any[];
  allRoles: any[];
}

export function ScheduleMatrix({ events, allRoles }: ScheduleMatrixProps) {
  // Group events by start time to create rows
  // Note: If multiple events start at the same time (e.g. different rooms), 
  // we might want to group them or show them as separate rows.
  // For now, let's assume events at the same time are part of the same "slot" 
  // if they are part of the same plan.
  
  // Actually, the events passed here are from a single plan.
  // Often a plan has one main event per week, or multiple.
  // Let's treat each `event` as a row for now.
  
  return (
    <div className="overflow-x-auto border border-zinc-200 rounded-xl shadow-sm bg-white">
      <table className="w-full text-sm text-left">
        <thead className="bg-zinc-50 text-zinc-500 font-medium border-b border-zinc-200">
          <tr>
            <th className="px-4 py-3 whitespace-nowrap w-48 sticky left-0 bg-zinc-50 z-10">Date & Time</th>
            <th className="px-4 py-3 whitespace-nowrap w-48">Event</th>
            {allRoles.map((role) => (
              <th key={role.id} className="px-4 py-3 whitespace-nowrap min-w-[150px]">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: role.color || '#ccc' }}
                  />
                  {role.name}
                </div>
              </th>
            ))}
            <th className="px-4 py-3 whitespace-nowrap min-w-[150px]">Other / General</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {events.map((event) => {
            const dateStr = format(new Date(event.start), "EEE, MMM d");
            const timeStr = format(new Date(event.start), "h:mm a");

            return (
              <tr key={event.id} className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-zinc-900 sticky left-0 bg-white group-hover:bg-zinc-50/50">
                  <div className="flex flex-col">
                    <span>{dateStr}</span>
                    <span className="text-zinc-500 font-normal text-xs">{timeStr}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {event.title}
                </td>
                
                {/* Role Columns */}
                {allRoles.map((role) => {
                  // Find shifts for this role in this event
                  const shifts = event.shifts.filter((s: any) => s.roleId === role.id);
                  
                  if (shifts.length === 0) {
                    return (
                      <td key={role.id} className="px-4 py-3 bg-zinc-50/30">
                        <span className="text-zinc-300 text-xs">-</span>
                      </td>
                    );
                  }

                  return (
                    <td key={role.id} className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-1.5">
                        {shifts.map((shift: any) => (
                          <div key={shift.id} className="flex flex-col gap-1">
                            {shift.assignments.length > 0 ? (
                              shift.assignments.map((assignment: any) => (
                                <div 
                                  key={assignment.id} 
                                  className={`px-2 py-1 rounded text-xs font-medium border flex items-center gap-1.5 ${
                                    assignment.status === 'CONFIRMED' 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                      : 'bg-blue-50 text-blue-700 border-blue-100'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    assignment.status === 'CONFIRMED' ? 'bg-emerald-500' : 'bg-blue-400'
                                  }`} />
                                  {assignment.name || assignment.user?.name || assignment.email}
                                </div>
                              ))
                            ) : (
                              <div className="px-2 py-1 rounded text-xs border border-dashed border-zinc-300 text-zinc-400 italic">
                                Empty
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  );
                })}

                {/* General/No Role Column */}
                <td className="px-4 py-3 align-top">
                  {(() => {
                    const genericShifts = event.shifts.filter((s: any) => !s.roleId);
                    if (genericShifts.length === 0) return <span className="text-zinc-300 text-xs">-</span>;

                    return (
                      <div className="flex flex-col gap-1.5">
                        {genericShifts.map((shift: any) => (
                          <div key={shift.id} className="flex flex-col gap-1">
                            {shift.assignments.length > 0 ? (
                              shift.assignments.map((assignment: any) => (
                                <div 
                                  key={assignment.id} 
                                  className={`px-2 py-1 rounded text-xs font-medium border flex items-center gap-1.5 ${
                                    assignment.status === 'CONFIRMED' 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                      : 'bg-blue-50 text-blue-700 border-blue-100'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    assignment.status === 'CONFIRMED' ? 'bg-emerald-500' : 'bg-blue-400'
                                  }`} />
                                  {assignment.name || assignment.user?.name || assignment.email}
                                </div>
                              ))
                            ) : (
                              <div className="px-2 py-1 rounded text-xs border border-dashed border-zinc-300 text-zinc-400 italic">
                                Empty
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
