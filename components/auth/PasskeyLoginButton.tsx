"use client";

import { useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type Props = {
    email: string;
};

export function PasskeyLoginButton({ email }: Props) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const t = useTranslations("passkeyLoginButton");

    async function handleClick() {
        setError(null);
        setLoading(true);

        try {
            // Step 1: fetch authentication options from the server
            const optRes = await fetch(
                `/api/auth/webauthn/auth-options?email=${encodeURIComponent(email)}`,
            );
            if (!optRes.ok) {
                setError(t("failedToStart"));
                return;
            }
            const { options } = await optRes.json();

            // Step 2: ask the browser / authenticator to sign the challenge
            let credential;
            try {
                credential = await startAuthentication({ optionsJSON: options });
            } catch (err) {
                if (err instanceof Error && err.name === "NotAllowedError") {
                    setError(t("cancelled"));
                } else {
                    setError(t("loginFailed"));
                }
                return;
            }

            // Step 3: verify the assertion on the server
            const verifyRes = await fetch("/api/auth/webauthn/auth-verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    challenge: options.challenge,
                    credential,
                }),
            });

            if (!verifyRes.ok) {
                const data = await verifyRes.json();
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
        <div>
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
            <button
                type="button"
                onClick={handleClick}
                disabled={loading || !email}
                style={{
                    width: "100%",
                    padding: "10px 0",
                    background: "transparent",
                    color: "var(--color-link)",
                    border: "1px solid var(--color-link)",
                    borderRadius: 6,
                    fontSize: 15,
                    cursor: "pointer",
                    opacity: loading || !email ? 0.5 : 1,
                }}
            >
                {loading ? t("authenticating") : t("logInWithPasskey")}
            </button>
        </div>
    );
}
