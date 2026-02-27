import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { isSwedishHoliday } from "@/lib/swedishHolidays";
import { getSessionUser } from "@/lib/auth/session";
import { getEventsForDate, getBirthdaysForDate } from "@/lib/db/calendarEvents";
import type { CalendarEvent } from "@/lib/db/calendarEvents";
import EventItem from "@/components/EventItem";
import { Link, Text } from "@/components/Text";

type PageProps = {
    params: Promise<{
        year: string;
        month: string;
        day: string;
    }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { year: yearStr, month: monthStr, day: dayStr } = await params;
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return {};
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day)
        return {};
    const locale = await getLocale();
    const title = new Intl.DateTimeFormat(locale, { dateStyle: "full" })
        .format(date)
        .replace(/^\w/, (c) => c.toUpperCase());
    return { title };
}

function getRelativeDayText(date: Date, t: Awaited<ReturnType<typeof getTranslations>>): string {
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffMs = dateMidnight.getTime() - todayMidnight.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return t("today");
    } else if (diffDays === 1) {
        return t("tomorrow");
    } else if (diffDays === -1) {
        return t("yesterday");
    } else if (diffDays > 1) {
        return t("inDays", { days: diffDays });
    } else {
        return t("daysAgo", { days: Math.abs(diffDays) });
    }
}

function birthdaysToEvents(
    birthdays: CalendarEvent[],
    year: number,
    month: number,
    day: number,
): CalendarEvent[] {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return birthdays.map((b) => {
        const age = b.birthYear != null ? year - b.birthYear : null;
        return {
            ...b,
            date: dateStr,
            title: age != null ? `${b.title} (${age})` : b.title,
        };
    });
}

export default async function DayPage({ params }: PageProps) {
    const { year: yearStr, month: monthStr, day: dayStr } = await params;

    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    if (
        isNaN(year) ||
        isNaN(month) ||
        isNaN(day) ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
    ) {
        redirect("/");
    }

    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        redirect("/");
    }

    const [locale, t, user] = await Promise.all([
        getLocale(),
        getTranslations("dayPage"),
        getSessionUser(),
    ]);
    const formattedDate = new Intl.DateTimeFormat(locale, {
        dateStyle: "full",
    }).format(date);

    const holidayInfo = isSwedishHoliday(date);
    const relativeText = getRelativeDayText(date, t);

    const [regularEvents, birthdays] = user
        ? await Promise.all([
              getEventsForDate(user.userId, year, month, day),
              getBirthdaysForDate(user.userId, year, month, day),
          ])
        : [[], []];

    const events = [...regularEvents, ...birthdaysToEvents(birthdays, year, month, day)];

    return (
        <div
            style={{
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
                boxSizing: "border-box",
                textAlign: "center",
            }}
        >
            <Text
                variant="h2"
                style={{ textTransform: "capitalize", marginBottom: 0, fontSize: "1rem" }}
            >
                {formattedDate}
            </Text>

            {holidayInfo.isHoliday && holidayInfo.name && (
                <>
                    <Text variant="h1" style={{ color: "var(--color-red-700)" }}>
                        {holidayInfo.name}
                    </Text>
                </>
            )}

            <Text variant="helper" style={{ fontSize: "1.1rem" }}>
                {relativeText}
            </Text>

            {events.length > 0 && (
                <ul
                    style={{
                        listStyle: "none",
                        padding: 0,
                        margin: "1rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                        minWidth: 600,
                    }}
                >
                    {events.map((event) => (
                        <EventItem key={event.eventId} event={event} />
                    ))}
                </ul>
            )}

            <Link href={`/${year}/${month}`} style={{ fontSize: 16 }}>
                {t("backToCalendar")}
            </Link>
        </div>
    );
}
