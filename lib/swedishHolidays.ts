import { FIXED_SWEDISH_HOLIDAYS } from "./fixedSwedishHolidays";
import { isMovableHoliday } from "./swedishMovableHolidays";

export function isSwedishHoliday(date: Date): { isHoliday: boolean; name?: string } {
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Check fixed holidays
    const fixedHoliday = FIXED_SWEDISH_HOLIDAYS.find((h) => h.month === month && h.day === day);

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
