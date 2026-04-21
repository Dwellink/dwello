import { type Config } from "drizzle-kit";

// Route drizzle-kit migrations/pushes into the "kan" schema via libpq's
// -c search_path option. Keeps generated SQL unqualified (matches the
// runtime client) while isolating Kan's tables from the host database.
const rawUrl = process.env.POSTGRES_URL ?? "";
const urlWithSearchPath = rawUrl
  ? rawUrl +
    (rawUrl.includes("?") ? "&" : "?") +
    "options=-c%20search_path%3Dkan%2Cpublic"
  : "";

export default {
  schema: "./src/schema",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: urlWithSearchPath,
    ssl: process.env.NODE_ENV === "production" ? true : false,
  },
  schemaFilter: ["kan"],
  migrations: {
    prefix: "timestamp",
  },
} satisfies Config;
