"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";

type Props = {
    user: { email: string } | null;
};

export default function UserFAB({ user }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const t = useTranslations("userFAB");

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    async function handleLogout() {
        setOpen(false);
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/auth/login");
        router.refresh();
    }

    return (
        <div ref={ref} style={{ position: "fixed", top: 16, right: 16, zIndex: 1000 }}>
            <button
                onClick={() => setOpen((o) => !o)}
                aria-label={t("ariaLabel")}
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    border: "none",
                    backgroundColor: "var(--color-fab-user-bg)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "var(--shadow-fab)",
                    padding: 0,
                }}
            >
                <svg viewBox="0 0 24 24" width={22} height={22} fill="white" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
            </button>
            {open && (
                <div
                    style={{
                        position: "absolute",
                        top: 52,
                        right: 0,
                        backgroundColor: "var(--color-bg-surface)",
                        border: "1px solid var(--color-border-default)",
                        borderRadius: 8,
                        boxShadow: "var(--shadow-dropdown)",
                        minWidth: 160,
                        overflow: "hidden",
                    }}
                >
                    {user ? (
                        <button
                            onClick={handleLogout}
                            style={{
                                display: "block",
                                width: "100%",
                                padding: "10px 16px",
                                textAlign: "left",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: 14,
                                color: "var(--color-text-primary)",
                            }}
                        >
                            {t("logOut")}
                        </button>
                    ) : (
                        <>
                            <Link
                                href="/auth/login"
                                style={{
                                    display: "block",
                                    padding: "10px 16px",
                                    fontSize: 14,
                                    textDecoration: "none",
                                    color: "var(--color-text-primary)",
                                }}
                            >
                                {t("logIn")}
                            </Link>
                            <Link
                                href="/auth/register"
                                style={{
                                    display: "block",
                                    padding: "10px 16px",
                                    fontSize: 14,
                                    textDecoration: "none",
                                    color: "var(--color-text-primary)",
                                    borderTop: "1px solid var(--color-border-light)",
                                }}
                            >
                                {t("register")}
                            </Link>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
