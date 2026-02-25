"use client";

import { useState } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { PasskeyRegisterButton } from "@/components/auth/PasskeyRegisterButton";
import { useTranslations } from "next-intl";
import { Card } from "@/components/Card";
import { Text } from "@/components/Text";
import { Divider } from "@/components/Divider";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const t = useTranslations("registerPage");

    return (
        <Card>
            <Text variant="h1" style={{ marginBottom: 24 }}>
                {t("heading")}
            </Text>
            <section>
                <Text variant="h2">{t("emailAndPassword")}</Text>
                <RegisterForm onEmailChange={setEmail} />
            </section>
            <Divider />
            <section>
                <Text variant="h2" style={{ marginBottom: 8 }}>
                    {t("orUsePasskey")}
                </Text>
                <Text variant="helper">{t("passkeyDescription")}</Text>
                <PasskeyRegisterButton email={email} />
            </section>
        </Card>
    );
}
