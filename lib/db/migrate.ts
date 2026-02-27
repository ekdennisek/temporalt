import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import sql from "sql-template-tag";
import { z } from "zod";
import { many, none, tx } from "../queries";

const MIGRATIONS_DIR = join(process.cwd(), "db", "migrations");
const MIGRATION_FILENAME_RE = /^(\d+)-[a-z0-9-]+\.sql$/;

type MigrationFile = {
    id: number;
    filename: string;
    fullPath: string;
};

async function discoverMigrations(): Promise<MigrationFile[]> {
    const entries = await readdir(MIGRATIONS_DIR);
    const migrations: MigrationFile[] = [];

    for (const filename of entries) {
        const match = MIGRATION_FILENAME_RE.exec(filename);
        if (!match) continue;
        migrations.push({
            id: parseInt(match[1], 10),
            filename,
            fullPath: join(MIGRATIONS_DIR, filename),
        });
    }

    migrations.sort((a, b) => a.id - b.id);

    const seen = new Set<number>();
    for (const m of migrations) {
        if (seen.has(m.id)) {
            throw new Error(`Duplicate migration ID ${m.id} in db/migrations/`);
        }
        seen.add(m.id);
    }

    return migrations;
}

const migrationIdSchema = z.object({ migrationId: z.number() });

export async function runMigrations(): Promise<void> {
    await none(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            "migrationId" INTEGER     PRIMARY KEY,
            "filename"    TEXT        NOT NULL,
            "appliedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    const migrations = await discoverMigrations();
    const applied = await many(`SELECT "migrationId" FROM schema_migrations`, migrationIdSchema);
    const appliedIds = new Set(applied.map((r) => r.migrationId));
    const pending = migrations.filter((m) => !appliedIds.has(m.id));

    if (pending.length === 0) {
        console.log("[migrate] All migrations are up to date.");
        return;
    }

    console.log(`[migrate] Applying ${pending.length} migration(s)...`);
    for (const migration of pending) {
        console.log(`[migrate] → ${migration.filename}`);
        const migrationSql = await readFile(migration.fullPath, "utf8");
        await tx(async () => {
            await none(migrationSql);
            await none(sql`
                INSERT INTO schema_migrations ("migrationId", "filename")
                VALUES (${migration.id}, ${migration.filename})
            `);
        });
    }
    console.log("[migrate] Done.");
}
