import { getSessionUser } from "@/lib/auth/session";
import { getBirthdaysForMonth, getEventsForMonth } from "@/lib/db/calendarEvents";

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

    const user = await getSessionUser();
    if (!user) {
        return Response.json({
            events: [],
            trackings: [],
            birthdays: [],
        });
    }

    const [events, birthdays] = await Promise.all([
        getEventsForMonth(user.userId, year, month),
        getBirthdaysForMonth(user.userId, year, month),
    ]);

    return Response.json({
        events: events.filter((e) => e.type === "event"),
        trackings: events.filter((e) => e.type === "tracking"),
        birthdays,
    });
}
