import { and, eq } from "drizzle-orm";
import { oauthAccounts } from "../schema";
import type { DbInsertOauthAccount, DbOauthAccount } from "./types";
import { AUTH_METHODS } from "$configs/auth-methods";
import { db } from "../index";

/*
 * CREATE
 **/
export async function createOauthAccount(newOauthAccount: DbInsertOauthAccount): Promise<DbOauthAccount | undefined> {
  const res = await db.client.insert(oauthAccounts).values(newOauthAccount).onConflictDoNothing().returning();

  if (res.length === 0) return;

  return res[0];
}

/*
 * READ
 **/
// export async function getAllOauthAccounts(): Promise<DbOauthAccount[] | []> {
//   return await db.client.query.oauthAccounts.findMany();
// }

export async function getOAuthAccountByProviderUserId(providerId: AUTH_METHODS, providerUserId: string): Promise<DbOauthAccount | undefined> {
  if (!providerId || !providerUserId) return;

  return await db.client.query.oauthAccounts.findFirst({
    where: and(eq(oauthAccounts.providerId, providerId), eq(oauthAccounts.providerUserId, providerUserId))
  });
}

/*
 * UPDATE
 **/

/*
 * DELETE
 **/
// export async function deleteOauthAccountByProviderId(providerId: string): Promise<DbOauthAccount | undefined> {
//   if (!providerId) return;

//   const res = await db.client.delete(users).where(eq(users.id, id)).returning();

//   if (res.length === 0) return;

//   return res[0];
// }
