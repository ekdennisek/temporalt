import { isMovableHoliday } from "./swedishMovableHolidays";

// Fixed Swedish public holidays (allmäna helgdagar)
export const FIXED_SWEDISH_HOLIDAYS: { month: number; day: number; name: string }[] = [
  { month: 1, day: 1, name: "Nyårsdagen" },
  { month: 1, day: 6, name: "Trettondedag jul" },
  { month: 5, day: 1, name: "Första maj" },
  { month: 6, day: 6, name: "Sveriges nationaldag" },
  { month: 12, day: 25, name: "Juldagen" },
  { month: 12, day: 26, name: "Annandag jul" },
];

export function isSwedishHoliday(date: Date): { isHoliday: boolean; name?: string } {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Check fixed holidays
  const fixedHoliday = FIXED_SWEDISH_HOLIDAYS.find(
    (h) => h.month === month && h.day === day
  );

  if (fixedHoliday) {
    return { isHoliday: true, name: fixedHoliday.name };
  }

  // Check movable holidays
  const movableHolidayResult = isMovableHoliday(date);
  if (movableHolidayResult.isHoliday) {
    return movableHolidayResult;
  }

  return { isHoliday: false };
}
