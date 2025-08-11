import { startOfWeek, endOfWeek, format, parseISO, isWithinInterval } from 'date-fns';

export function weekKey(date: Date): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

export function formatWeekHeader(date: Date): string {
  return `w/c ${format(date, 'd MMM')}`;
}

export function isDateInWeek(dateStr: string | undefined | null, weekStartDate: Date): boolean {
  if (!dateStr) return false;
  try {
    const date = parseISO(dateStr);
    const interval = { start: weekStartDate, end: endOfWeek(weekStartDate, { weekStartsOn: 1 }) };
    return isWithinInterval(date, interval);
  } catch {
    return false;
  }
}

