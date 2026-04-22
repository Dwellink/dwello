import { type Config } from "drizzle-kit";

// Schema isolation is done via pgSchema('kan') wrappers in src/schema/_table.ts —
// drizzle-kit hardcodes schema names in generated SQL, so search_path alone
// doesn't work. schemaFilter keeps drizzle-kit from treating Dwellink's
// public.* tables as orphans to drop.
export default {
  schema: "./src/schema",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL ?? "",
    ssl: process.env.NODE_ENV === "production" ? true : false,
  },
  schemaFilter: ["kan"],
  migrations: {
    prefix: "timestamp",
  },
} satisfies Config;
