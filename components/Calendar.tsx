"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { initializePolyfills } from "@/lib/polyfills";
import { calculateWeekNumber } from "@/lib/weekNumber";
import { isSwedishHoliday } from "@/lib/swedishHolidays";

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isToday: boolean;
}

interface CalendarWeek {
  weekNumber: number;
  days: CalendarDay[];
}

interface CalendarProps {
  year: number;
  month: number;
}

function getWeekStartDay(): number {
  if (typeof window === "undefined") {
    return 1; // Default to Monday on server
  }

  try {
    const locale = new Intl.Locale(navigator.language || "en-US");
    if ("getWeekInfo" in locale && typeof locale.getWeekInfo === "function") {
      const weekInfo = locale.getWeekInfo();
      return weekInfo.firstDay % 7;
    }
  } catch (e) {
    console.warn("Failed to get week info:", e);
  }

  return 1; // Default to Monday
}

function generateCalendar(
  year: number,
  month: number,
  weekStartDay: number,
  locale: string,
): CalendarWeek[] {
  const weeks: CalendarWeek[] = [];

  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);

  // Get today's date for comparison
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  const currentDate = new Date(firstDayOfMonth);
  const firstDayWeekday = currentDate.getDay();

  // Calculate days to go back to start of the week
  const daysToGoBack = (firstDayWeekday - weekStartDay + 7) % 7;

  // If first day of month starts at the beginning of a week (no previous month days needed),
  // add one full week from previous month
  if (daysToGoBack === 0) {
    currentDate.setDate(currentDate.getDate() - 7);
  } else {
    // Otherwise just go back to complete the first week
    currentDate.setDate(currentDate.getDate() - daysToGoBack);
  }

  // Generate weeks until we complete the last week containing days from current month
  while (currentDate <= lastDayOfMonth) {
    const week: CalendarDay[] = [];
    const weekStartDate = new Date(currentDate);

    for (let i = 0; i < 7; i++) {
      const isCurrentMonth =
        currentDate.getMonth() === month - 1 &&
        currentDate.getFullYear() === year;
      const holidayInfo = isSwedishHoliday(currentDate);
      const isToday =
        currentDate.getFullYear() === todayYear &&
        currentDate.getMonth() === todayMonth &&
        currentDate.getDate() === todayDay;

      week.push({
        date: new Date(currentDate),
        dayOfMonth: currentDate.getDate(),
        isCurrentMonth,
        isHoliday: holidayInfo.isHoliday,
        holidayName: holidayInfo.name,
        isToday,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const weekNumber = calculateWeekNumber(weekStartDate, locale);
    weeks.push({ weekNumber, days: week });
  }

  // Check if the last week already contains days from next month
  const lastWeek = weeks[weeks.length - 1];
  const hasNextMonthDays = lastWeek.days.some(
    (day) =>
      day.date.getMonth() !== month - 1 || day.date.getFullYear() !== year,
  );

  // If last week is entirely within current month, add one full week from next month
  if (!hasNextMonthDays) {
    const extraWeek: CalendarDay[] = [];
    const extraWeekStartDate = new Date(currentDate);

    for (let i = 0; i < 7; i++) {
      const isCurrentMonth =
        currentDate.getMonth() === month - 1 &&
        currentDate.getFullYear() === year;
      const holidayInfo = isSwedishHoliday(currentDate);
      const isToday =
        currentDate.getFullYear() === todayYear &&
        currentDate.getMonth() === todayMonth &&
        currentDate.getDate() === todayDay;

      extraWeek.push({
        date: new Date(currentDate),
        dayOfMonth: currentDate.getDate(),
        isCurrentMonth,
        isHoliday: holidayInfo.isHoliday,
        holidayName: holidayInfo.name,
        isToday,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const extraWeekNumber = calculateWeekNumber(extraWeekStartDate, locale);
    weeks.push({ weekNumber: extraWeekNumber, days: extraWeek });
  }

  return weeks;
}

function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat(navigator.language || "en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatMonthName(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat(navigator.language || "en-US", {
    month: "long",
  }).format(date);
}

function getWeekdayNames(weekStartDay: number): string[] {
  const names: string[] = [];
  const baseDate = new Date(2024, 0, 7);

  for (let i = 0; i < 7; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + ((weekStartDay + i) % 7));
    const name = new Intl.DateTimeFormat(navigator.language || "en-US", {
      weekday: "short",
    }).format(date);
    names.push(name);
  }

  return names;
}

function getPreviousMonth(
  year: number,
  month: number,
): { year: number; month: number } {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}

function getNextMonth(
  year: number,
  month: number,
): { year: number; month: number } {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }
  return { year, month: month + 1 };
}

export default function Calendar({ year, month }: CalendarProps) {
  const [mounted, setMounted] = useState(false);

  // Initialize on mount
  useEffect(() => {
    initializePolyfills();
    queueMicrotask(() => {
      setMounted(true);
    });
  }, []);

  // Get locale-specific week start day
  const weekStartDay = typeof window !== "undefined" ? getWeekStartDay() : 1;

  if (!mounted) {
    return null; // Or a loading skeleton
  }

  const locale = navigator.language || "en-US";
  const weeks = generateCalendar(year, month, weekStartDay, locale);
  const monthYearText = formatMonthYear(year, month);
  const weekdayNames = getWeekdayNames(weekStartDay);

  const prev = getPreviousMonth(year, month);
  const next = getNextMonth(year, month);

  const prevMonthName = formatMonthName(prev.year, prev.month);
  const nextMonthName = formatMonthName(next.year, next.month);

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
              color: "#0070f3",
              whiteSpace: "nowrap",
              fontSize: "0.9rem",
            }}
          >
            ← {prevMonthName}
          </Link>
          <h1
            style={{
              whiteSpace: "nowrap",
              fontSize: "1.5rem",
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
              color: "#0070f3",
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
            backgroundColor: "#ddd",
            border: "1px solid #ddd",
            overflow: "hidden",
          }}
        >
          {/* Week number header */}
          <div
            style={{
              padding: "0.75rem 0.5rem",
              textAlign: "center",
              fontWeight: "bold",
              backgroundColor: "#f5f5f5",
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
                backgroundColor: "#f5f5f5",
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
                  backgroundColor: "#f5f5f5",
                  minHeight: "100px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#666",
                  fontSize: "0.9em",
                  fontWeight: "500",
                }}
              >
                {week.weekNumber}
              </div>
              {week.days.map((day, dayIdx) => {
                let backgroundColor = "white";
                let color = day.isCurrentMonth ? "#000" : "#999";
                let fontWeight = "normal";

                if (day.isToday) {
                  backgroundColor = "#e6f3ff";
                  color = "#0066cc";
                  fontWeight = "bold";
                } else if (day.isHoliday) {
                  backgroundColor = "#ffe6e6";
                  color = "#c00";
                  fontWeight = "bold";
                }

                return (
                  <Link
                    key={`${weekIdx}-${dayIdx}`}
                    href={`/${day.date.getFullYear()}/${day.date.getMonth() + 1}/${day.date.getDate()}`}
                    style={{
                      padding: "0.5rem",
                      textAlign: "center",
                      backgroundColor,
                      minHeight: "60px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color,
                      opacity: day.isCurrentMonth ? 1 : 0.5,
                      fontWeight,
                      cursor: "pointer",
                    }}
                    title={day.holidayName}
                  >
                    {day.dayOfMonth}
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
