"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";

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
                    autoComplete="current-password"
                />
            </FormField>
            <Button type="submit" disabled={loading} fullWidth>
                {loading ? t("loggingIn") : t("logIn")}
            </Button>
        </form>
    );
}
