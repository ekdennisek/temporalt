"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { CalendarEvent } from "@/lib/db/calendarEvents";
import { updateCalendarEvent, deleteCalendarEvent } from "@/lib/actions/calendarEvents";

type EventType = "event" | "tracking" | "birthday";

const TYPE_KEYS: Record<EventType, string> = {
    event: "typeEvent",
    tracking: "typeTracking",
    birthday: "typeBirthday",
};

interface EventItemProps {
    event: CalendarEvent;
}

export default function EventItem({ event }: EventItemProps) {
    const t = useTranslations("eventItem");
    const router = useRouter();

    const [mode, setMode] = useState<"view" | "edit">("view");
    const [type, setType] = useState<EventType>(
        (["event", "tracking", "birthday"] as const).includes(event.type as EventType)
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
    const [birthYear, setBirthYear] = useState(event.birthYear != null ? String(event.birthYear) : "");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    function enterEdit() {
        const eventType: EventType = (["event", "tracking", "birthday"] as const).includes(
            event.type as EventType,
        )
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

    const liStyle: React.CSSProperties = {
        padding: "0.5rem 0.75rem",
        border: `1px solid ${mode === "edit" ? "#0070f3" : "#e5e7eb"}`,
        borderRadius: "6px",
        textAlign: "left",
        fontSize: "0.95rem",
    };

    const btnBase: React.CSSProperties = {
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "0 0.25rem",
        fontSize: "0.8rem",
    };

    const inputStyle: React.CSSProperties = {
        padding: "0.25rem 0.4rem",
        fontSize: "0.9rem",
        borderRadius: "4px",
        border: "1px solid #ccc",
    };

    if (mode === "edit") {
        return (
            <li style={liStyle}>
                <form
                    onSubmit={handleSave}
                    style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}
                >
                    <div
                        style={{
                            display: "flex",
                            gap: 0,
                            borderRadius: 4,
                            overflow: "hidden",
                            border: "1px solid #ccc",
                        }}
                    >
                        {(["event", "tracking", "birthday"] as const).map((opt) => (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => setType(opt)}
                                style={{
                                    flex: 1,
                                    padding: "6px 0",
                                    fontSize: 13,
                                    border: "none",
                                    cursor: "pointer",
                                    backgroundColor: type === opt ? "#0070f3" : "white",
                                    color: type === opt ? "white" : "#555",
                                    fontWeight: type === opt ? "600" : "normal",
                                }}
                            >
                                {t(TYPE_KEYS[opt])}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                        <label style={{ fontSize: "0.8rem", color: "#666" }}>
                            {t("titleLabel")}
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            style={inputStyle}
                        />
                    </div>
                    {type === "birthday" ? (
                        <>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.2rem",
                                        flex: 1,
                                    }}
                                >
                                    <label style={{ fontSize: "0.8rem", color: "#666" }}>
                                        {t("birthMonthLabel")}
                                    </label>
                                    <select
                                        value={birthMonth}
                                        onChange={(e) =>
                                            setBirthMonth(parseInt(e.target.value, 10))
                                        }
                                        style={inputStyle}
                                    >
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>
                                                {t(`month${i + 1}`)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.2rem",
                                        flex: 1,
                                    }}
                                >
                                    <label style={{ fontSize: "0.8rem", color: "#666" }}>
                                        {t("birthDayLabel")}
                                    </label>
                                    <select
                                        value={birthDay}
                                        onChange={(e) =>
                                            setBirthDay(parseInt(e.target.value, 10))
                                        }
                                        style={inputStyle}
                                    >
                                        {Array.from({ length: 31 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>
                                                {i + 1}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.2rem",
                                }}
                            >
                                <label style={{ fontSize: "0.8rem", color: "#666" }}>
                                    {t("birthYearLabel")}
                                </label>
                                <input
                                    type="number"
                                    value={birthYear}
                                    onChange={(e) => setBirthYear(e.target.value)}
                                    min={1}
                                    max={9999}
                                    style={inputStyle}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.2rem",
                                }}
                            >
                                <label style={{ fontSize: "0.8rem", color: "#666" }}>
                                    {t("dateLabel")}
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.2rem",
                                        flex: 1,
                                    }}
                                >
                                    <label style={{ fontSize: "0.8rem", color: "#666" }}>
                                        {t(type === "event" ? "startTimeLabel" : "startTimeLabelOptional")}
                                    </label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        required={type === "event"}
                                        style={inputStyle}
                                    />
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.2rem",
                                        flex: 1,
                                    }}
                                >
                                    <label style={{ fontSize: "0.8rem", color: "#666" }}>
                                        {t("endTimeLabel")}
                                    </label>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                        <label style={{ fontSize: "0.8rem", color: "#666" }}>
                            {t("notesLabel")}
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            style={{
                                ...inputStyle,
                                resize: "vertical",
                            }}
                        />
                    </div>
                    {error && (
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#c00" }}>{error}</p>
                    )}
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                            type="submit"
                            disabled={pending}
                            style={{
                                ...btnBase,
                                padding: "0.3rem 0.75rem",
                                background: "#0070f3",
                                color: "#fff",
                                borderRadius: "4px",
                                fontSize: "0.85rem",
                            }}
                        >
                            {pending ? t("saving") : t("save")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("view")}
                            disabled={pending}
                            style={{
                                ...btnBase,
                                padding: "0.3rem 0.75rem",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                                fontSize: "0.85rem",
                            }}
                        >
                            {t("cancel")}
                        </button>
                    </div>
                </form>
            </li>
        );
    }

    return (
        <li style={liStyle}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                {event.startTime && (
                    <span style={{ color: "#666", fontSize: "0.85rem", flexShrink: 0 }}>
                        {event.startTime.slice(0, 5)}
                    </span>
                )}
                <span style={{ flexGrow: 1 }}>{event.title}</span>
                <button onClick={enterEdit} style={{ ...btnBase, color: "#0070f3" }}>
                    {t("edit")}
                </button>
                {!confirmDelete ? (
                    <button
                        onClick={() => setConfirmDelete(true)}
                        style={{ ...btnBase, color: "#c00" }}
                    >
                        {t("delete")}
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handleDelete}
                            disabled={pending}
                            style={{ ...btnBase, color: "#c00", fontWeight: "bold" }}
                        >
                            {pending ? t("deleting") : t("confirmDelete")}
                        </button>
                        <button
                            onClick={() => setConfirmDelete(false)}
                            disabled={pending}
                            style={{ ...btnBase, color: "#666" }}
                        >
                            {t("cancel")}
                        </button>
                    </>
                )}
            </div>
            {event.notes && (
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#888" }}>
                    {event.notes}
                </p>
            )}
            {error && (
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#c00" }}>{error}</p>
            )}
        </li>
    );
}
