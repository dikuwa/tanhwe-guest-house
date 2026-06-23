# Follow-up workflow

Owners and admins create and assign tasks by booking or customer. Staff see and complete their assigned tasks. Overdue state is derived from due date and completion state. The daily Vercel Cron creates arrival and outstanding-balance tasks for confirmed arrivals within three days. A unique reminder-log key makes repeated execution idempotent. Disable automation by removing the Vercel cron or `CRON_SECRET`.
