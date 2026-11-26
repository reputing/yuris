import { getCloudflareContext } from "@opennextjs/cloudflare";

// The small slice of D1 this app uses, so the same queries run against D1 in production and an in-memory
// SQLite in the tests.
export interface Db {
  prepare(sql: string): { bind(...v: unknown[]): { all<T = Record<string, unknown>>(): Promise<{ results: T[] }>; first<T = Record<string, unknown>>(): Promise<T | null>; run(): Promise<unknown> } };
  batch?(stmts: unknown[]): Promise<unknown>;
}

export async function env(): Promise<CloudflareEnv> {
  return (await getCloudflareContext({ async: true })).env as CloudflareEnv;
}
export async function db(): Promise<Db> {
  return (await env()).DB as unknown as Db;
}
