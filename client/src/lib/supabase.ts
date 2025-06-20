import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// For now, use direct DATABASE_URL until we get Supabase credentials
const DATABASE_URL = import.meta.env.VITE_DATABASE_URL || "postgresql://localhost:5432/relocation_db";

const client = postgres(DATABASE_URL, {
  prepare: false,
});

export const db = drizzle(client, { schema });
