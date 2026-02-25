"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const SNAP_THRESHOLD = 80; // px

interface Props {
    prevHref: string;
    nextHref: string;
    prevContent: React.ReactNode;
    nextContent: React.ReactNode;
    children: React.ReactNode;
}

export default function CalendarSwipeHandler({
    prevHref,
    nextHref,
    prevContent,
    nextContent,
    children,
}: Props) {
    const router = useRouter();
    const trackRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);
    const isHorizontal = useRef<boolean | null>(null);

    const setTranslate = (offset: number, animated: boolean) => {
        const el = trackRef.current;
        if (!el) return;
        el.style.transition = animated ? "transform 300ms ease-out" : "none";
        el.style.transform = `translateX(calc(-100vw + ${offset}px))`;
    };

    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;

        const onTouchStart = (e: TouchEvent) => {
            touchStartX.current = e.touches[0].clientX;
            touchStartY.current = e.touches[0].clientY;
            isHorizontal.current = null;
        };

        const onTouchMove = (e: TouchEvent) => {
            if (touchStartX.current === null || touchStartY.current === null) return;
            const dx = e.touches[0].clientX - touchStartX.current;
            const dy = e.touches[0].clientY - touchStartY.current;

            if (isHorizontal.current === null) {
                if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
                isHorizontal.current = Math.abs(dx) > Math.abs(dy);
            }

            if (!isHorizontal.current) return;

            e.preventDefault(); // suppress scroll — requires non-passive listener
            setTranslate(dx, false);
        };

        const onTouchEnd = (e: TouchEvent) => {
            if (touchStartX.current === null || !isHorizontal.current) {
                touchStartX.current = null;
                return;
            }
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            touchStartX.current = null;

            if (dx < -SNAP_THRESHOLD) {
                setTranslate(-window.innerWidth, true);
                setTimeout(() => router.push(nextHref), 300);
            } else if (dx > SNAP_THRESHOLD) {
                setTranslate(window.innerWidth, true);
                setTimeout(() => router.push(prevHref), 300);
            } else {
                setTranslate(0, true);
            }
        };

        el.addEventListener("touchstart", onTouchStart);
        el.addEventListener("touchmove", onTouchMove, { passive: false });
        el.addEventListener("touchend", onTouchEnd);

        return () => {
            el.removeEventListener("touchstart", onTouchStart);
            el.removeEventListener("touchmove", onTouchMove);
            el.removeEventListener("touchend", onTouchEnd);
        };
    }, [prevHref, nextHref, router]);

    return (
        <div style={{ overflow: "hidden", width: "100vw", height: "100vh" }}>
            <div
                ref={trackRef}
                style={{
                    display: "flex",
                    width: "300vw",
                    height: "100%",
                    transform: "translateX(-100vw)",
                    willChange: "transform",
                }}
            >
                <div style={{ width: "100vw", flexShrink: 0 }}>{prevContent}</div>
                <div style={{ width: "100vw", flexShrink: 0 }}>{children}</div>
                <div style={{ width: "100vw", flexShrink: 0 }}>{nextContent}</div>
            </div>
        </div>
    );
}
