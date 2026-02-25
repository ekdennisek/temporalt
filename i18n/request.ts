import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";
import { FALLBACK_LOCALE } from "../lib/locale";

export default getRequestConfig(async () => {
    const acceptLanguage = (await headers()).get("accept-language");
    const locale = acceptLanguage?.split(",")[0]?.split(";")[0]?.trim() ?? FALLBACK_LOCALE;
    return {
        locale,
        messages: (await import("../messages/sv.json")).default,
    };
});
