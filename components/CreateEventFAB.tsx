"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createCalendarEvent } from "@/lib/actions/calendarEvents";
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
    const [endTime, setEndTime] = useState("");
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
        setEndTime("");
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
                    endTime: endTime || null,
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

    const typeLabels = Object.fromEntries(
        EVENT_TYPES.map((k) => [k, t(TYPE_KEYS[k])]),
    ) as Record<EventType, string>;

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
                    backgroundColor: "var(--color-fab-create-bg)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "var(--shadow-fab)",
                    padding: 0,
                    fontSize: 24,
                    color: "var(--color-text-on-primary)",
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
                        backgroundColor: "var(--color-bg-surface)",
                        border: "1px solid var(--color-border-default)",
                        borderRadius: 8,
                        boxShadow: "var(--shadow-dropdown)",
                        width: 280,
                        overflow: "hidden",
                        padding: "16px",
                    }}
                >
                    <form
                        onSubmit={handleSubmit}
                        style={{ display: "flex", flexDirection: "column", gap: 10 }}
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
                                autoFocus
                            />
                        </FormField>
                        {type === "birthday" ? (
                            <>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <FormField label={t("birthMonthLabel")} style={{ flex: 1 }}>
                                        <Select
                                            value={birthMonth}
                                            onChange={(e) => setBirthMonth(parseInt(e.target.value, 10))}
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
                                <div style={{ display: "flex", gap: 8 }}>
                                    <FormField
                                        label={t(type === "event" ? "startTimeLabel" : "startTimeLabelOptional")}
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
                                rows={2}
                            />
                        </FormField>
                        {error && <p style={{ fontSize: 13, color: "var(--color-error-text)", margin: 0 }}>{error}</p>}
                        <Button
                            type="submit"
                            disabled={pending}
                            style={{
                                padding: "8px",
                                fontSize: 14,
                                opacity: pending ? 0.7 : 1,
                            }}
                        >
                            {pending ? t("saving") : t("save")}
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
}
