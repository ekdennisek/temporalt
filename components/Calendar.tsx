import React from "react";
import Link from "next/link";
import { generateCalendar } from "@/lib/utils/generateCalendar";

export type CalendarEvent = {
    eventId: number;
    title: string;
    type: string;
    date: string; // "YYYY-MM-DD"
    startTime?: string | null;
};

const EVENT_CHIP_COLORS: Record<string, { background: string; color: string }> = {
    event: { background: "var(--color-chip-event)", color: "var(--color-text-on-chip)" },
    reminder: { background: "var(--color-chip-reminder)", color: "var(--color-text-on-chip)" },
    birthday: { background: "var(--color-chip-birthday)", color: "var(--color-text-on-chip)" },
    tracking: { background: "var(--color-chip-tracking)", color: "var(--color-text-on-chip)" },
};

function getChipStyle(type: string) {
    return EVENT_CHIP_COLORS[type] ?? EVENT_CHIP_COLORS.event;
}

type CalendarProps = {
    year: number;
    month: number;
    locale: string;
    events?: CalendarEvent[];
};

function getWeekStartDay(locale: string): number {
    try {
        const intlLocale = new Intl.Locale(locale);
        if ("getWeekInfo" in intlLocale && typeof intlLocale.getWeekInfo === "function") {
            const weekInfo = intlLocale.getWeekInfo();
            return weekInfo.firstDay % 7;
        }
    } catch (e) {
        console.warn("Failed to get week info:", e);
    }

    return 1; // Default to Monday
}

function formatMonthYear(year: number, month: number, locale: string): string {
    const date = new Date(year, month - 1, 1);
    return new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
    }).format(date);
}

function formatMonthName(year: number, month: number, locale: string): string {
    const date = new Date(year, month - 1, 1);
    return new Intl.DateTimeFormat(locale, {
        month: "long",
    }).format(date);
}

function getWeekdayNames(weekStartDay: number, locale: string): string[] {
    const names: string[] = [];
    const baseDate = new Date(2024, 0, 7);

    for (let i = 0; i < 7; i++) {
        const date = new Date(baseDate);
        date.setDate(baseDate.getDate() + ((weekStartDay + i) % 7));
        const name = new Intl.DateTimeFormat(locale, {
            weekday: "short",
        }).format(date);
        names.push(name);
    }

    return names;
}

function getPreviousMonth(year: number, month: number): { year: number; month: number } {
    if (month === 1) {
        return { year: year - 1, month: 12 };
    }
    return { year, month: month - 1 };
}

function getNextMonth(year: number, month: number): { year: number; month: number } {
    if (month === 12) {
        return { year: year + 1, month: 1 };
    }
    return { year, month: month + 1 };
}

