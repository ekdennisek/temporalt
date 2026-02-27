"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type Props = {
    onEmailChange?: (email: string) => void;
};

export function LoginForm({ onEmailChange }: Props) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const t = useTranslations("loginForm");

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const form = e.currentTarget;
        const email = (form.elements.namedItem("email") as HTMLInputElement).value;
        const password = (form.elements.namedItem("password") as HTMLInputElement).value;

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? t("loginFailed"));
                return;
            }

            router.push("/");
            router.refresh();
        } catch {
            setError(t("networkError"));
        } finally {
            setLoading(false);
        }
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
                    autoComplete="current-password"
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
                {loading ? t("loggingIn") : t("logIn")}
            </button>
        </form>
    );
}
