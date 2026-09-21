/**
 * Date and time utilities with integer epoch days comparison
 */

// Converts 'YYYY-MM-DD' to integer epoch day (number of days since 1970-01-01 UTC)
export function dateToEpochDays(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Date.UTC returns milliseconds since epoch
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

// Converts integer epoch day back to 'YYYY-MM-DD'
export function epochDaysToDate(epochDays: number): string {
  const d = new Date(epochDays * 86400000);
  const year = d.getUTCFullYear();
  const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = d.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Compare two 'YYYY-MM-DD' date strings: negative if a < b, 0 if equal, positive if a > b
export function compareDates(a: string, b: string): number {
  return dateToEpochDays(a) - dateToEpochDays(b);
}

// Gets today's local date as 'YYYY-MM-DD'
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Gets current local time as 'HH:mm'
export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Add days to a date string
export function addDays(dateStr: string, days: number): string {
  return epochDaysToDate(dateToEpochDays(dateStr) + days);
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const WEEKDAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Returns { year, month, day, weekday, monthName, formattedHeader }
export function parseDateInfo(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const weekdayIndex = d.getDay();
  return {
    year,
    month,
    day,
    dayStr: day.toString(),
    monthName: MONTH_NAMES[month - 1],
    monthShort: MONTH_SHORT[month - 1],
    weekday: WEEKDAY_NAMES[weekdayIndex],
    weekdayShort: WEEKDAY_SHORT[weekdayIndex],
    // "September, 2026"
    monthYearHeader: `${MONTH_NAMES[month - 1]}, ${year}`,
    // "Sun, 20 Sep"
    dayCardTitle: `${WEEKDAY_SHORT[weekdayIndex]}, ${day} ${MONTH_SHORT[month - 1]}`
  };
}

// Month key 'YYYY-MM'
export function getMonthKey(year: number, month: number): string {
  return `${year}-${month.toString().padStart(2, '0')}`;
}

// Previous month { year, month }
export function getPrevMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

// Next month { year, month }
export function getNextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 12) return { year: year + 1, month: 1 };
  return { year, month: month + 1 };
}

// Days in month
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// Formats month & year: e.g. "September 2026" (no comma in selector)
export function formatMonthYear(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}
