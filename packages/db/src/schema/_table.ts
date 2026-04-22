import { pgSchema } from "drizzle-orm/pg-core";

// All Kan tables/enums live in the "kan" Postgres schema so this
// deployment can share a database with the host app (Dwellink) without
// colliding on table names like "user", "session", or enum names like
// "role" / "notification_type". drizzle-kit hardcodes schema names in
// generated SQL, so we MUST define schema membership here — search_path
// alone is not enough.
//
// Each schema file imports `pgTable` and `pgEnum` from this module
// instead of from "drizzle-orm/pg-core", so a single edit reroutes
// every table.
export const kanSchema = pgSchema("kan");
export const pgTable = kanSchema.table;
export const pgEnum = kanSchema.enum;
