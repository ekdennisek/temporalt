"use server";

import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { createEvent } from "@/lib/db/calendarEvents";

const CreateEventSchema = z.object({
    title: z.string().min(1).max(500),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
    endTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
    notes: z.string().max(5000).nullable().optional(),
});

export async function createCalendarEvent(
    data: z.infer<typeof CreateEventSchema>,
) {
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized");

    const parsed = CreateEventSchema.parse(data);

    return createEvent(user.userId, {
        type: "event",
        title: parsed.title,
        date: parsed.date,
        startTime: parsed.startTime ?? null,
        endTime: parsed.endTime ?? null,
        notes: parsed.notes ?? null,
    });
}
