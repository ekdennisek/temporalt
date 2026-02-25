import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { isSwedishHoliday } from "@/lib/swedishHolidays";
import { getSessionUser } from "@/lib/auth/session";
import { getEventsForDate } from "@/lib/db/calendarEvents";
import EventItem from "@/components/EventItem";

interface PageProps {
    params: Promise<{
        year: string;
        month: string;
        day: string;
    }>;
}

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
    const events = user ? await getEventsForDate(user.userId, year, month, day) : [];

    return (
        <main
            style={{
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
                boxSizing: "border-box",
            }}
        >
            <div style={{ maxWidth: "600px", width: "100%", textAlign: "center" }}>
                <h1 style={{ textTransform: "capitalize" }}>{formattedDate}</h1>

                {holidayInfo.isHoliday && holidayInfo.name && (
                    <p style={{ color: "#c00", fontSize: "1.25rem", fontWeight: "bold" }}>
                        {holidayInfo.name}
                    </p>
                )}

                <p style={{ fontSize: "1.1rem", color: "#666" }}>{relativeText}</p>

                {events.length > 0 && (
                    <ul
                        style={{
                            listStyle: "none",
                            padding: 0,
                            margin: "1.5rem 0 0",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                        }}
                    >
                        {events.map((event) => (
                            <EventItem key={event.eventId} event={event} />
                        ))}
                    </ul>
                )}

                <Link
                    href={`/${year}/${month}`}
                    style={{
                        display: "inline-block",
                        marginTop: "2rem",
                        padding: "0.5rem 1rem",
                        color: "#0070f3",
                        textDecoration: "none",
                    }}
                >
                    {t("backToCalendar")}
                </Link>
            </div>
        </main>
    );
}
