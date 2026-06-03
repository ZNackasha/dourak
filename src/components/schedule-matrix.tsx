"use client";

import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <Card className="overflow-hidden border-0 sm:border">
      <div className="overflow-x-auto">
        <Table className="w-full text-sm block md:table">
          <TableHeader className="bg-muted/50 hidden md:table-header-group">
            <TableRow>
              <TableHead className="w-48 whitespace-nowrap">Date & Time</TableHead>
              <TableHead className="w-48 whitespace-nowrap">Event</TableHead>
              <TableHead className="whitespace-nowrap">Scheduled Volunteers</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="block md:table-row-group">
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
                : { bg: "bg-muted", border: "border-l-muted" };

              return (
                <TableRow
                  key={event.id}
                  className={`flex flex-wrap md:table-row border-b md:border-b last:border-b-0 border-l-4 md:border-l-0 ${seriesColor.border} relative group/row hover:bg-muted/50 transition-colors`}
                >
                  <TableCell className="pl-3 pr-1 py-1.5 md:px-4 md:py-3 font-medium align-top block w-1/2 md:w-auto md:table-cell relative border-b-0 md:border-b">
                    <div className={`hidden md:block absolute left-0 top-0 bottom-0 w-1.5 ${seriesColor.bg}`} />
                    <span className="md:hidden text-[10px] text-muted-foreground uppercase tracking-wider font-bold block mb-0.5">Date</span>
                    <div className="flex flex-col xl:flex-row gap-0 xl:gap-2 items-start xl:items-baseline">
                      <span className="whitespace-nowrap text-sm leading-tight text-foreground">{dateStr}</span>
                      <span className="text-muted-foreground font-normal text-xs whitespace-nowrap leading-tight">{timeStr}</span>
                    </div>
                  </TableCell>

                  <TableCell className="pl-1 pr-3 py-1.5 md:px-4 md:py-3 align-top block w-1/2 md:w-auto md:table-cell border-b-0 md:border-b">
                    <span className="md:hidden text-[10px] text-muted-foreground uppercase tracking-wider font-bold block mb-0.5">Event</span>
                    <div className="text-sm leading-tight truncate text-foreground/80">{event.title}</div>
                  </TableCell>

                  <TableCell className="px-3 py-1.5 md:px-4 md:py-3 align-top block w-full md:w-auto md:table-cell border-t md:border-t-0 md:border-b border-border/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {sortedShifts.map((shift: any) => {
                        const roleName = shift.name || shift.role?.name || "Any Role";
                        const roleColor = shift.role?.color || "#9ca3af";

                        if (shift.assignments.length === 0) {
                          return (
                            <div
                              key={shift.id}
                              className="flex items-center gap-2 min-w-0 px-2 py-1.5 rounded-md text-xs border border-dashed bg-muted/40 text-muted-foreground hover:bg-muted transition-colors cursor-default"
                              title={`${roleName}: Unassigned`}
                            >
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: roleColor }}
                              />
                              <span className="font-medium truncate min-w-0">{roleName}</span>
                              <span className="italic opacity-70 ml-auto flex-shrink-0">Unassigned</span>
                            </div>
                          );
                        }

                        return shift.assignments.map((assignment: any) => (
                          <div key={assignment.id} className="relative group min-w-0">
                            {/* Base Card */}
                            <div className="flex items-center gap-2 min-w-0 px-2 py-1.5 rounded-md text-xs border bg-background text-foreground shadow-sm">
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: roleColor }}
                              />
                              <span className="font-medium flex-shrink-0 max-w-[40%] truncate">{roleName}:</span>
                              <span className="truncate min-w-0">
                                {assignment.name || assignment.user?.name || assignment.email}
                              </span>
                              <span
                                className={`w-2 h-2 rounded-full ml-auto flex-shrink-0 ${assignment.status === 'CONFIRMED' ? 'bg-emerald-500' : 'bg-blue-400'}`}
                                title={assignment.status === 'CONFIRMED' ? 'Confirmed' : 'Unconfirmed'}
                              />
                            </div>

                            {/* Hover Card (Expanded) */}
                            <div className="hidden group-hover:flex absolute top-0 left-0 min-w-full w-auto items-center gap-2 px-2 py-1.5 rounded-md text-xs border border-primary/20 bg-background text-foreground shadow-md z-50 whitespace-nowrap">
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: roleColor }}
                              />
                              <span className="font-medium flex-shrink-0">{roleName}:</span>
                              <span>
                                {assignment.name || assignment.user?.name || assignment.email}
                              </span>
                              <span
                                className={`w-2 h-2 rounded-full ml-auto flex-shrink-0 ${assignment.status === 'CONFIRMED' ? 'bg-emerald-500' : 'bg-blue-400'}`}
                              />
                            </div>
                          </div>
                        ));
                      })}
                      {sortedShifts.length === 0 && (
                        <span className="text-muted-foreground italic text-xs col-span-full">No positions scheduled</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
