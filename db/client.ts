import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync, SQLiteDatabase } from "expo-sqlite";
import { Effect } from "effect";
import * as schema from "./schema";
import { DatabaseInitError } from "@/lib/errors";

/**
 * Initialize the SQLite database with proper error handling.
 * Returns an Effect that either succeeds with the database instance
 * or fails with a DatabaseInitError.
 */
const initDatabase = Effect.try({
  try: (): SQLiteDatabase => {
    const db = openDatabaseSync("zkb-budget.db", {
      enableChangeListener: true,
    });
    // Enable foreign key enforcement (SQLite has it disabled by default)
    db.execSync("PRAGMA foreign_keys = ON;");
    return db;
  },
  catch: (error) => new DatabaseInitError({ cause: error }),
});

/**
 * Run the database initialization effect synchronously.
 * This is necessary because Expo SQLite requires synchronous initialization
 * and React Native modules need to be available immediately.
 *
 * If initialization fails, the error is logged and re-thrown to crash early
 * rather than allowing the app to run in a broken state.
 */
const runDatabaseInit = (): SQLiteDatabase => {
  const result = Effect.runSyncExit(initDatabase);

  if (result._tag === "Failure") {
    const error = result.cause;
    // Log the error for debugging
    console.error("Database initialization failed:", error);
    // In development, we want to crash early with a clear error
    // In production, this would ideally show an error screen
    throw new Error(
      `Failed to initialize database. Please restart the app. Details: ${JSON.stringify(error)}`
    );
  }

  return result.value;
};

const expoDb = runDatabaseInit();

export const db = drizzle(expoDb, { schema });
