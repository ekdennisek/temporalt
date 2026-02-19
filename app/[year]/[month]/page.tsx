import type { Metadata } from "next";
import { redirect } from 'next/navigation';
import { getLocale } from "next-intl/server";
import Calendar from '@/components/Calendar';

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
    redirect('/');
  }

  const locale = await getLocale();

  return <Calendar year={year} month={month} locale={locale} />;
}
