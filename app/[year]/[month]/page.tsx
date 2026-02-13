import { redirect } from 'next/navigation';
import Calendar from '@/components/Calendar';

interface PageProps {
  params: Promise<{
    year: string;
    month: string;
  }>;
}

export default async function CalendarPage({ params }: PageProps) {
  const { year: yearStr, month: monthStr } = await params;

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  // Validate year and month
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    redirect('/');
  }

  return <Calendar year={year} month={month} />;
}
