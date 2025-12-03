import { describe, it, expect } from "vitest";
import { generateSchedule, SchedulerEvent, SchedulerUser } from "./scheduler";

describe("Complex Schedule Scenario", () => {
  // Roles
  const roles = {
    nursery: { roleId: "Nursery", type: "required" as const },
    kidsWorship: { roleId: "Kids Worship", type: "required" as const },
    preschool: { roleId: "Preschool", type: "required" as const },
    elementary: { roleId: "Elementary", type: "required" as const },
    middleSchool: { roleId: "Middle School", type: "optional" as const },
    worshipLeader: { roleId: "Worship Leader", type: "optional" as const },
    baseGuitar: { roleId: "Base Guitar", type: "optional" as const },
    electricGuitar: { roleId: "Electric Guitar", type: "optional" as const },
    acousticGuitar: { roleId: "Acoustic Guitar", type: "optional" as const },
    keyboard: { roleId: "Keyboard", type: "optional" as const },
    drums: { roleId: "Drums", type: "optional" as const },
    piano: { roleId: "Piano", type: "optional" as const },
    vocals: { roleId: "Vocals", type: "optional" as const },
  } as const;

  // Helper to create events with date ranges
  const createEvent = (
    roleId: string,
    start: Date,
    end: Date,
    index: number = 0
  ): SchedulerEvent => {
    const dateStr = start.toISOString().split("T")[0];
    return {
      id: `${roleId}-${dateStr}-${index}`,
      roleId,
      start,
      end,
      assignments: [],
    };
  };

  // Helper functions for each role type
  const createNurseryEvent = (dateStr: string, index: number = 0) =>
    createEvent(
      roles.nursery.roleId,
      new Date(`${dateStr}T12:00:00Z`),
      new Date(`${dateStr}T13:00:00Z`),
      index
    );
  const createKidsWorshipEvent = (dateStr: string, index: number = 0) =>
    createEvent(
      roles.kidsWorship.roleId,
      new Date(`${dateStr}T12:00:00Z`),
      new Date(`${dateStr}T12:30:00Z`),
      index
    );
  const createPreschoolEvent = (dateStr: string, index: number = 0) =>
    createEvent(
      roles.preschool.roleId,
      new Date(`${dateStr}T12:30:00Z`),
      new Date(`${dateStr}T13:00:00Z`),
      index
    );
  const createElementaryEvent = (dateStr: string, index: number = 0) =>
    createEvent(
      roles.elementary.roleId,
      new Date(`${dateStr}T12:30:00Z`),
      new Date(`${dateStr}T13:00:00Z`),
      index
    );
  const createMiddleSchoolEvent = (dateStr: string, index: number = 0) =>
    createEvent(
      roles.middleSchool.roleId,
      new Date(`${dateStr}T12:30:00Z`),
      new Date(`${dateStr}T13:00:00Z`),
      index
    );
  const createWorshipLeaderEvent = (dateStr: string, index: number = 0) =>
    createEvent(
      roles.worshipLeader.roleId,
      new Date(`${dateStr}T12:00:00Z`),
      new Date(`${dateStr}T12:30:00Z`),
      index
    );
  const createVocalsEvent = (dateStr: string, index: number = 0) =>
    createEvent(
      roles.vocals.roleId,
      new Date(`${dateStr}T12:00:00Z`),
      new Date(`${dateStr}T12:30:00Z`),
      index
    );
  const createDrumsEvent = (dateStr: string, index: number = 0) =>
    createEvent(
      roles.drums.roleId,
      new Date(`${dateStr}T12:00:00Z`),
      new Date(`${dateStr}T12:30:00Z`),
      index
    );
  const createBaseGuitarEvent = (dateStr: string, index: number = 0) =>
    createEvent(
      roles.baseGuitar.roleId,
      new Date(`${dateStr}T12:00:00Z`),
      new Date(`${dateStr}T12:30:00Z`),
      index
    );
  const createElectricGuitarEvent = (dateStr: string, index: number = 0) =>
    createEvent(
      roles.electricGuitar.roleId,
      new Date(`${dateStr}T12:00:00Z`),
      new Date(`${dateStr}T12:30:00Z`),
      index
    );
  const createAcousticGuitarEvent = (dateStr: string, index: number = 0) =>
    createEvent(
      roles.acousticGuitar.roleId,
      new Date(`${dateStr}T12:00:00Z`),
      new Date(`${dateStr}T12:30:00Z`),
      index
    );
  const createKeyboardEvent = (dateStr: string, index: number = 0) =>
    createEvent(
      roles.keyboard.roleId,
      new Date(`${dateStr}T12:00:00Z`),
      new Date(`${dateStr}T12:30:00Z`),
      index
    );
  const createPianoEvent = (dateStr: string, index: number = 0) =>
    createEvent(
      roles.piano.roleId,
      new Date(`${dateStr}T12:00:00Z`),
      new Date(`${dateStr}T12:30:00Z`),
      index
    );

  // Create Events
  const events: SchedulerEvent[] = [
    // 12-07
    createNurseryEvent("2025-12-07"),
    createKidsWorshipEvent("2025-12-07"),
    createPreschoolEvent("2025-12-07"),
    createElementaryEvent("2025-12-07"),
    createMiddleSchoolEvent("2025-12-07"),
    createWorshipLeaderEvent("2025-12-07"),
    createVocalsEvent("2025-12-07"),
    createDrumsEvent("2025-12-07"),
    createBaseGuitarEvent("2025-12-07"),
    createElectricGuitarEvent("2025-12-07"),
    createAcousticGuitarEvent("2025-12-07"),
    createKeyboardEvent("2025-12-07"),
    createPianoEvent("2025-12-07"),

    // 12-14
    createNurseryEvent("2025-12-14"),
    createKidsWorshipEvent("2025-12-14"),
    createPreschoolEvent("2025-12-14"),
    createElementaryEvent("2025-12-14"),
    createMiddleSchoolEvent("2025-12-14"),
    createWorshipLeaderEvent("2025-12-14"),
    createVocalsEvent("2025-12-14"),
    createDrumsEvent("2025-12-14"),
    createBaseGuitarEvent("2025-12-14"),
    createElectricGuitarEvent("2025-12-14"),
    createAcousticGuitarEvent("2025-12-14"),
    createKeyboardEvent("2025-12-14"),
    createPianoEvent("2025-12-14"),

    // 12-21 (No Middle School)
    createNurseryEvent("2025-12-21"),
    createKidsWorshipEvent("2025-12-21"),
    createPreschoolEvent("2025-12-21"),
    createElementaryEvent("2025-12-21"),
    // No Middle School
    createWorshipLeaderEvent("2025-12-21"),
    createVocalsEvent("2025-12-21"),
    createDrumsEvent("2025-12-21"),
    createBaseGuitarEvent("2025-12-21"),
    createElectricGuitarEvent("2025-12-21"),
    createAcousticGuitarEvent("2025-12-21"),
    createKeyboardEvent("2025-12-21"),
    createPianoEvent("2025-12-21"),

    // 12-28
    createNurseryEvent("2025-12-28"),
    createKidsWorshipEvent("2025-12-28"),
    createPreschoolEvent("2025-12-28"),
    createElementaryEvent("2025-12-28"),
    createMiddleSchoolEvent("2025-12-28"),
    createWorshipLeaderEvent("2025-12-28"),
    createVocalsEvent("2025-12-28"),
    createDrumsEvent("2025-12-28"),
    createBaseGuitarEvent("2025-12-28"),
    createElectricGuitarEvent("2025-12-28"),
    createAcousticGuitarEvent("2025-12-28"),
    createKeyboardEvent("2025-12-28"),
    createPianoEvent("2025-12-28"),
  ];

  // Helper to get event IDs from the created events
  const getEventIds = (dates: string[], userRoles: { roleId: string }[]) => {
    const roleIds = userRoles.map((r) => r.roleId);
    return events
      .filter((s) => {
        const date = s.start.toISOString().split("T")[0];
        return dates.includes(date) && s.roleId && roleIds.includes(s.roleId);
      })
      .map((s) => s.id);
  };

  // Users
  const users: SchedulerUser[] = [
    { id: "Leila Alhindi", roles: [roles.nursery], availableEvents: [] },
    {
      id: "Lillian Nackasha",
      roles: [roles.nursery, roles.kidsWorship],
      availableEvents: getEventIds(
        ["2025-12-14", "2025-12-28"],
        [roles.nursery, roles.kidsWorship]
      ),
    },
    {
      id: "Rebecca Yonan",
      roles: [
        roles.nursery,
        roles.kidsWorship,
        roles.elementary,
        roles.middleSchool,
        roles.vocals,
      ],
      availableEvents: getEventIds(
        ["2025-12-14", "2025-12-21", "2025-12-28"],
        [
          roles.nursery,
          roles.kidsWorship,
          roles.elementary,
          roles.middleSchool,
          roles.vocals,
        ]
      ),
    },
    {
      id: "Shams Morolli",
      roles: [
        roles.nursery,
        roles.kidsWorship,
        roles.middleSchool,
        roles.vocals,
      ],
      availableEvents: [],
    },
    { id: "Shantal AlNajar", roles: [roles.nursery], availableEvents: [] },
    {
      id: "Marianne Salman",
      roles: [
        roles.nursery,
        roles.preschool,
        roles.elementary,
        roles.middleSchool,
      ],
      availableEvents: getEventIds(
        ["2025-12-14", "2025-12-28"],
        [roles.nursery, roles.preschool, roles.elementary, roles.middleSchool]
      ),
    },
    {
      id: "Christa Kasbrooks",
      roles: [roles.kidsWorship, roles.vocals],
      availableEvents: [],
    },
    {
      id: "Nada Yousif",
      roles: [roles.kidsWorship, roles.elementary],
      availableEvents: [],
    },
    {
      id: "Nana Akrawi",
      roles: [roles.kidsWorship, roles.elementary],
      availableEvents: [],
    },
    {
      id: "Zina Hannah",
      roles: [roles.kidsWorship, roles.preschool, roles.middleSchool],
      availableEvents: getEventIds(
        ["2025-12-21", "2025-12-28"],
        [roles.kidsWorship, roles.preschool, roles.middleSchool]
      ),
    },
    {
      id: "Christine Awabdeh",
      roles: [roles.preschool],
      availableEvents: getEventIds(["2025-12-14"], [roles.preschool]),
    },
    {
      id: "Gracie Fram",
      roles: [roles.preschool],
      availableEvents: getEventIds(["2025-12-07"], [roles.preschool]),
    },
    {
      id: "Mikayla Hannah",
      roles: [roles.preschool],
      availableEvents: getEventIds(["2025-12-21"], [roles.preschool]),
    },
    {
      id: "Ricky Kasbrooks",
      roles: [roles.preschool, roles.elementary, roles.middleSchool],
      availableEvents: [],
    },
    {
      id: "Sally Haddad",
      roles: [roles.elementary],
      availableEvents: getEventIds(["2025-12-14"], [roles.elementary]),
    },
    { id: "Dalia Jamil", roles: [roles.middleSchool], availableEvents: [] },
    { id: "Erica Kaspo", roles: [roles.middleSchool], availableEvents: [] },
    { id: "Manny Salman", roles: [roles.middleSchool], availableEvents: [] },
    { id: "Alex Kaspo", roles: [roles.drums], availableEvents: [] },
    {
      id: "Andrew Awabdeh",
      roles: [roles.worshipLeader, roles.keyboard, roles.vocals],
      availableEvents: getEventIds(
        ["2025-12-07", "2025-12-14", "2025-12-21", "2025-12-28"],
        [roles.worshipLeader, roles.keyboard, roles.vocals]
      ),
    },
    {
      id: "Anthony Morolli",
      roles: [roles.baseGuitar],
      availableEvents: getEventIds(
        ["2025-12-07", "2025-12-14", "2025-12-21", "2025-12-28"],
        [roles.baseGuitar]
      ),
    },
    { id: "Hashem Alfay", roles: [roles.acousticGuitar], availableEvents: [] },
    { id: "Jamil Haddad", roles: [roles.acousticGuitar], availableEvents: [] },
    { id: "Jeremy Ishow", roles: [roles.drums], availableEvents: [] },
    {
      id: "Jonah Yonan",
      roles: [
        roles.vocals,
        roles.electricGuitar,
        roles.piano,
        roles.keyboard,
        roles.worshipLeader,
      ],
      availableEvents: getEventIds(
        ["2025-12-07", "2025-12-14", "2025-12-21", "2025-12-28"],
        [
          roles.vocals,
          roles.electricGuitar,
          roles.piano,
          roles.keyboard,
          roles.worshipLeader,
        ]
      ),
    },
    { id: "Nicole Said", roles: [roles.vocals], availableEvents: [] },
    {
      id: "Rabi Alhindi",
      roles: [roles.vocals, roles.acousticGuitar],
      availableEvents: [],
    },
    { id: "Razan Yared", roles: [roles.vocals], availableEvents: [] },
  ];

  it("should generate a schedule for December 2025", () => {
    const results = generateSchedule(events, users);

    // Analyze results
    console.log("\n=== SCHEDULE RESULTS ===");
    console.log("Total Assignments:", results.length);
    console.log("\nAssignments by Date:");

    const dates = Array.from(
      new Set(events.map((s) => s.id.split("-").slice(1, 4).join("-")))
    ).sort();

    dates.forEach((date) => {
      console.log(`\n${date}:`);
      const eventsForDate = events.filter((s) => s.id.includes(date));

      eventsForDate.forEach((event) => {
        const assignment = results.find((r) => r.eventId === event.id);
        const startTime = event.start.toISOString().substring(11, 16);
        const endTime = event.end.toISOString().substring(11, 16);

        // Find role definition
        const roleDef = Object.values(roles).find(
          (r) => r.roleId === event.roleId
        );
        const isRequired = roleDef?.type === "required";

        // Count candidates
        const candidates = users.filter(
          (u) =>
            u.roles.some((r) => r.roleId === event.roleId) &&
            (!u.availableEvents || u.availableEvents.includes(event.id))
        );

        if (assignment) {
          console.log(
            `  ✅ ${assignment.userId} -> ${event.roleId} (${startTime}-${endTime})`
          );
        } else if (isRequired) {
          const reason =
            candidates.length === 0 ? "No candidates" : "Conflict/Optimization";
          console.log(
            `  ❌ MISSING REQUIRED: ${event.roleId} (${startTime}-${endTime}) [${reason}]`
          );
        } else {
          const reason =
            candidates.length === 0 ? "No candidates" : "Conflict/Optimization";
          console.log(
            `  ⚪ Unfilled Optional: ${event.roleId} (${startTime}-${endTime}) [${reason}]`
          );
        }
      });
    });

    // Basic assertions
    expect(results.length).toBeGreaterThan(0);

    // Verify no double bookings (same person assigned to overlapping events)
    users.forEach((user) => {
      const userAssignments = results.filter((a) => a.userId === user.id);
      const userEvents = userAssignments.map(
        (a) => events.find((s) => s.id === a.eventId)!
      );

      for (let i = 0; i < userEvents.length; i++) {
        for (let j = i + 1; j < userEvents.length; j++) {
          const event1 = userEvents[i];
          const event2 = userEvents[j];

          // Check if events overlap
          const overlap =
            event1.start < event2.end && event2.start < event1.end;
          expect(overlap).toBe(false);
        }
      }
    });

    // Verify users are only assigned when available
    results.forEach((assignment) => {
      const user = users.find((u) => u.id === assignment.userId)!;
      const event = events.find((s) => s.id === assignment.eventId)!;

      // If user has availableEvents specified, they should only be assigned on those events
      if (user.availableEvents && user.availableEvents.length > 0) {
        expect(user.availableEvents).toContain(event.id);
      }
    });
  });
});

