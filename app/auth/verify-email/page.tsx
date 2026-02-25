import { getTranslations } from "next-intl/server";
import { Card } from "@/components/Card";
import { Link, Text } from "@/components/Text";

interface Props {
    searchParams: Promise<{ error?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: Props) {
    const { error } = await searchParams;
    const t = await getTranslations("verifyEmailPage");

    if (error === "invalid_token") {
        return (
            <Card>
                <Text variant="h1">{t("invalidTokenHeading")}</Text>
                <Text>{t("invalidTokenDescription")}</Text>
                <Link href="/auth/register">{t("invalidTokenLink")}</Link>
            </Card>
        );
    }

    if (error === "expired_token" || error === "missing_token") {
        return (
            <Card>
                <Text variant="h1">{t("expiredTokenHeading")}</Text>
                <Text>{t("expiredTokenDescription")}</Text>
                <Link href="/auth/register">{t("expiredTokenLink")}</Link>
            </Card>
        );
    }

    // On success the API route redirects to / — this page is only shown on error.
    return (
        <Card>
            <Text variant="h1">{t("errorHeading")}</Text>
            <Text>{t("errorDescription")}</Text>
            <Link href="/auth/register">{t("errorLink")}</Link>
        </Card>
    );
}