export default function Calendar({ year, month, locale, events = [] }: CalendarProps) {
    const weekStartDay = getWeekStartDay(locale);
    const weeks = generateCalendar(year, month);
    const monthYearText = formatMonthYear(year, month, locale);
    const weekdayNames = getWeekdayNames(weekStartDay, locale);

    const prev = getPreviousMonth(year, month);
    const next = getNextMonth(year, month);

    const prevMonthName = formatMonthName(prev.year, prev.month, locale);
    const nextMonthName = formatMonthName(next.year, next.month, locale);

    return (
        <main
            style={{
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
            }}
        >
            <div style={{ maxWidth: "800px", width: "100%" }}>
                <div
                    style={{
                        marginBottom: "2rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Link
                        href={`/${prev.year}/${prev.month}`}
                        style={{
                            padding: "0.5rem 1rem",
                            cursor: "pointer",
                            color: "var(--color-link)",
                            whiteSpace: "nowrap",
                            fontSize: "0.9rem",
                        }}
                    >
                        ← {prevMonthName}
                    </Link>
                    <h1
                        style={{
                            whiteSpace: "nowrap",
                            fontSize: "16px",
                            fontWeight: "bold",
                        }}
                    >
                        {monthYearText}
                    </h1>
                    <Link
                        href={`/${next.year}/${next.month}`}
                        style={{
                            padding: "0.5rem 1rem",
                            cursor: "pointer",
                            color: "var(--color-link)",
                            whiteSpace: "nowrap",
                            fontSize: "0.9rem",
                        }}
                    >
                        {nextMonthName} →
                    </Link>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "auto repeat(7, minmax(0, 1fr))",
                        gap: "1px",
                        backgroundColor: "var(--color-border-default)",
                        border: "1px solid var(--color-border-default)",
                        overflow: "hidden",
                    }}
                >
                    {/* Week number header */}
                    <div
                        style={{
                            padding: "0.75rem 0.5rem",
                            textAlign: "center",
                            fontWeight: "bold",
                            backgroundColor: "var(--color-bg-muted)",
                            fontSize: "0.9em",
                        }}
                    ></div>
                    {weekdayNames.map((name, idx) => (
                        <div
                            key={idx}
                            style={{
                                padding: "0.5rem",
                                textAlign: "center",
                                fontWeight: "bold",
                                backgroundColor: "var(--color-bg-muted)",
                            }}
                        >
                            {name}
                        </div>
                    ))}

                    {weeks.map((week, weekIdx) => (
                        <React.Fragment key={`week-row-${weekIdx}`}>
                            {/* Week number cell */}
                            <div
                                key={`week-${weekIdx}`}
                                style={{
                                    padding: "0.5rem",
                                    textAlign: "center",
                                    backgroundColor: "var(--color-bg-muted)",
                                    minHeight: "90px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "var(--color-text-tertiary)",
                                    fontSize: "0.9em",
                                    fontWeight: "500",
                                }}
                            >
                                {week.weekNumber}
                            </div>
                            {week.days.map((day, dayIdx) => {
                                let backgroundColor = "var(--color-bg-surface)";
                                let color = day.isCurrentMonth
                                    ? "var(--color-text-heading)"
                                    : "var(--color-text-disabled)";
                                let fontWeight = "normal";

                                if (day.isToday) {
                                    backgroundColor = "var(--color-today-bg)";
                                    color = "var(--color-today-text)";
                                    fontWeight = "bold";
                                } else if (day.isHoliday) {
                                    backgroundColor = "var(--color-holiday-bg)";
                                    color = "var(--color-holiday-text)";
                                    fontWeight = "bold";
                                }

                                const date = new Date(day.date);
                                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                                const dayEvents = events.filter((e) => e.date === dateStr);

                                return (
                                    <Link
                                        key={`${weekIdx}-${dayIdx}`}
                                        href={`/${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`}
                                        style={{
                                            padding: "0.25rem 0.5rem",
                                            backgroundColor,
                                            minHeight: "60px",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "flex-start",
                                            justifyContent: "flex-start",
                                            gap: "2px",
                                            color,
                                            opacity: day.isCurrentMonth ? 1 : 0.5,
                                            cursor: "pointer",
                                        }}
                                        title={day.holidayName}
                                    >
                                        <span
                                            style={{
                                                fontWeight,
                                                fontSize: "0.9em",
                                                lineHeight: "1.6",
                                            }}
                                        >
                                            {day.dayOfMonth}
                                        </span>
                                        {dayEvents.map((event) => {
                                            const chip = getChipStyle(event.type);
                                            return (
                                                <span
                                                    key={event.eventId}
                                                    style={{
                                                        backgroundColor: chip.background,
                                                        color: chip.color,
                                                        fontSize: "0.7em",
                                                        borderRadius: "3px",
                                                        padding: "1px 4px",
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        maxWidth: "100%",
                                                        display: "block",
                                                    }}
                                                >
                                                    {event.title}
                                                </span>
                                            );
                                        })}
                                    </Link>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </main>
    );
}
