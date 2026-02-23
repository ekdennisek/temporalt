"use client";

import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface Props {
    email: string;
}

export function PasskeyRegisterButton({ email }: Props) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const t = useTranslations("passkeyRegisterButton");

    async function handleClick() {
        setError(null);
        setLoading(true);

        try {
            // Step 1: fetch registration options from the server
            const optRes = await fetch(
                `/api/auth/webauthn/register-options?email=${encodeURIComponent(email)}`,
            );
            if (!optRes.ok) {
                setError(t("failedToStart"));
                return;
            }
            const { options, email: confirmedEmail } = await optRes.json();

            // Step 2: ask the browser / authenticator to create a credential
            let credential;
            try {
                credential = await startRegistration({ optionsJSON: options });
            } catch (err) {
                if (err instanceof Error && err.name === "NotAllowedError") {
                    setError(t("cancelled"));
                } else {
                    setError(t("failedToCreate"));
                }
                return;
            }

            // Step 3: verify the credential on the server
            const verifyRes = await fetch("/api/auth/webauthn/register-verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: confirmedEmail,
                    challenge: options.challenge,
                    credential,
                }),
            });

            if (!verifyRes.ok) {
                const data = await verifyRes.json();
                setError(data.error ?? t("registrationFailed"));
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
                <p role="alert" style={{ color: "#c00", background: "#ffe6e6", padding: "8px 12px", borderRadius: 4, fontSize: 14, marginBottom: 12 }}>
                    {error}
                </p>
            )}
            <button
                type="button"
                onClick={handleClick}
                disabled={loading || !email}
                style={{ width: "100%", padding: "10px 0", background: "transparent", color: "#0070f3", border: "1px solid #0070f3", borderRadius: 6, fontSize: 15, cursor: "pointer", opacity: (loading || !email) ? 0.5 : 1 }}
            >
                {loading ? t("settingUp") : t("registerWithPasskey")}
            </button>
        </div>
    );
}
