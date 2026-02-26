import sql from "sql-template-tag";
import { z } from "zod";
import { many, none, one } from "../queries";

export const CalendarEventSchema = z.object({
    eventId: z.number(),
    userId: z.number(),
    type: z.string(),
    title: z.string(),
    date: z.string(), // "YYYY-MM-DD" (DATE parsed as string by pg type parser)
    startTime: z.string().nullable(),
    endTime: z.string().nullable(),
    notes: z.string().nullable(),
    birthMonth: z.number().nullable(),
    birthDay: z.number().nullable(),
    birthYear: z.number().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

export async function getEventsForMonth(
    userId: number,
    year: number,
    month: number,
): Promise<CalendarEvent[]> {
    const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth =
        month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
    return many(
        sql`
            SELECT * FROM calendar_events
            WHERE "userId" = ${userId}
              AND "type" <> 'birthday'
              AND "date" >= ${firstDay}
              AND "date" < ${nextMonth}
            ORDER BY "date", "startTime" NULLS LAST
        `,
        CalendarEventSchema,
    );
}

export async function getEventsForDate(
    userId: number,
    year: number,
    month: number,
    day: number,
): Promise<CalendarEvent[]> {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return many(
        sql`
            SELECT * FROM calendar_events
            WHERE "userId" = ${userId}
              AND "type" <> 'birthday'
              AND "date" = ${date}
            ORDER BY "startTime" NULLS LAST
        `,
        CalendarEventSchema,
    );
}

export async function getBirthdaysForMonth(
    userId: number,
    year: number,
    month: number,
): Promise<CalendarEvent[]> {
    return many(
        sql`
            SELECT * FROM calendar_events
            WHERE "userId" = ${userId}
              AND "type" = 'birthday'
              AND "birthMonth" = ${month}
              AND ("birthYear" IS NULL OR "birthYear" <= ${year})
            ORDER BY "birthDay"
        `,
        CalendarEventSchema,
    );
}

export async function getBirthdaysForDate(
    userId: number,
    year: number,
    month: number,
    day: number,
): Promise<CalendarEvent[]> {
    return many(
        sql`
            SELECT * FROM calendar_events
            WHERE "userId" = ${userId}
              AND "type" = 'birthday'
              AND "birthMonth" = ${month}
              AND "birthDay" = ${day}
              AND ("birthYear" IS NULL OR "birthYear" <= ${year})
            ORDER BY "title"
        `,
        CalendarEventSchema,
    );
}

export async function updateEvent(
    userId: number,
    eventId: number,
    data: {
        type?: string;
        title: string;
        date: string;
        startTime?: string | null;
        endTime?: string | null;
        notes?: string | null;
        birthMonth?: number | null;
        birthDay?: number | null;
        birthYear?: number | null;
    },
): Promise<CalendarEvent> {
    return one(
        sql`
            UPDATE calendar_events
            SET
                "type"       = ${data.type ?? "event"},
                "title"      = ${data.title},
                "date"       = ${data.date},
                "startTime"  = ${data.startTime ?? null},
                "endTime"    = ${data.endTime ?? null},
                "notes"      = ${data.notes ?? null},
                "birthMonth" = ${data.birthMonth ?? null},
                "birthDay"   = ${data.birthDay ?? null},
                "birthYear"  = ${data.birthYear ?? null},
                "updatedAt"  = NOW()
            WHERE "eventId" = ${eventId}
              AND "userId"  = ${userId}
            RETURNING *
        `,
        CalendarEventSchema,
    );
}

export async function deleteEvent(userId: number, eventId: number): Promise<number | null> {
    return none(
        sql`
            DELETE FROM calendar_events
            WHERE "eventId" = ${eventId}
              AND "userId"  = ${userId}
        `,
    );
}

export async function createEvent(
    userId: number,
    data: {
        type?: string;
        title: string;
        date: string;
        startTime?: string | null;
        endTime?: string | null;
        notes?: string | null;
        birthMonth?: number | null;
        birthDay?: number | null;
        birthYear?: number | null;
    },
): Promise<CalendarEvent> {
    return one(
        sql`
            INSERT INTO calendar_events
                ("userId", "type", "title", "date", "startTime", "endTime", "notes", "birthMonth", "birthDay", "birthYear")
            VALUES (
                ${userId},
                ${data.type ?? "event"},
                ${data.title},
                ${data.date},
                ${data.startTime ?? null},
                ${data.endTime ?? null},
                ${data.notes ?? null},
                ${data.birthMonth ?? null},
                ${data.birthDay ?? null},
                ${data.birthYear ?? null}
            )
            RETURNING *
        `,
        CalendarEventSchema,
    );
}
