import Link from "next/link";

interface Props {
    searchParams: Promise<{ error?: string }>;
}

const card: React.CSSProperties = {
    maxWidth: 380,
    margin: "80px auto",
    padding: 32,
    background: "white",
    border: "1px solid #e0e0e0",
    borderRadius: 10,
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
};

const heading: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 12,
    color: "#111",
};

const body: React.CSSProperties = {
    color: "#555",
    marginBottom: 20,
    fontSize: 14,
};

const link: React.CSSProperties = {
    color: "#0070f3",
    fontSize: 14,
};

export default async function VerifyEmailPage({ searchParams }: Props) {
    const { error } = await searchParams;

    if (error === "invalid_token") {
        return (
            <main style={card}>
                <h1 style={heading}>Invalid activation link</h1>
                <p style={body}>This link is invalid or has already been used.</p>
                <Link href="/auth/register" style={link}>Request a new activation email</Link>
            </main>
        );
    }

    if (error === "expired_token" || error === "missing_token") {
        return (
            <main style={card}>
                <h1 style={heading}>Activation link expired</h1>
                <p style={body}>Your activation link has expired. Register again to receive a new one.</p>
                <Link href="/auth/register" style={link}>Register</Link>
            </main>
        );
    }

    // On success the API route redirects to / — this page is only shown on error.
    return (
        <main style={card}>
            <h1 style={heading}>Something went wrong</h1>
            <p style={body}>Please try again.</p>
            <Link href="/auth/register" style={link}>Back to registration</Link>
        </main>
    );
}
