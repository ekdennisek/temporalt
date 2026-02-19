import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { isSwedishHoliday } from "@/lib/swedishHolidays";

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
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return {};
  const acceptLanguage = (await headers()).get("accept-language");
  const locale = acceptLanguage?.split(",")[0]?.split(";")[0]?.trim() ?? "sv-SE";
  const title = new Intl.DateTimeFormat(locale, { dateStyle: "full" })
    .format(date)
    .replace(/^\w/, (c) => c.toUpperCase());
  return { title };
}

function getRelativeDayText(date: Date): string {
  const today = new Date();
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const dateMidnight = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const diffMs = dateMidnight.getTime() - todayMidnight.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Idag";
  } else if (diffDays === 1) {
    return "Imorgon";
  } else if (diffDays === -1) {
    return "Igår";
  } else if (diffDays > 1) {
    return `Om ${diffDays} dagar`;
  } else {
    return `${Math.abs(diffDays)} dagar sedan`;
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
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    redirect("/");
  }

  const formattedDate = new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "full",
  }).format(date);

  const holidayInfo = isSwedishHoliday(date);
  const relativeText = getRelativeDayText(date);

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
          &larr; Tillbaka till kalendern
        </Link>
      </div>
    </main>
  );
}
