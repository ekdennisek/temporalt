"use client";

import { useState, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";

type Props = {
    onEmailChange?: (email: string) => void;
};

export function RegisterForm({ onEmailChange }: Props) {
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
                    color: "var(--color-success-text)",
                    background: "var(--color-success-bg)",
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
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {error && (
                <p
                    role="alert"
                    style={{
                        color: "var(--color-error-text)",
                        background: "var(--color-error-bg)",
                        padding: "8px 12px",
                        borderRadius: 4,
                        fontSize: 14,
                    }}
                >
                    {error}
                </p>
            )}
            <FormField label={t("email")} htmlFor="email">
                <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    onChange={(e) => onEmailChange?.(e.target.value)}
                />
            </FormField>
            <FormField label={t("password")} htmlFor="password">
                <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={12}
                    autoComplete="new-password"
                />
            </FormField>
            <Button type="submit" disabled={loading} fullWidth>
                {loading ? t("creatingAccount") : t("createAccount")}
            </Button>
        </form>
    );
}
