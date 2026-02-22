export async function register() {
    if (process.env.NEXT_RUNTIME !== "nodejs") return;

    const { runMigrations } = await import("./lib/db/migrate");
    try {
        await runMigrations();
    } catch (error) {
        console.error("[migrate] Migration runner failed:", error);
        throw error;
    }
}
