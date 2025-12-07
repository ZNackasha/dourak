"use client";

import { format } from "date-fns";

const getSeriesColor = (id: string) => {
  const strId = String(id);
  const colors = [
    { bg: "bg-red-400", border: "border-l-red-400" },
    { bg: "bg-orange-400", border: "border-l-orange-400" },
    { bg: "bg-amber-400", border: "border-l-amber-400" },
    { bg: "bg-lime-400", border: "border-l-lime-400" },
    { bg: "bg-emerald-400", border: "border-l-emerald-400" },
    { bg: "bg-teal-400", border: "border-l-teal-400" },
    { bg: "bg-cyan-400", border: "border-l-cyan-400" },
    { bg: "bg-sky-400", border: "border-l-sky-400" },
    { bg: "bg-blue-400", border: "border-l-blue-400" },
    { bg: "bg-indigo-400", border: "border-l-indigo-400" },
    { bg: "bg-violet-400", border: "border-l-violet-400" },
    { bg: "bg-fuchsia-400", border: "border-l-fuchsia-400" },
    { bg: "bg-pink-400", border: "border-l-pink-400" },
    { bg: "bg-rose-400", border: "border-l-rose-400" }
  ];
  let hash = 0;
  for (let i = 0; i < strId.length; i++) {
    hash = strId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

interface ScheduleMatrixProps {
  events: any[];
  allRoles: any[];
}

export function ScheduleMatrix({ events, allRoles }: ScheduleMatrixProps) {
  return (
    <div className="overflow-x-auto border border-zinc-200 rounded-xl shadow-sm bg-white">
      <table className="w-full text-sm text-left block md:table">
        <thead className="bg-indigo-50/50 text-indigo-900 font-medium border-b border-indigo-100 hidden md:table-header-group">
          <tr>
            <th className="px-4 py-3 whitespace-nowrap w-48">Date & Time</th>
            <th className="px-4 py-3 whitespace-nowrap w-48">Event</th>
            <th className="px-4 py-3 whitespace-nowrap">Scheduled Volunteers</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-indigo-100 block md:table-row-group">
          {events.map((event) => {
            const dateStr = format(new Date(event.start), "EEE, MMM d");
            const timeStr = format(new Date(event.start), "h:mm a");

            // Collect all shifts and sort them by role order
            const sortedShifts = [...event.shifts].sort((a: any, b: any) => {
              // Put generic shifts last
              if (!a.roleId) return 1;
              if (!b.roleId) return -1;

              // Sort by role index in allRoles
              const indexA = allRoles.findIndex(r => r.id === a.roleId);
              const indexB = allRoles.findIndex(r => r.id === b.roleId);
              return indexA - indexB;
            });

            const seriesColor = event.recurringEventId
              ? getSeriesColor(event.recurringEventId)
              : { bg: "bg-zinc-100", border: "border-l-zinc-100" };

            return (
              <tr key={event.id} className={`even:bg-indigo-50/30 hover:bg-indigo-50/60 transition-colors flex flex-wrap md:table-row border-b border-indigo-100 md:border-none last:border-b-0 border-l-4 md:border-l-0 ${seriesColor.border}`}>
                <td className="pl-3 pr-1 py-1.5 md:px-4 md:py-3 font-medium text-indigo-900 align-top block w-1/2 md:w-auto md:table-cell relative">
                  <div className={`hidden md:block absolute left-0 top-0 bottom-0 w-1.5 ${seriesColor.bg}`} />
                  <span className="md:hidden text-[10px] text-indigo-400 uppercase tracking-wider font-bold block mb-0.5">Date</span>
                  <div className="flex flex-col xl:flex-row gap-0 xl:gap-2 items-start xl:items-baseline">
                    <span className="whitespace-nowrap text-sm leading-tight">{dateStr}</span>
                    <span className="text-indigo-600/80 font-normal text-xs whitespace-nowrap leading-tight">{timeStr}</span>
                  </div>
                </td>
                <td className="pl-1 pr-3 py-1.5 md:px-4 md:py-3 text-zinc-600 align-top block w-1/2 md:w-auto md:table-cell">
                  <span className="md:hidden text-[10px] text-zinc-400 uppercase tracking-wider font-bold block mb-0.5">Event</span>
                  <div className="text-sm leading-tight truncate">{event.title}</div>
                </td>
                <td className="px-3 py-1.5 md:px-4 md:py-3 align-top block w-full md:w-auto md:table-cell border-t border-indigo-50/50 md:border-t-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1 md:gap-y-2">
                    {sortedShifts.map((shift: any) => {
                      const role = shift.role || { name: "General", color: "#9ca3af" };
                      const hasAssignments = shift.assignments.length > 0;

                      return (
                        <div key={shift.id} className="flex items-start gap-2 min-w-[200px]">
                          <div className="flex items-center gap-2 mt-0.5 w-32 flex-shrink-0">
                            <div className="flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 bg-white w-full">
                              <div
                                className="w-2 h-2 rounded-full ring-1 ring-black/5 flex-shrink-0"
                                style={{ backgroundColor: role.color || '#ccc' }}
                              />
                              <span className="truncate" title={role.name}>
                                {role.name}
                              </span>
                            </div>
                          </div>

                          <div className="flex-1 flex flex-col gap-1">
                            {hasAssignments ? (
                              shift.assignments.map((assignment: any) => (
                                <div
                                  key={assignment.id}
                                  className="flex items-center gap-2 bg-zinc-50 px-2 py-1 rounded-md text-xs border border-zinc-100 w-fit"
                                >
                                  <span className="font-medium text-zinc-700 whitespace-nowrap">
                                    {assignment.name || assignment.user?.name || assignment.email}
                                  </span>
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${assignment.status === 'CONFIRMED' ? 'bg-emerald-500' : 'bg-blue-400'}`}
                                    title={assignment.status === 'CONFIRMED' ? 'Confirmed' : 'Pending'}
                                  />
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-zinc-300 italic px-1 py-0.5">Unassigned</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {sortedShifts.length === 0 && (
                      <span className="text-zinc-400 italic text-xs">No positions scheduled</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
