/**
 * Mock fixtures for the internal Flows gallery (/flows).
 *
 * These objects intentionally use plain shapes that mirror what the Prisma
 * queries return so the real product components render exactly as they do in
 * production — but with zero database access. Nothing here is persisted.
 */

// --- Users -----------------------------------------------------------------

export const owner = {
  id: "user-owner",
  name: "Dana Okoye",
  email: "dana@example.com",
  image: null as string | null,
};

export const volunteer = {
  id: "user-volunteer",
  name: "Sam Rivera",
  email: "sam@example.com",
  image: null as string | null,
};

const otherVolunteers = [
  { id: "user-2", name: "Alex Chen", email: "alex@example.com", image: null },
  { id: "user-3", name: "Priya Nair", email: "priya@example.com", image: null },
  {
    id: "user-4",
    name: "Marcus Bell",
    email: "marcus@example.com",
    image: null,
  },
  {
    id: "user-5",
    name: "Lena Fischer",
    email: "lena@example.com",
    image: null,
  },
];

// --- Schedule & Roles ------------------------------------------------------

export const schedule = {
  id: "schedule-1",
  name: "Sunday Service",
  googleCalendarId: "primary",
  userId: owner.id,
};

const roleMeta = [
  {
    id: "role-worship",
    name: "Worship Leader",
    color: "#7C3AED",
    type: "required",
  },
  { id: "role-guitar", name: "Guitarist", color: "#2563EB", type: "optional" },
  { id: "role-usher", name: "Usher", color: "#059669", type: "required" },
  { id: "role-greeter", name: "Greeter", color: "#D97706", type: "optional" },
];

const roleMembers: Record<string, typeof otherVolunteers> = {
  "role-worship": [otherVolunteers[1]],
  "role-guitar": [volunteer, otherVolunteers[0]],
  "role-usher": [volunteer, otherVolunteers[2], otherVolunteers[3]],
  "role-greeter": [otherVolunteers[3]],
};

/** Shape expected by <RoleManager /> */
export const rolesForManager = roleMeta.map((r) => ({
  ...r,
  description: "",
  inviteToken: `invite-${r.id}`,
  scheduleId: schedule.id,
  users: roleMembers[r.id].map((u) => ({
    userId: u.id,
    type: "required",
    user: { id: u.id, name: u.name, email: u.email, image: u.image },
  })),
}));

/** Lightweight roles list used across event/matrix components */
export const allRoles = roleMeta.map((r) => ({
  id: r.id,
  name: r.name,
  color: r.color,
  type: r.type,
}));

// The signed-in volunteer belongs to Guitarist + Usher.
export const volunteerRoleIds = ["role-guitar", "role-usher"];

// --- Admins ----------------------------------------------------------------

export const admins = [
  { userId: owner.id, user: owner },
  {
    userId: otherVolunteers[0].id,
    user: otherVolunteers[0],
  },
];

// --- Schedule users (for admin "add volunteer" pickers) --------------------

export const scheduleUsers = [owner, volunteer, ...otherVolunteers];

/** Shape expected by <UserManager /> */
export const usersForManager = [owner, volunteer, ...otherVolunteers].map(
  (u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    isOwner: u.id === owner.id,
    isAdmin: u.id === owner.id || u.id === otherVolunteers[0].id,
    roles: roleMeta
      .filter((r) => roleMembers[r.id].some((m) => m.id === u.id))
      .map((r) => ({
        roleId: r.id,
        role: { id: r.id, name: r.name, color: r.color },
      })),
  }),
);

export const availableRolesForManager = roleMeta.map((r) => ({
  id: r.id,
  name: r.name,
  color: r.color,
}));

// --- Google calendars (for <CreateScheduleForm />) -------------------------

export const calendars = [
  { id: "primary", summary: "Dana Okoye (Personal)" },
  { id: "cal-service", summary: "Sunday Service" },
  { id: "cal-youth", summary: "Youth Group" },
  { id: "cal-outreach", summary: "Community Outreach" },
];

// --- Plan & Events ---------------------------------------------------------

export function makePlan(status: string) {
  return {
    id: "plan-1",
    name: "August 2026",
    status,
    startDate: new Date("2026-08-02T00:00:00"),
    endDate: new Date("2026-08-30T23:59:59"),
    scheduleId: schedule.id,
  };
}

function assignment(
  id: string,
  user: { id: string; name: string | null; image: string | null },
  status: "PENDING" | "CONFIRMED",
) {
  return {
    id,
    userId: user.id,
    name: user.name,
    email: null as string | null,
    status,
    user: { id: user.id, name: user.name, image: user.image },
  };
}

function availability(
  id: string,
  user: { id: string; name: string | null; image: string | null },
) {
  return {
    id,
    userId: user.id,
    user: { id: user.id, name: user.name, image: user.image },
  };
}

const roleById = (id: string) => allRoles.find((r) => r.id === id)!;

/**
 * Four weekly Sunday services. Each is one recurring series so components that
 * group recurring instances behave realistically. Shifts carry a mix of
 * confirmed assignments, pending assignments, and open availabilities.
 */
export function makeEvents() {
  const sundays = [
    "2026-08-02T09:00:00",
    "2026-08-09T09:00:00",
    "2026-08-16T09:00:00",
    "2026-08-23T09:00:00",
  ];

  return sundays.map((start, i) => {
    const end = new Date(
      new Date(start).getTime() + 90 * 60 * 1000,
    ).toISOString();
    return {
      id: `event-${i + 1}`,
      googleEventId: `g-event-${i + 1}`,
      title: "Sunday Morning Service",
      start,
      end,
      recurringEventId: "series-sunday",
      shifts: [
        {
          id: `shift-${i + 1}-worship`,
          roleId: "role-worship",
          role: roleById("role-worship"),
          name: null,
          needed: 1,
          assignments:
            i < 2
              ? [
                  assignment(
                    `a-${i}-w`,
                    otherVolunteers[1],
                    i === 0 ? "CONFIRMED" : "PENDING",
                  ),
                ]
              : [],
          availabilities: [availability(`av-${i}-w`, otherVolunteers[1])],
        },
        {
          id: `shift-${i + 1}-guitar`,
          roleId: "role-guitar",
          role: roleById("role-guitar"),
          name: null,
          needed: 1,
          assignments:
            i === 0 ? [assignment(`a-${i}-g`, volunteer, "CONFIRMED")] : [],
          availabilities: [
            availability(`av-${i}-g1`, volunteer),
            availability(`av-${i}-g2`, otherVolunteers[0]),
          ],
        },
        {
          id: `shift-${i + 1}-usher`,
          roleId: "role-usher",
          role: roleById("role-usher"),
          name: null,
          needed: 2,
          assignments:
            i === 0
              ? [
                  assignment(`a-${i}-u1`, volunteer, "CONFIRMED"),
                  assignment(`a-${i}-u2`, otherVolunteers[2], "CONFIRMED"),
                ]
              : [],
          availabilities: [
            availability(`av-${i}-u1`, volunteer),
            availability(`av-${i}-u2`, otherVolunteers[2]),
            availability(`av-${i}-u3`, otherVolunteers[3]),
          ],
        },
      ],
    };
  });
}

