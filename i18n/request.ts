import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => ({
  locale: "sv",
  messages: (await import("../messages/sv.json")).default,
}));
