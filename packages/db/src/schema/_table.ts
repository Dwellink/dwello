import {
  pgSchema,
  pgTable as defaultPgTable,
  pgEnum as defaultPgEnum,
} from "drizzle-orm/pg-core";

// All Kan tables/enums live in the "kan" Postgres schema so this
// deployment can share a database with the host app (Dwellink) without
// colliding on table names like "user", "session", or enum names like
// "role" / "notification_type". drizzle-kit hardcodes schema names in
// generated SQL, so we MUST define schema membership at the table level —
// search_path alone is not enough.
//
// Cast the schema-scoped table/enum factories back to the default-pgTable
// type. Runtime behaviour is unchanged (SQL is still emitted as
// "kan"."user" etc.), but Drizzle's relational-query type inference
// (db.query.x.findFirst({with:{y:...}})) walks tables expecting the plain
// pgTable shape — the bare schema-scoped types break that walk and emit
// implicit-any / missing-property errors across every repository file.
export const kanSchema = pgSchema("kan");
export const pgTable: typeof defaultPgTable = kanSchema.table as never;
export const pgEnum: typeof defaultPgEnum = kanSchema.enum as never;
