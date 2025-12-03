export type SchedulerEvent = {
  id: string;
  roleId: string | null;
  start: Date;
  end: Date;
  assignments: { userId: string | null; status: string }[];
};

export type UserRole = {
  roleId: string;
  type: "required" | "optional";
};

export type SchedulerUser = {
  id: string;
  roles: UserRole[];
  availableEvents?: string[]; // Event IDs
};

export type ScheduleResult = {
  eventId: string;
  userId: string;
};

export function generateSchedule(
  events: SchedulerEvent[],
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
  const isUserAvailable = (user: SchedulerUser, event: SchedulerEvent) => {
    if (!user.availableEvents) return true; // Assume available if not specified
    return user.availableEvents.includes(event.id);
  };

  // Sort events by start time to fill earlier ones first
  const sortedEvents = [...events].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  for (const event of sortedEvents) {
    // Check if event is already filled
    const isFilled = event.assignments.some((a) => a.status === "CONFIRMED");
    if (isFilled) continue;

    // Find eligible users
    const eligibleUsers = users.filter((user) => {
      // 1. Must have role (if event requires one)
      if (event.roleId) {
        const hasRole = user.roles.some((r) => r.roleId === event.roleId);
        if (!hasRole) return false;
      }

      // 2. Must be available for that event
      if (!isUserAvailable(user, event)) {
        return false;
      }

      // 3. Must not be busy
      if (isUserBusy(user.id, event.start, event.end)) {
        return false;
      }

      return true;
    });

    if (eligibleUsers.length > 0) {
      // Strategy:
      // 1. Prioritize 'required' roles over 'optional'
      // 2. Pick the user with the fewest assignments so far (Load Balancing)
      eligibleUsers.sort((a, b) => {
        // Priority 1: Role Type
        if (event.roleId) {
          const roleA = a.roles.find((r) => r.roleId === event.roleId);
          const roleB = b.roles.find((r) => r.roleId === event.roleId);

          if (roleA?.type === "required" && roleB?.type !== "required")
            return -1;
          if (roleB?.type === "required" && roleA?.type !== "required")
            return 1;
        }

        // Priority 2: Load Balancing
        const countA = userSchedules.get(a.id)?.length || 0;
        const countB = userSchedules.get(b.id)?.length || 0;
        return countA - countB;
      });

      const selectedUser = eligibleUsers[0];

      // Assign
      results.push({
        eventId: event.id,
        userId: selectedUser.id,
      });

      // Mark busy
      const busy = userSchedules.get(selectedUser.id) || [];
      busy.push({ start: event.start, end: event.end });
      userSchedules.set(selectedUser.id, busy);
    }
  }

  return results;
}

