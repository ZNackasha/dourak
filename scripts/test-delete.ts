import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // 1. Find a user
  const user = await prisma.user.findFirst()
  if (!user) {
    console.log('No user found')
    return
  }

  console.log('Using user:', user.id)

  // 2. Create Schedule
  const schedule = await prisma.schedule.create({
    data: {
      name: 'Test Delete Schedule',
      googleCalendarId: 'test-calendar-id',
      userId: user.id,
    }
  })
  console.log('Created schedule:', schedule.id)

  // 2b. Create ScheduleAdmin
  await prisma.scheduleAdmin.create({
    data: {
      scheduleId: schedule.id,
      userId: user.id,
    }
  })
  console.log('Created schedule admin')

  // 3. Create Role
  const role = await prisma.role.create({
    data: {
      name: 'Test Role',
      scheduleId: schedule.id,
    }
  })
  console.log('Created role:', role.id)

  // 3b. Assign User to Role
  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: role.id,
    }
  })
  console.log('Assigned user to role')

  // 4. Create Plan
  const plan = await prisma.plan.create({
    data: {
      name: 'Test Plan',
      startDate: new Date(),
      endDate: new Date(),
      scheduleId: schedule.id,
    }
  })
  console.log('Created plan:', plan.id)

  // 5. Create Event
  const event = await prisma.calendarEvent.create({
    data: {
      planId: plan.id,
      googleEventId: 'test-event-id',
      title: 'Test Event',
      start: new Date(),
      end: new Date(),
    }
  })
  console.log('Created event:', event.id)

  // 6. Create Shift
  const shift = await prisma.shift.create({
    data: {
      calendarEventId: event.id,
      roleId: role.id,
      needed: 1,
    }
  })
  console.log('Created shift:', shift.id)

  // 6c. Create Assignment
  await prisma.assignment.create({
    data: {
      shiftId: shift.id,
      userId: user.id,
      status: 'PENDING',
    }
  })
  console.log('Created assignment')

  // 6d. Create Availability
  await prisma.availability.create({
    data: {
      shiftId: shift.id,
      userId: user.id,
    }
  })
  console.log('Created availability')

  // 6b. Create RecurringShift
  const recurringShift = await prisma.recurringShift.create({
    data: {
      scheduleId: schedule.id,
      recurringEventId: 'test-recurring-id',
      roleId: role.id,
      needed: 1,
    }
  })
  console.log('Created recurring shift:', recurringShift.id)

  // 7. Try to delete Schedule
  console.log('Deleting schedule...')
  try {
    await prisma.schedule.delete({
      where: { id: schedule.id }
    })
    console.log('Schedule deleted successfully')
  } catch (e) {
    console.error('Failed to delete schedule:', e)
  }
}

main()
  .catch(e => {
    throw e
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
