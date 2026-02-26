"use server";

import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { createEvent, updateEvent, deleteEvent } from "@/lib/db/calendarEvents";

const EventType = z.enum(["event", "tracking", "birthday"]);

const BaseSchema = z.object({
    type: EventType.default("event"),
    title: z.string().min(1).max(500),
    date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
    startTime: z
        .string()
        .regex(/^\d{2}:\d{2}$/)
        .nullable()
        .optional(),
    endTime: z
        .string()
        .regex(/^\d{2}:\d{2}$/)
        .nullable()
        .optional(),
    notes: z.string().max(5000).nullable().optional(),
    birthMonth: z.number().int().min(1).max(12).optional(),
    birthDay: z.number().int().min(1).max(31).optional(),
    birthYear: z.number().int().min(1).max(9999).nullable().optional(),
});

function addConditionalValidation<T extends z.ZodTypeAny>(schema: T) {
    return schema.pipe(
        z.any().superRefine((data, ctx) => {
            if (data.type === "birthday") {
                if (data.birthMonth == null)
                    ctx.addIssue({ code: "custom", path: ["birthMonth"], message: "Required" });
                if (data.birthDay == null)
                    ctx.addIssue({ code: "custom", path: ["birthDay"], message: "Required" });
            } else {
                if (!data.date)
                    ctx.addIssue({ code: "custom", path: ["date"], message: "Required" });
            }
        }),
    );
}

const CreateEventSchema = addConditionalValidation(BaseSchema);

const UpdateEventSchema = addConditionalValidation(
    BaseSchema.extend({ eventId: z.number().int().positive() }),
);

function computeBirthdayDate(month: number, day: number, year?: number | null): string {
    const y = year ?? 2000;
    return `${String(y).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export async function createCalendarEvent(data: z.input<typeof BaseSchema>) {
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized");

    const parsed = CreateEventSchema.parse(data);

    if (parsed.type === "birthday") {
        return createEvent(user.userId, {
            type: "birthday",
            title: parsed.title,
            date: computeBirthdayDate(parsed.birthMonth, parsed.birthDay, parsed.birthYear),
            startTime: null,
            endTime: null,
            notes: parsed.notes ?? null,
            birthMonth: parsed.birthMonth,
            birthDay: parsed.birthDay,
            birthYear: parsed.birthYear ?? null,
        });
    }

    return createEvent(user.userId, {
        type: parsed.type,
        title: parsed.title,
        date: parsed.date,
        startTime: parsed.startTime ?? null,
        endTime: parsed.endTime ?? null,
        notes: parsed.notes ?? null,
    });
}

export async function updateCalendarEvent(
    data: z.input<typeof BaseSchema> & { eventId: number },
) {
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized");

    const parsed = UpdateEventSchema.parse(data);

    if (parsed.type === "birthday") {
        return updateEvent(user.userId, parsed.eventId, {
            type: "birthday",
            title: parsed.title,
            date: computeBirthdayDate(parsed.birthMonth, parsed.birthDay, parsed.birthYear),
            startTime: null,
            endTime: null,
            notes: parsed.notes ?? null,
            birthMonth: parsed.birthMonth,
            birthDay: parsed.birthDay,
            birthYear: parsed.birthYear ?? null,
        });
    }

    return updateEvent(user.userId, parsed.eventId, {
        type: parsed.type,
        title: parsed.title,
        date: parsed.date,
        startTime: parsed.startTime ?? null,
        endTime: parsed.endTime ?? null,
        notes: parsed.notes ?? null,
        birthMonth: null,
        birthDay: null,
        birthYear: null,
    });
}

export async function deleteCalendarEvent(eventId: number) {
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized");

    const rowCount = await deleteEvent(user.userId, eventId);
    if (!rowCount) throw new Error("Event not found");
}
