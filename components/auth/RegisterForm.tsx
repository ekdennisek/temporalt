"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface Props {
    onEmailChange?: (email: string) => void;
}

export function RegisterForm({ onEmailChange }: Props) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const t = useTranslations("registerForm");

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const form = e.currentTarget;
        const email = (form.elements.namedItem("email") as HTMLInputElement).value;
        const password = (form.elements.namedItem("password") as HTMLInputElement).value;

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? t("registrationFailed"));
                return;
            }

            setSuccess(true);
        } catch {
            setError(t("networkError"));
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <p
                style={{
                    color: "#1a7a1a",
                    background: "#e8f5e8",
                    padding: "12px",
                    borderRadius: 6,
                    fontSize: 14,
                }}
            >
                {t("checkEmail")}
            </p>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            {error && (
                <p
                    role="alert"
                    style={{
                        color: "#c00",
                        background: "#ffe6e6",
                        padding: "8px 12px",
                        borderRadius: 4,
                        fontSize: 14,
                        marginBottom: 12,
                    }}
                >
                    {error}
                </p>
            )}
            <div style={{ marginBottom: 16 }}>
                <label
                    htmlFor="email"
                    style={{ display: "block", fontSize: 14, marginBottom: 4, color: "#333" }}
                >
                    {t("email")}
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    onChange={(e) => onEmailChange?.(e.target.value)}
                    style={{
                        display: "block",
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #ddd",
                        borderRadius: 6,
                        fontSize: 14,
                    }}
                />
            </div>
            <div style={{ marginBottom: 16 }}>
                <label
                    htmlFor="password"
                    style={{ display: "block", fontSize: 14, marginBottom: 4, color: "#333" }}
                >
                    {t("password")}
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={12}
                    autoComplete="new-password"
                    style={{
                        display: "block",
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #ddd",
                        borderRadius: 6,
                        fontSize: 14,
                    }}
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                style={{
                    width: "100%",
                    padding: "10px 0",
                    background: "#0070f3",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 15,
                    cursor: "pointer",
                    marginTop: 4,
                    opacity: loading ? 0.7 : 1,
                }}
            >
                {loading ? t("creatingAccount") : t("createAccount")}
            </button>
        </form>
    );
}
