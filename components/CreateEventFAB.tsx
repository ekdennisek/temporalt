"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createCalendarEvent } from "@/lib/actions/calendarEvents";

type EventType = "event" | "tracking" | "birthday";

const TYPE_KEYS: Record<EventType, string> = {
    event: "typeEvent",
    tracking: "typeTracking",
    birthday: "typeBirthday",
};

function todayAsDateString() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export default function CreateEventFAB() {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<EventType>("event");
    const [title, setTitle] = useState("");
    const [date, setDate] = useState(todayAsDateString);
    const [startTime, setStartTime] = useState("");
    const [notes, setNotes] = useState("");
    const [birthMonth, setBirthMonth] = useState(1);
    const [birthDay, setBirthDay] = useState(1);
    const [birthYear, setBirthYear] = useState("");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const t = useTranslations("createEventFAB");

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function handleOpen() {
        setType("event");
        setDate(todayAsDateString());
        setTitle("");
        setStartTime("");
        setNotes("");
        setBirthMonth(1);
        setBirthDay(1);
        setBirthYear("");
        setError(null);
        setOpen((o) => !o);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setPending(true);
        setError(null);
        try {
            if (type === "birthday") {
                await createCalendarEvent({
                    type: "birthday",
                    title,
                    birthMonth,
                    birthDay,
                    birthYear: birthYear ? parseInt(birthYear, 10) : null,
                    notes: notes || null,
                });
            } else {
                await createCalendarEvent({
                    type,
                    title,
                    date,
                    startTime: startTime || null,
                    notes: notes || null,
                });
            }
            setOpen(false);
            router.refresh();
        } catch {
            setError(t("errorGeneric"));
        } finally {
            setPending(false);
        }
    }

    const inputStyle: React.CSSProperties = {
        padding: "6px 8px",
        border: "1px solid #ccc",
        borderRadius: 4,
        fontSize: 14,
    };

    return (
        <div ref={ref} style={{ position: "fixed", top: 16, right: 68, zIndex: 1000 }}>
            <button
                onClick={handleOpen}
                aria-label={t("ariaLabel")}
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    border: "none",
                    backgroundColor: "#22c55e",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    padding: 0,
                    fontSize: 24,
                    color: "white",
                    fontWeight: "bold",
                    lineHeight: 1,
                }}
            >
                +
            </button>
            {open && (
                <div
                    style={{
                        position: "absolute",
                        top: 52,
                        right: 0,
                        backgroundColor: "white",
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                        width: 280,
                        overflow: "hidden",
                        padding: "16px",
                    }}
                >
                    <form
                        onSubmit={handleSubmit}
                        style={{ display: "flex", flexDirection: "column", gap: 10 }}
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
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <label style={{ fontSize: 12, color: "#555" }}>{t("titleLabel")}</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                autoFocus
                                style={inputStyle}
                            />
                        </div>
                        {type === "birthday" ? (
                            <>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                                        <label style={{ fontSize: 12, color: "#555" }}>
                                            {t("birthMonthLabel")}
                                        </label>
                                        <select
                                            value={birthMonth}
                                            onChange={(e) => setBirthMonth(parseInt(e.target.value, 10))}
                                            style={inputStyle}
                                        >
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <option key={i + 1} value={i + 1}>
                                                    {t(`month${i + 1}`)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                                        <label style={{ fontSize: 12, color: "#555" }}>
                                            {t("birthDayLabel")}
                                        </label>
                                        <select
                                            value={birthDay}
                                            onChange={(e) => setBirthDay(parseInt(e.target.value, 10))}
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
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    <label style={{ fontSize: 12, color: "#555" }}>
                                        {t("birthYearLabel")}
                                    </label>
                                    <input
                                        type="number"
                                        value={birthYear}
                                        onChange={(e) => setBirthYear(e.target.value)}
                                        min={1}
                                        max={9999}
                                        placeholder=""
                                        style={inputStyle}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    <label style={{ fontSize: 12, color: "#555" }}>
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
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    <label style={{ fontSize: 12, color: "#555" }}>
                                        {t("startTimeLabel")}
                                    </label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        style={inputStyle}
                                    />
                                </div>
                            </>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <label style={{ fontSize: 12, color: "#555" }}>{t("notesLabel")}</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                style={{
                                    ...inputStyle,
                                    resize: "vertical",
                                }}
                            />
                        </div>
                        {error && <p style={{ fontSize: 13, color: "#c00", margin: 0 }}>{error}</p>}
                        <button
                            type="submit"
                            disabled={pending}
                            style={{
                                padding: "8px",
                                backgroundColor: "#0070f3",
                                color: "white",
                                border: "none",
                                borderRadius: 4,
                                cursor: pending ? "not-allowed" : "pointer",
                                fontSize: 14,
                                opacity: pending ? 0.7 : 1,
                            }}
                        >
                            {pending ? t("saving") : t("save")}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
