"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/Button";

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
                        color: "var(--color-error-text)",
                        background: "var(--color-error-bg)",
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
                    style={{ display: "block", fontSize: 14, marginBottom: 4, color: "var(--color-text-primary)" }}
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
                        border: "1px solid var(--color-border-default)",
                        borderRadius: 6,
                        fontSize: 14,
                    }}
                />
            </div>
            <div style={{ marginBottom: 16 }}>
                <label
                    htmlFor="password"
                    style={{ display: "block", fontSize: 14, marginBottom: 4, color: "var(--color-text-primary)" }}
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
                        border: "1px solid var(--color-border-default)",
                        borderRadius: 6,
                        fontSize: 14,
                    }}
                />
            </div>
            <Button
                type="submit"
                disabled={loading}
                style={{
                    width: "100%",
                    padding: "10px 0",
                    borderRadius: 6,
                    fontSize: 15,
                    marginTop: 4,
                    opacity: loading ? 0.7 : 1,
                }}
            >
                {loading ? t("loggingIn") : t("logIn")}
            </Button>
        </form>
    );
}
