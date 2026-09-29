import { createClient, type Client, type InArgs } from "@libsql/client/web";

/**
 * Thin prepared-statement wrapper over Turso (libSQL, i.e. SQLite).
 * Same dialect and the same `?1` placeholders as the schema in migrations/.
 */
export interface Db {
  prepare(sql: string): Statement;
}

export interface Statement {
  bind(...args: unknown[]): Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<T[]>;
  run(): Promise<{ rowsAffected: number }>;
}

export function createDb(url: string | undefined, authToken: string | undefined): Db {
  let client: Client | null = null;
  const conn = () => {
    if (!url) throw new Error("TURSO_DATABASE_URL is not set");
    return (client ??= createClient({ url, authToken }));
  };
  const statement = (sql: string, args: unknown[]): Statement => ({
    bind: (...next) => statement(sql, next),
    async first<T>() {
      const rs = await conn().execute({ sql, args: args as InArgs });
      return (rs.rows[0] as T | undefined) ?? null;
    },
    async all<T>() {
      const rs = await conn().execute({ sql, args: args as InArgs });
      return rs.rows as T[];
    },
    async run() {
      const rs = await conn().execute({ sql, args: args as InArgs });
      return { rowsAffected: rs.rowsAffected };
    },
  });
  return { prepare: (sql) => statement(sql, []) };
}
