type WeekInfo = {
    firstDay: number;
    minimalDays: number;
};

function getWeekInfoSafe(locale: string): WeekInfo {
    if (typeof window === "undefined") {
        // Server-side default (ISO 8601)
        return { firstDay: 1, minimalDays: 4 };
    }

    try {
        const localeObj = new Intl.Locale(locale);
        if (
            "getWeekInfo" in localeObj &&
            typeof (localeObj as { getWeekInfo?: () => unknown }).getWeekInfo === "function"
        ) {
            const weekInfo = (
                localeObj as { getWeekInfo: () => { firstDay: number; minimalDays: number } }
            ).getWeekInfo();
            return {
                firstDay: weekInfo.firstDay % 7, // Convert to 0-6 where 0 is Sunday
                minimalDays: weekInfo.minimalDays,
            };
        }
    } catch (e) {
        console.warn("Failed to get week info:", e);
    }

    // Default to ISO 8601
    return { firstDay: 1, minimalDays: 4 };
}

function calculateISOWeekNumber(date: Date, firstDay: number): number {
    // Clone to avoid mutation
    const target = new Date(date.valueOf());

    // Adjust day to be 0-6 where firstDay is 0
    const dayOfWeek = (target.getDay() - firstDay + 7) % 7;

    // Find the Thursday of the current week (ISO week belongs to year of Thursday)
    // For ISO 8601 (firstDay=1, Monday), Thursday is 3 days after Monday
    const thursday = new Date(target.valueOf());
    thursday.setDate(target.getDate() - dayOfWeek + 3);

    // January 4 is always in week 1
    const jan4 = new Date(thursday.getFullYear(), 0, 4);
    const jan4DayOfWeek = (jan4.getDay() - firstDay + 7) % 7;

    // Find the start of week 1 (the firstDay on or before Jan 4)
    const weekOneStart = new Date(jan4.valueOf());
    weekOneStart.setDate(jan4.getDate() - jan4DayOfWeek);

    // Calculate week number
    const diffMs = thursday.valueOf() - weekOneStart.valueOf();
    const weekNumber = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;

    return weekNumber;
}

function calculateUSWeekNumber(date: Date, firstDay: number): number {
    const year = date.getFullYear();
    const jan1 = new Date(year, 0, 1);

    // Find the first occurrence of firstDay in the year
    const jan1DayOfWeek = jan1.getDay();
    const daysToFirstWeekStart = (firstDay - jan1DayOfWeek + 7) % 7;
    const firstWeekStart = new Date(year, 0, 1 + daysToFirstWeekStart);

    // If the date is before the first occurrence of firstDay, it's week 0 (last week of previous year)
    // But we'll count it as week 1 for simplicity in US system
    if (date < firstWeekStart) {
        return 1;
    }

    // Calculate weeks from first week start
    const diffMs = date.valueOf() - firstWeekStart.valueOf();
    const weekNumber = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;

    return weekNumber;
}

import { FALLBACK_LOCALE } from "./locale";

export function calculateWeekNumber(date: Date, locale: string = FALLBACK_LOCALE): number {
    const weekInfo = getWeekInfoSafe(locale);

    // ISO 8601 system (Europe, most of world)
    if (weekInfo.minimalDays === 4) {
        return calculateISOWeekNumber(date, weekInfo.firstDay);
    }
    // US/Canada system
    else if (weekInfo.minimalDays === 1) {
        return calculateUSWeekNumber(date, weekInfo.firstDay);
    }

    // Default to ISO 8601
    return calculateISOWeekNumber(date, weekInfo.firstDay);
}
