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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {sortedShifts.map((shift: any) => {
                      const roleName = shift.name || shift.role?.name || "Any Role";
                      const roleColor = shift.role?.color || "#9ca3af";

                      if (shift.assignments.length === 0) {
                        return (
                          <div
                            key={shift.id}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs border border-zinc-200 bg-zinc-50/50 text-zinc-500 hover:bg-zinc-100 transition-colors cursor-default"
                            title={`${roleName}: Unassigned`}
                          >
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: roleColor }}
                            />
                            <span className="font-medium flex-shrink-0">{roleName}:</span>
                            <span className="italic opacity-70">Unassigned</span>
                          </div>
                        );
                      }

                      return shift.assignments.map((assignment: any) => (
                        <div key={assignment.id} className="relative group">
                          {/* Base Card */}
                          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs border border-zinc-200 bg-white text-zinc-700 shadow-sm">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: roleColor }}
                            />
                            <span className="font-medium flex-shrink-0">{roleName}:</span>
                            <span className="truncate">
                              {assignment.name || assignment.user?.name || assignment.email}
                            </span>
                            <span
                              className={`w-1.5 h-1.5 rounded-full ml-auto flex-shrink-0 ${assignment.status === 'CONFIRMED' ? 'bg-emerald-500' : 'bg-blue-400'}`}
                            />
                          </div>

                          {/* Hover Card (Expanded) */}
                          <div className="hidden group-hover:flex absolute top-0 left-0 min-w-full w-auto items-center gap-2 px-2 py-1.5 rounded-md text-xs border border-zinc-300 bg-white text-zinc-700 shadow-md z-50 whitespace-nowrap">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: roleColor }}
                            />
                            <span className="font-medium flex-shrink-0">{roleName}:</span>
                            <span>
                              {assignment.name || assignment.user?.name || assignment.email}
                            </span>
                            <span
                              className={`w-1.5 h-1.5 rounded-full ml-auto flex-shrink-0 ${assignment.status === 'CONFIRMED' ? 'bg-emerald-500' : 'bg-blue-400'}`}
                            />
                          </div>
                        </div>
                      ));
                    })}
                    {sortedShifts.length === 0 && (
                      <span className="text-zinc-400 italic text-xs col-span-full">No positions scheduled</span>
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
