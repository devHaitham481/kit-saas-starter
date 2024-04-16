import type { Handle } from "@sveltejs/kit";
import { db, schema } from "$lib/server/db";
import { drizzle } from "drizzle-orm/d1";

export const database: Handle = async ({ event, resolve }) => {
  db.client = drizzle(event.platform?.env.DB as D1Database, { schema });

  event.locals.db = db.client;

  return resolve(event);
};
