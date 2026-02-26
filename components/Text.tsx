import NextLink, { LinkProps } from "next/link";
import React from "react";
import styles from "./Text.module.css";

type Props = {
    variant?: "body" | "helper" | "h1" | "h2";
    children: React.ReactNode;
    style?: React.CSSProperties;
};

export function Text({ variant, children, style }: Props) {
    switch (variant) {
        default:
        case "body":
            return (
                <p className={styles.body} style={{ ...style }}>
                    {children}
                </p>
            );
        case "helper":
            return (
                <p className={styles.helper} style={{ ...style }}>
                    {children}
                </p>
            );
        case "h1":
            return (
                <h1 className={styles.h1} style={{ ...style }}>
                    {children}
                </h1>
            );
        case "h2":
            return (
                <h2 className={styles.h2} style={{ ...style }}>
                    {children}
                </h2>
            );
    }
}

export function Link({ children, ...props }: LinkProps & { children: React.ReactNode }) {
    return (
        <NextLink className={styles.link} {...props}>
            {children}
        </NextLink>
    );
}
