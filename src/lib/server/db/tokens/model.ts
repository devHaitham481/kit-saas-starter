import { eq, and } from "drizzle-orm";
import { tokens } from "../schema";
import type { DbInsertToken, DbToken, TOKEN_TYPE } from "./types";
import { db } from "../index";

/*
 * CREATE
 **/
export async function createToken(newToken: DbInsertToken) {
  const res = await db.client.insert(tokens).values(newToken).onConflictDoNothing().returning();

  if (res.length === 0) return;

  return res[0];
}

/*
 * READ
 **/
export async function getToken(token: string): Promise<DbToken | undefined> {
  if (!token) return;

  return await db.client.query.tokens.findFirst({ where: eq(tokens.token, token) });
}

export async function getTokenByUserId(userId: string, type: TOKEN_TYPE): Promise<DbToken | undefined> {
  if (!userId || !type) return;

  return await db.client.query.tokens.findFirst({ where: and(eq(tokens.userId, userId), eq(tokens.type, type)) });
}

/*
 * UPDATE
 **/

/*
 * DELETE
 **/
export async function deleteAllTokensByUserId(userId: string, type: TOKEN_TYPE): Promise<DbToken[] | undefined> {
  if (!userId || !type) return;

  const res = await db.client
    .delete(tokens)
    .where(and(eq(tokens.userId, userId), eq(tokens.type, type)))
    .returning();

  if (res.length === 0) return;

  return res;
}

export async function deleteToken(token: string, type: TOKEN_TYPE): Promise<DbToken | undefined> {
  if (!token || !type) return;

  const res = await db.client
    .delete(tokens)
    .where(and(eq(tokens.token, token), eq(tokens.type, type)))
    .returning();

  if (res.length === 0) return;

  return res[0];
}
