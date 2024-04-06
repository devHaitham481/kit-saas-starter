import type { Handle } from "@sveltejs/kit";
import { drizzle } from "drizzle-orm/d1";

import * as schema from "$lib/server/db/schema";

export const database: Handle = async ({ event, resolve }) => {
  event.locals.db = drizzle(event.platform?.env.DB as D1Database, { schema });

  return resolve(event);
};
