"use client";

import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { PasskeyLoginButton } from "@/components/auth/PasskeyLoginButton";
import Link from "next/link";

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

export default function LoginPage() {
    const [email, setEmail] = useState("");

    return (
        <main style={card}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: "#111" }}>Log in</h1>
            <section>
                <LoginForm onEmailChange={setEmail} />
            </section>
            <div style={divider} />
            <section>
                <PasskeyLoginButton email={email} />
            </section>
            <p style={{ marginTop: 20, textAlign: "center", fontSize: 14, color: "#555" }}>
                No account?{" "}
                <Link href="/auth/register" style={{ color: "#0070f3" }}>Create one</Link>
            </p>
        </main>
    );
}
