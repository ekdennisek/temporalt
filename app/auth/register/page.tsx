"use client";

import { useState } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { PasskeyRegisterButton } from "@/components/auth/PasskeyRegisterButton";
import { useTranslations } from "next-intl";

const card: React.CSSProperties = {
    maxWidth: 380,
    margin: "80px auto",
    padding: 32,
    background: "white",
    border: "1px solid #e0e0e0",
    borderRadius: 10,
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
};

const divider: React.CSSProperties = {
    borderTop: "1px solid #eee",
    margin: "20px 0",
};

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const t = useTranslations("registerPage");

    return (
        <main style={card}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: "#111" }}>{t("heading")}</h1>
            <section>
                <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "#333" }}>{t("emailAndPassword")}</h2>
                <RegisterForm onEmailChange={setEmail} />
            </section>
            <div style={divider} />
            <section>
                <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: "#333" }}>{t("orUsePasskey")}</h2>
                <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>{t("passkeyDescription")}</p>
                <PasskeyRegisterButton email={email} />
            </section>
        </main>
    );
}
