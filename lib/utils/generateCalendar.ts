import { Temporal } from "temporal-polyfill";
import { isSwedishHoliday } from "../swedishHolidays";

type CalendarDay = {
    date: Date;
    dayOfMonth: number;
    isCurrentMonth: boolean;
    isHoliday: boolean;
    holidayName?: string;
    isToday: boolean;
};

type CalendarWeek = {
    weekNumber: number;
    days: CalendarDay[];
};

export function generateCalendar(
    year: number,
    month: number,
    // TODO weekStartDay: number,
    // TODO locale: string,
): CalendarWeek[] {
    const firstDayOfMonth = Temporal.PlainDate.from({ year, month, day: 1 });

    let weeks: CalendarWeek[] = [];
    for (
        let week = firstDayOfMonth;
        week.year === year && week.month === month;
        week = week.add({ weeks: 1 })
    ) {
        if (week.weekOfYear === undefined) throw new Error("Unknown week");
        const firstDayOfWeek = week.add({ days: 1 - week.dayOfWeek });
        weeks.push({
            weekNumber: week.weekOfYear,
            days: generateDaysOfWeek(firstDayOfWeek),
        });
    }

    if (weeks.length < 5) {
        const week = firstDayOfMonth.subtract({ weeks: 1 });
        const firstDayOfWeek = week.add({ days: 1 - week.dayOfWeek });
        if (firstDayOfWeek.weekOfYear === undefined) throw new Error("Unknown week");
        weeks = [
            {
                weekNumber: firstDayOfWeek.weekOfYear,
                days: generateDaysOfWeek(firstDayOfWeek),
            },
            ...weeks,
        ];
    }

    if (weeks.length < 6) {
        const week = Temporal.PlainDate.from({ year, month, day: 1 }).add({ months: 1 });
        const firstDayOfWeek = week.add({ days: 1 - week.dayOfWeek });
        if (firstDayOfWeek.weekOfYear === undefined) throw new Error("Unknown week");
        weeks.push({
            weekNumber: firstDayOfWeek.weekOfYear,
            days: generateDaysOfWeek(firstDayOfWeek),
        });
    }

    return weeks;
}

function generateDaysOfWeek(firstDayOfWeek: Temporal.PlainDate) {
    return [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
        const now = Temporal.Now.plainDateISO();
        const day = firstDayOfWeek.add({ days: dayOfWeek });
        const holidayInfo = isSwedishHoliday(new Date(day.toString()));

        return {
            date: new Date(day.toString()),
            dayOfMonth: day.day,
            isCurrentMonth: day.year === now.year && day.month === now.month,
            isHoliday: holidayInfo.isHoliday,
            holidayName: holidayInfo.name,
            isToday: now.equals(day),
        };
    });
}
