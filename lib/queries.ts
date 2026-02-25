import { AsyncLocalStorage } from "async_hooks";
import { Pool, PoolClient, QueryResultRow, types } from "pg";
import { Sql } from "sql-template-tag";
import { ZodType } from "zod";

type SqlLike = Sql | string;

const asyncLocalStorage = new AsyncLocalStorage<PoolClient>();
const pool = new Pool();
types.setTypeParser(types.builtins.DATE, (value) => value); // DATE -> string
types.setTypeParser(types.builtins.INT8, (value) => parseInt(value, 10)); // INT8 -> number
types.setTypeParser(types.builtins.NUMERIC, (value) => parseFloat(value)); // NUMERIC -> number

async function executeQuery<T extends QueryResultRow>(query: SqlLike, schema?: ZodType<T>) {
    let client = asyncLocalStorage.getStore();
    const releaseWhenDone = client === undefined;
    if (!client) {
        client = await pool.connect();
    }

    try {
        const result = await client.query<T>(query);
        if (schema) {
            result.rows = result.rows.map((row) => schema.parse(row));
        }
        return result;
    } finally {
        if (releaseWhenDone) {
            client.release();
        }
    }
}

export async function none(query: SqlLike) {
    const { rowCount } = await executeQuery(query);
    return rowCount;
}

export async function oneOrNone<T extends QueryResultRow>(query: SqlLike, schema: ZodType<T>) {
    const { rows } = await executeQuery<T>(query, schema);
    if (rows.length > 1) throw new Error("Expected one or zero rows");
    return rows.length ? rows[0] : undefined;
}

export async function one<T extends QueryResultRow>(query: SqlLike, schema: ZodType<T>) {
    const { rows } = await executeQuery<T>(query, schema);
    if (rows.length !== 1) throw new Error("Expected exactly one row");
    return rows[0];
}

export async function many<T extends QueryResultRow>(query: SqlLike, schema: ZodType<T>) {
    const { rows } = await executeQuery<T>(query, schema);
    return rows;
}

export async function tx<T>(cb: () => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
        return await asyncLocalStorage.run(client, async () => {
            await client.query("BEGIN");
            const result = await cb();
            await client.query("COMMIT");
            return result;
        });
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}
