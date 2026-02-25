import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import Calendar from "@/components/Calendar";
import CalendarSwipeHandler from "@/components/CalendarSwipeHandler";
import { getSessionUser } from "@/lib/auth/session";
import { getEventsForMonth } from "@/lib/db/calendarEvents";

interface PageProps {
    params: Promise<{
        year: string;
        month: string;
    }>;
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

    const [prevEvents, currentEvents, nextEvents] = user
        ? await Promise.all([
              getEventsForMonth(user.userId, prevYear, prevMonth),
              getEventsForMonth(user.userId, year, month),
              getEventsForMonth(user.userId, nextYear, nextMonth),
          ])
        : [[], [], []];

    return (
        <CalendarSwipeHandler
            prevHref={`/${prevYear}/${prevMonth}`}
            nextHref={`/${nextYear}/${nextMonth}`}
            prevContent={<Calendar year={prevYear} month={prevMonth} locale={locale} events={prevEvents} />}
            nextContent={<Calendar year={nextYear} month={nextMonth} locale={locale} events={nextEvents} />}
        >
            <Calendar year={year} month={month} locale={locale} events={currentEvents} />
        </CalendarSwipeHandler>
    );
}
