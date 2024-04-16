import { eq } from "drizzle-orm";
import { users } from "../schema";
import type { DbInsertUser, DbUpdateUser, DbUser } from "./types";
import { db } from "../index";

/*
 * CREATE
 **/
export async function createUser(newUser: DbInsertUser): Promise<DbUser | undefined> {
  const res = await db.client.insert(users).values(newUser).onConflictDoNothing().returning();

  if (res.length === 0) return;

  return res[0];
}

/*
 * READ
 **/
export async function getAllUsers(): Promise<DbUser[] | []> {
  return await db.client.query.users.findMany();
}

export async function getUserByEmail(email: string): Promise<DbUser | undefined> {
  if (!email) return;

  return await db.client.query.users.findFirst({ where: eq(users.email, email) });
}

export async function getUserById(id: string): Promise<DbUser | undefined> {
  if (!id) return;

  return await db.client.query.users.findFirst({ where: eq(users.id, id) });
}

export async function getUserByUsername(username: string): Promise<DbUser | undefined> {
  if (!username) return;

  return await db.client.query.users.findFirst({ where: eq(users.username, username) });
}

/*
 * UPDATE
 **/
// export async function updateUserByEmail(email: string, userData: DbUpdateUser): Promise<DbUser | undefined> {
//   if (!email) return;

//   const res = await db.client.update(users).set(userData).where(eq(users.email, email)).returning();

//   if (res.length === 0) {
//     logger.error(`Failed to update User with email=${email}!`);
//     return;
//   }

//   return res[0];
// }

export async function updateUserById(id: string, userData: DbUpdateUser): Promise<DbUser | undefined> {
  if (!id) return;

  const res = await db.client.update(users).set(userData).where(eq(users.id, id)).returning();

  if (res.length === 0) return;

  return res[0];
}

/*
 * DELETE
 **/
// export async function deleteUserByEmail(email: string): Promise<DbUser | undefined> {
//   if (!email) return;

//   const res = await db.client.delete(users).where(eq(users.email, email)).returning();

//   if (res.length === 0) {
//     logger.error(`Failed to delete User with email=${email}!`);
//     return;
//   }

//   return res[0];
// }

export async function deleteUserById(id: string): Promise<DbUser | undefined> {
  if (!id) return;

  const res = await db.client.delete(users).where(eq(users.id, id)).returning();

  if (res.length === 0) return;

  return res[0];
}
