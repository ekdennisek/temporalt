"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { CalendarEvent } from "@/lib/db/calendarEvents";
import { updateCalendarEvent, deleteCalendarEvent } from "@/lib/actions/calendarEvents";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/Button";
import { SegmentedControl } from "@/components/SegmentedControl";

type EventType = "event" | "tracking" | "birthday";

const EVENT_TYPES = ["event", "tracking", "birthday"] as const;

const TYPE_KEYS: Record<EventType, string> = {
    event: "typeEvent",
    tracking: "typeTracking",
    birthday: "typeBirthday",
};

type EventItemProps = {
    event: CalendarEvent;
};

export default function EventItem({ event }: EventItemProps) {
    const t = useTranslations("eventItem");
    const router = useRouter();

    const [mode, setMode] = useState<"view" | "edit">("view");
    const [type, setType] = useState<EventType>(
        (EVENT_TYPES as readonly string[]).includes(event.type)
            ? (event.type as EventType)
            : "event",
    );
    const [title, setTitle] = useState(event.title);
    const [date, setDate] = useState(event.date);
    const [startTime, setStartTime] = useState(event.startTime?.slice(0, 5) ?? "");
    const [endTime, setEndTime] = useState(event.endTime?.slice(0, 5) ?? "");
    const [notes, setNotes] = useState(event.notes ?? "");
    const [birthMonth, setBirthMonth] = useState(event.birthMonth ?? 1);
    const [birthDay, setBirthDay] = useState(event.birthDay ?? 1);
    const [birthYear, setBirthYear] = useState(
        event.birthYear != null ? String(event.birthYear) : "",
    );
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    function enterEdit() {
        const eventType: EventType = (EVENT_TYPES as readonly string[]).includes(event.type)
            ? (event.type as EventType)
            : "event";
        setType(eventType);
        setTitle(event.type === "birthday" ? event.title.replace(/\s*\(\d+\)$/, "") : event.title);
        setDate(event.date);
        setStartTime(event.startTime?.slice(0, 5) ?? "");
        setEndTime(event.endTime?.slice(0, 5) ?? "");
        setNotes(event.notes ?? "");
        setBirthMonth(event.birthMonth ?? 1);
        setBirthDay(event.birthDay ?? 1);
        setBirthYear(event.birthYear != null ? String(event.birthYear) : "");
        setError(null);
        setMode("edit");
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setPending(true);
        setError(null);
        try {
            if (type === "birthday") {
                await updateCalendarEvent({
                    eventId: event.eventId,
                    type: "birthday",
                    title,
                    birthMonth,
                    birthDay,
                    birthYear: birthYear ? parseInt(birthYear, 10) : null,
                    notes: notes || null,
                });
            } else {
                await updateCalendarEvent({
                    eventId: event.eventId,
                    type,
                    title,
                    date,
                    startTime: startTime || null,
                    endTime: endTime || null,
                    notes: notes || null,
                });
            }
            setMode("view");
            router.refresh();
        } catch {
            setError(t("errorGeneric"));
        } finally {
            setPending(false);
        }
    }

    async function handleDelete() {
        setPending(true);
        setError(null);
        try {
            await deleteCalendarEvent(event.eventId);
            router.refresh();
        } catch {
            setError(t("errorDelete"));
            setPending(false);
        }
    }

    const typeLabels = Object.fromEntries(
        EVENT_TYPES.map((k) => [k, t(TYPE_KEYS[k])]),
    ) as Record<EventType, string>;

    const liStyle: React.CSSProperties = {
        padding: "0.5rem 0.75rem",
        border: `1px solid ${mode === "edit" ? "var(--color-link)" : "var(--color-border-subtle)"}`,
        borderRadius: "6px",
        textAlign: "left",
        fontSize: "0.95rem",
    };

    if (mode === "edit") {
        return (
            <li style={liStyle}>
                <form
                    onSubmit={handleSave}
                    style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}
                >
                    <SegmentedControl
                        options={EVENT_TYPES}
                        value={type}
                        onChange={setType}
                        labels={typeLabels}
                    />
                    <FormField label={t("titleLabel")}>
                        <Input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </FormField>
                    {type === "birthday" ? (
                        <>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <FormField label={t("birthMonthLabel")} style={{ flex: 1 }}>
                                    <Select
                                        value={birthMonth}
                                        onChange={(e) =>
                                            setBirthMonth(parseInt(e.target.value, 10))
                                        }
                                    >
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>
                                                {t(`month${i + 1}`)}
                                            </option>
                                        ))}
                                    </Select>
                                </FormField>
                                <FormField label={t("birthDayLabel")} style={{ flex: 1 }}>
                                    <Select
                                        value={birthDay}
                                        onChange={(e) => setBirthDay(parseInt(e.target.value, 10))}
                                    >
                                        {Array.from({ length: 31 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>
                                                {i + 1}
                                            </option>
                                        ))}
                                    </Select>
                                </FormField>
                            </div>
                            <FormField label={t("birthYearLabel")}>
                                <Input
                                    type="number"
                                    value={birthYear}
                                    onChange={(e) => setBirthYear(e.target.value)}
                                    min={1}
                                    max={9999}
                                />
                            </FormField>
                        </>
                    ) : (
                        <>
                            <FormField label={t("dateLabel")}>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </FormField>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <FormField
                                    label={t(
                                        type === "event"
                                            ? "startTimeLabel"
                                            : "startTimeLabelOptional",
                                    )}
                                    style={{ flex: 1 }}
                                >
                                    <Input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        required={type === "event"}
                                    />
                                </FormField>
                                <FormField label={t("endTimeLabel")} style={{ flex: 1 }}>
                                    <Input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                    />
                                </FormField>
                            </div>
                        </>
                    )}
                    <FormField label={t("notesLabel")}>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </FormField>
                    {error && (
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-error-text)" }}>{error}</p>
                    )}
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Button type="submit" disabled={pending}>
                            {pending ? t("saving") : t("save")}
                        </Button>
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={() => setMode("view")}
                            disabled={pending}
                        >
                            {t("cancel")}
                        </Button>
                    </div>
                </form>
            </li>
        );
    }

    return (
        <li style={liStyle}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                {event.startTime && (
                    <span style={{ color: "var(--color-text-tertiary)", fontSize: "0.85rem", flexShrink: 0 }}>
                        {event.startTime.slice(0, 5)}
                    </span>
                )}
                <span style={{ flexGrow: 1 }}>{event.title}</span>
                <Button variant="ghost" onClick={enterEdit}>
                    {t("edit")}
                </Button>
                {!confirmDelete ? (
                    <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                        {t("delete")}
                    </Button>
                ) : (
                    <>
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            disabled={pending}
                            style={{ fontWeight: "bold" }}
                        >
                            {pending ? t("deleting") : t("confirmDelete")}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setConfirmDelete(false)}
                            disabled={pending}
                            style={{ color: "var(--color-text-tertiary)" }}
                        >
                            {t("cancel")}
                        </Button>
                    </>
                )}
            </div>
            {event.notes && (
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                    {event.notes}
                </p>
            )}
            {error && (
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--color-error-text)" }}>{error}</p>
            )}
        </li>
    );
}
