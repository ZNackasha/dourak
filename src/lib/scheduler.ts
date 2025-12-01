export type SchedulerShift = {
  id: string;
  roleId: string | null;
  start: Date;
  end: Date;
  assignments: { userId: string | null; status: string }[];
};

export type SchedulerUser = {
  id: string;
  roleIds: string[];
  availableEvents?: string[]; // ISO Date strings YYYY-MM-DD
};

export type ScheduleResult = {
  shiftId: string;
  userId: string;
};

export function generateSchedule(
  shifts: SchedulerShift[],
  users: SchedulerUser[]
): ScheduleResult[] {
  const results: ScheduleResult[] = [];

  // Track user assignments to prevent double booking
  // Map<UserId, Array<{start, end}>>
  const userSchedules = new Map<string, { start: Date; end: Date }[]>();

  // Helper to check if user is busy
  const isUserBusy = (userId: string, start: Date, end: Date) => {
    const busyTimes = userSchedules.get(userId) || [];
    return busyTimes.some(
      (time) =>
        (start >= time.start && start < time.end) ||
        (end > time.start && end <= time.end) ||
        (start <= time.start && end >= time.end)
    );
  };

  // Helper to check availability
  const isUserAvailable = (user: SchedulerUser, date: Date) => {
    if (!user.availableEvents) return true; // Assume available if not specified
    const dateString = date.toISOString().split("T")[0];
    return user.availableEvents.includes(dateString);
  };

  // Sort shifts by start time to fill earlier ones first
  const sortedShifts = [...shifts].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  for (const shift of sortedShifts) {
    // Check if shift is already filled
    const isFilled = shift.assignments.some((a) => a.status === "CONFIRMED");
    if (isFilled) continue;

    // Find eligible users
    const eligibleUsers = users.filter((user) => {
      // 1. Must have role (if shift requires one)
      if (shift.roleId && !user.roleIds.includes(shift.roleId)) {
        return false;
      }

      // 2. Must be available on that date
      if (!isUserAvailable(user, shift.start)) {
        return false;
      }

      // 3. Must not be busy
      if (isUserBusy(user.id, shift.start, shift.end)) {
        return false;
      }

      return true;
    });

    if (eligibleUsers.length > 0) {
      // Strategy: Pick the user with the fewest assignments so far (Load Balancing)
      // Or just random. Let's do simple load balancing.
      eligibleUsers.sort((a, b) => {
        const countA = userSchedules.get(a.id)?.length || 0;
        const countB = userSchedules.get(b.id)?.length || 0;
        return countA - countB;
      });

      const selectedUser = eligibleUsers[0];

      // Assign
      results.push({
        shiftId: shift.id,
        userId: selectedUser.id,
      });

      // Mark busy
      const busy = userSchedules.get(selectedUser.id) || [];
      busy.push({ start: shift.start, end: shift.end });
      userSchedules.set(selectedUser.id, busy);
    }
  }

  return results;
}

