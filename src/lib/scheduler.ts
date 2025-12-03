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
  // 1. Group events by day to solve smaller sub-problems
  const eventsByDay = new Map<string, SchedulerEvent[]>();
  
  // Also track pre-existing assignments to mark users as busy
  const globalBusyMap = new Map<string, { start: Date; end: Date }[]>();
  const initialUserLoads = new Map<string, number>();

  for (const event of events) {
    // Check for confirmed assignments
    const confirmed = event.assignments.find(a => a.status === "CONFIRMED" && a.userId);
    if (confirmed && confirmed.userId) {
      // Mark user as busy
      const busy = globalBusyMap.get(confirmed.userId) || [];
      busy.push({ start: event.start, end: event.end });
      globalBusyMap.set(confirmed.userId, busy);
      
      // Increment load
      initialUserLoads.set(confirmed.userId, (initialUserLoads.get(confirmed.userId) || 0) + 1);
      continue; // Don't schedule this event
    }

    const dayKey = event.start.toDateString();
    const dayList = eventsByDay.get(dayKey) || [];
    dayList.push(event);
    eventsByDay.set(dayKey, dayList);
  }

  const allResults: ScheduleResult[] = [];

  // 2. Solve each day independently (but carrying over load counts)
  const sortedDays = Array.from(eventsByDay.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  for (const day of sortedDays) {
    const dayEvents = eventsByDay.get(day)!;
    const dayResults = solveDay(dayEvents, users, globalBusyMap, initialUserLoads);
    
    dayResults.forEach(r => {
      allResults.push(r);
      initialUserLoads.set(r.userId, (initialUserLoads.get(r.userId) || 0) + 1);
    });
  }

  return allResults;
}

function solveDay(
  events: SchedulerEvent[], 
  users: SchedulerUser[], 
  externalBusyMap: Map<string, { start: Date; end: Date }[]>,
  currentLoads: Map<string, number>
): ScheduleResult[] {
  
  // Pre-calculate eligible users for each event
  const eventCandidates = events.map(event => {
    const candidates = users.filter(user => {
      if (event.roleId) {
        const hasRole = user.roles.some(r => r.roleId === event.roleId);
        if (!hasRole) return false;
      }
      if (user.availableEvents && !user.availableEvents.includes(event.id)) {
        return false;
      }
      if (isUserBusy(user.id, event.start, event.end, externalBusyMap)) {
        return false;
      }
      return true;
    });
    return { event, candidates };
  });
  
  // Sort by constraint (most constrained first)
  eventCandidates.sort((a, b) => a.candidates.length - b.candidates.length);

  // Backtracking State
  let bestResult = { 
    assignments: [] as ScheduleResult[], 
    score: -Infinity 
  };
  
  let iterations = 0;
  const MAX_ITERATIONS = 200000;

  function backtrack(
    index: number, 
    currentAssignments: ScheduleResult[], 
    localBusyMap: Map<string, { start: Date; end: Date }[]>
  ) {
    iterations++;
    if (iterations > MAX_ITERATIONS) return;

    // Base case: All events processed
    if (index === eventCandidates.length) {
      const score = calculateScore(currentAssignments, currentLoads, users, events);
      if (score > bestResult.score) {
        bestResult = { assignments: [...currentAssignments], score };
      }
      return;
    }

    const { event, candidates } = eventCandidates[index];

    // Sort candidates by preference
    const sortedCandidates = [...candidates].sort((a, b) => {
      const roleA = getRoleType(a, event);
      const roleB = getRoleType(b, event);
      if (roleA === 'required' && roleB !== 'required') return -1;
      if (roleB === 'required' && roleA !== 'required') return 1;
      
      const loadA = currentLoads.get(a.id) || 0;
      const loadB = currentLoads.get(b.id) || 0;
      return loadA - loadB;
    });

    for (const user of sortedCandidates) {
      if (!isUserBusy(user.id, event.start, event.end, localBusyMap)) {
        
        const newAssignment = { eventId: event.id, userId: user.id };
        currentAssignments.push(newAssignment);
        
        const userBusy = localBusyMap.get(user.id) || [];
        userBusy.push({ start: event.start, end: event.end });
        localBusyMap.set(user.id, userBusy);
        
        backtrack(index + 1, currentAssignments, localBusyMap);
        
        currentAssignments.pop();
        userBusy.pop();
      }
    }

    // Also try skipping this event
    backtrack(index + 1, currentAssignments, localBusyMap);
  }

  backtrack(0, [], new Map());
  return bestResult.assignments;
}

// --- Helpers ---

function isUserBusy(userId: string, start: Date, end: Date, busyMap: Map<string, { start: Date; end: Date }[]>) {
  const times = busyMap.get(userId);
  if (!times) return false;
  return times.some(t => 
    (start >= t.start && start < t.end) ||
    (end > t.start && end <= t.end) ||
    (start <= t.start && end >= t.end)
  );
}

function getRoleType(user: SchedulerUser, event: SchedulerEvent): "required" | "optional" | undefined {
  if (!event.roleId) return "optional";
  return user.roles.find(r => r.roleId === event.roleId)?.type;
}

function calculateScore(
  assignments: ScheduleResult[], 
  baseLoads: Map<string, number>,
  users: SchedulerUser[],
  events: SchedulerEvent[]
) {
  let score = 0;
  
  // Define which roles are REQUIRED
  const REQUIRED_ROLES = new Set(['Nursery', 'Kids Worship', 'Preschool', 'Elementary']);
  
  // Primary goal: maximize total assignments (more coverage is better)
  score += assignments.length * 1000000;
  
  // Secondary goal: prioritize required roles
  for (const a of assignments) {
    const event = events.find(e => e.id === a.eventId);
    if (!event) continue;
    
    const isRequiredEvent = event.roleId && REQUIRED_ROLES.has(event.roleId);
    
    if (isRequiredEvent) {
      score += 100000; // Bonus for required roles
    } else {
      score += 10000; // Still good to fill optional roles
    }
  }
  
  // Bonus for using "required" type volunteers on their required roles
  for (const a of assignments) {
    const event = events.find(e => e.id === a.eventId);
    const user = users.find(u => u.id === a.userId);
    if (event && user) {
      const roleType = getRoleType(user, event);
      if (roleType === 'required') {
        score += 50; // Small bonus
      }
    }
  }
  
  // Light load balancing penalty - penalize squared load to favor spreading
  const tempLoads = new Map(baseLoads);
  for (const a of assignments) {
    tempLoads.set(a.userId, (tempLoads.get(a.userId) || 0) + 1);
  }
  
  for (const load of tempLoads.values()) {
    score -= (load * load * 10); // Quadratic penalty to strongly favor spreading
  }

  return score;
}

