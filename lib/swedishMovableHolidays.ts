import { calculateEaster } from "./easterCalculation";

export type MovableHoliday = {
    date: Date;
    name: string;
};

/**
 * Calculate Good Friday (Långfredagen)
 * Friday before Easter Sunday (Easter - 2 days)
 */
export function getGoodFriday(year: number): Date {
    const easter = calculateEaster(year);
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    return goodFriday;
}

/**
 * Calculate Easter Sunday (Påskdagen)
 */
export function getEasterSunday(year: number): Date {
    return calculateEaster(year);
}

/**
 * Calculate Easter Monday (Annandag påsk)
 * Monday after Easter Sunday (Easter + 1 day)
 */
export function getEasterMonday(year: number): Date {
    const easter = calculateEaster(year);
    const easterMonday = new Date(easter);
    easterMonday.setDate(easter.getDate() + 1);
    return easterMonday;
}

/**
 * Calculate Ascension Day (Kristi himmelfärdsdag)
 * Always a Thursday, 39 days after Easter Sunday
 */
export function getAscensionDay(year: number): Date {
    const easter = calculateEaster(year);
    const ascensionDay = new Date(easter);
    ascensionDay.setDate(easter.getDate() + 39);
    return ascensionDay;
}

/**
 * Calculate Pentecost / Whit Sunday (Pingstdagen)
 * 7th Sunday after Easter (Easter + 49 days)
 */
export function getPentecost(year: number): Date {
    const easter = calculateEaster(year);
    const pentecost = new Date(easter);
    pentecost.setDate(easter.getDate() + 49);
    return pentecost;
}

/**
 * Calculate Midsummer Day (Midsommardagen)
 * Always a Saturday between June 20-26
 */
export function getMidsummer(year: number): Date {
    // Start with June 20
    const date = new Date(year, 5, 20); // Month 5 = June (0-indexed)

    // Get day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = date.getDay();

    // Calculate days until Saturday
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;

    // Add days to reach Saturday
    date.setDate(20 + daysUntilSaturday);

    return date;
}

/**
 * Calculate All Saints' Day (Alla helgons dag)
 * Always a Saturday between October 31 - November 6
 */
export function getAllSaintsDay(year: number): Date {
    // Start with October 31
    const date = new Date(year, 9, 31); // Month 9 = October (0-indexed)

    // Get day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = date.getDay();

    // Calculate days until Saturday
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;

    // Add days to reach Saturday
    date.setDate(31 + daysUntilSaturday);

    return date;
}

/**
 * Get all Swedish movable public holidays for a given year
 * Returns a Map with date keys (YYYY-MM-DD format) and holiday info
 */
export function getMovableHolidays(year: number): Map<string, MovableHoliday> {
    const holidays = new Map<string, MovableHoliday>();

    const movableHolidays = [
        { date: getGoodFriday(year), name: "Långfredagen" },
        { date: getEasterSunday(year), name: "Påskdagen" },
        { date: getEasterMonday(year), name: "Annandag påsk" },
        { date: getAscensionDay(year), name: "Kristi himmelfärdsdag" },
        { date: getPentecost(year), name: "Pingstdagen" },
        { date: getMidsummer(year), name: "Midsommardagen" },
        { date: getAllSaintsDay(year), name: "Alla helgons dag" },
    ];

    movableHolidays.forEach((holiday) => {
        const key = formatDateKey(holiday.date);
        holidays.set(key, holiday);
    });

    return holidays;
}

/**
 * Helper function to format a date as YYYY-MM-DD string for use as a Map key
 */
function formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * Check if a given date is a Swedish movable holiday
 */
export function isMovableHoliday(date: Date): { isHoliday: boolean; name?: string } {
    const year = date.getFullYear();
    const holidays = getMovableHolidays(year);
    const key = formatDateKey(date);

    const holiday = holidays.get(key);
    if (holiday) {
        return { isHoliday: true, name: holiday.name };
    }

    return { isHoliday: false };
}
