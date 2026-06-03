// ============================================
// Date Utility Helpers
// ============================================

/**
 * Get the start of today in UTC
 */
export function startOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Get the end of today in UTC
 */
export function endOfToday(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999)
  );
}

/**
 * Get date N days ago from now
 */
export function daysAgo(days: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

/**
 * Get the start of the current week (Monday) in UTC
 */
export function startOfWeek(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = 0
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diff);
  return new Date(
    Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate())
  );
}

/**
 * Format date as ISO date string (YYYY-MM-DD)
 */
export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Check if two dates are the same calendar day (UTC)
 */
export function isSameDay(a: Date, b: Date): boolean {
  return toDateString(a) === toDateString(b);
}

/**
 * Get an array of dates from startDate to endDate
 */
export function dateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}
