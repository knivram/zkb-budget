import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

// TODO: #2 handle database loading error
const expoDb = openDatabaseSync("zkb-budget.db", {
  enableChangeListener: true,
});

// Enable foreign key enforcement (SQLite has it disabled by default)
expoDb.execSync("PRAGMA foreign_keys = ON;");

export const db = drizzle(expoDb, { schema });
