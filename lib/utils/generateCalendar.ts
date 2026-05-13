import { Temporal } from "temporal-polyfill";
import { isSwedishHoliday } from "../swedishHolidays";

type CalendarDay = {
    date: string;
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

    let weeks: Temporal.PlainDate[] = [];
    for (
        let week = firstDayOfMonth;
        week.year === year && week.month === month;
        week = week.add({ weeks: 1 })
    ) {
        weeks.push(week);
    }

    if (weeks.length < 5) {
        const week = weeks[0].subtract({ weeks: 1 });
        weeks = [week, ...weeks];
    }

    if (weeks.length < 6) {
        const week = weeks.findLast(Boolean)?.add({ weeks: 1 });
        if (!week) throw new Error("Couldn't add week");
        weeks.push(week);
    }

    return weeks.map((week) => {
        const firstDayOfWeek = week.add({ days: 1 - week.dayOfWeek });
        if (firstDayOfWeek.weekOfYear === undefined) throw new Error("Unknown week");
        return {
            weekNumber: firstDayOfWeek.weekOfYear,
            days: generateDaysOfWeek(firstDayOfWeek, year, month),
        };
    });
}

function generateDaysOfWeek(firstDayOfWeek: Temporal.PlainDate, year: number, month: number) {
    return [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
        const now = Temporal.Now.plainDateISO();
        const day = firstDayOfWeek.add({ days: dayOfWeek });
        const holidayInfo = isSwedishHoliday(new Date(day.toString()));

        return {
            date: day.toString(),
            dayOfMonth: day.day,
            isCurrentMonth: day.year === year && day.month === month,
            isHoliday: holidayInfo.isHoliday,
            holidayName: holidayInfo.name,
            isToday: now.equals(day),
        };
    });
}
