import { generateCalendar } from "@/lib/utils/generateCalendar";

export async function GET(
    _: Request,
    { params }: { params: Promise<{ year: string; month: string }> },
) {
    const { year: yearRaw, month: monthRaw } = await params;
    const year = parseInt(yearRaw, 10);
    const month = parseInt(monthRaw, 10);
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return Response.json({ error: "Bad request" }, { status: 400 });
    }

    return Response.json(generateCalendar(year, month));
}
