import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import Calendar from "@/components/Calendar";
import CalendarSwipeHandler from "@/components/CalendarSwipeHandler";
import { getSessionUser } from "@/lib/auth/session";
import { getEventsForMonth, getBirthdaysForMonth } from "@/lib/db/calendarEvents";
import type { CalendarEvent } from "@/lib/db/calendarEvents";

type PageProps = {
    params: Promise<{
        year: string;
        month: string;
    }>;
};

function isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function birthdaysToEvents(birthdays: CalendarEvent[], year: number): CalendarEvent[] {
    return birthdays.map((b) => {
        let day = b.birthDay!;
        // Feb 29 birthday in a non-leap year: show on Feb 28
        if (b.birthMonth === 2 && day === 29 && !isLeapYear(year)) {
            day = 28;
        }
        const age = b.birthYear != null ? year - b.birthYear : null;
        return {
            ...b,
            date: `${year}-${String(b.birthMonth!).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
            title: age != null ? `${b.title} (${age})` : b.title,
        };
    });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { year: yearStr, month: monthStr } = await params;
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return {};
    const locale = await getLocale();
    const title = new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
    }).format(new Date(year, month - 1, 1));
    return { title };
}

export default async function CalendarPage({ params }: PageProps) {
    const { year: yearStr, month: monthStr } = await params;

    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    // Validate year and month
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        redirect("/");
    }

    const [locale, user] = await Promise.all([getLocale(), getSessionUser()]);

    const prevYear = month === 1 ? year - 1 : year;
    const prevMonth = month === 1 ? 12 : month - 1;
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;

    const [prevEvents, currentEvents, nextEvents, prevBirthdays, currentBirthdays, nextBirthdays] =
        user
            ? await Promise.all([
                  getEventsForMonth(user.userId, prevYear, prevMonth),
                  getEventsForMonth(user.userId, year, month),
                  getEventsForMonth(user.userId, nextYear, nextMonth),
                  getBirthdaysForMonth(user.userId, prevYear, prevMonth),
                  getBirthdaysForMonth(user.userId, year, month),
                  getBirthdaysForMonth(user.userId, nextYear, nextMonth),
              ])
            : [[], [], [], [], [], []];

    const allPrev = [...prevEvents, ...birthdaysToEvents(prevBirthdays, prevYear)];
    const allCurrent = [...currentEvents, ...birthdaysToEvents(currentBirthdays, year)];
    const allNext = [...nextEvents, ...birthdaysToEvents(nextBirthdays, nextYear)];

    return (
        <CalendarSwipeHandler
            prevHref={`/${prevYear}/${prevMonth}`}
            nextHref={`/${nextYear}/${nextMonth}`}
            prevContent={
                <Calendar year={prevYear} month={prevMonth} locale={locale} events={allPrev} />
            }
            nextContent={
                <Calendar year={nextYear} month={nextMonth} locale={locale} events={allNext} />
            }
        >
            <Calendar year={year} month={month} locale={locale} events={allCurrent} />
        </CalendarSwipeHandler>
    );
}
