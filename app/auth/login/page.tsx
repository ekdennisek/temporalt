"use client";

import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { PasskeyLoginButton } from "@/components/auth/PasskeyLoginButton";
import { useTranslations } from "next-intl";
import { Card } from "@/components/Card";
import { Link, Text } from "@/components/Text";
import { Divider } from "@/components/Divider";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const t = useTranslations("loginPage");

    return (
        <Card>
            <Text variant="h1" style={{ marginBottom: 24 }}>
                {t("heading")}
            </Text>
            <section>
                <LoginForm onEmailChange={setEmail} />
            </section>
            <Divider />
            <section>
                <PasskeyLoginButton email={email} />
            </section>
            <Text style={{ marginTop: 20, textAlign: "center" }}>
                {t("noAccount")} <Link href="/auth/register">{t("createOne")}</Link>
            </Text>
        </Card>
    );
}
