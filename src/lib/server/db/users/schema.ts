import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { USER_ID_LEN } from "../../../configs/fields-length";
import { AUTH_METHODS } from "../../../configs/auth-methods";
import { sql } from "drizzle-orm";
import { SubscriptionStatus } from "$enums/subscription-status.enum";

export const users = sqliteTable("users", {
  id: text("id", { length: USER_ID_LEN }).notNull().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"),
  username: text("username").notNull().unique(),
  authMethods: text("auth_methods", { mode: "json" }).$type<AUTH_METHODS[]>().notNull(),
  avatarUrl: text("avatar_url"),
  isVerified: integer("is_verified", { mode: "boolean" }).notNull().default(false),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$default(() => new Date()),
  modifiedAt: integer("modified_at", { mode: "timestamp_ms" })
    .default(sql`null`)
    .$onUpdate(() => new Date()),
  customerId: text("customer_id").unique(),
  plan: text("plan"),
  priceId: text("price_id"),
  subscriptionId: text("subscription_id"),
  subscriptionStatus: text("subscription_status", {
    enum: [
      SubscriptionStatus.Active,
      SubscriptionStatus.Canceled,
      SubscriptionStatus.Incomplete,
      SubscriptionStatus.IncompleteExpired,
      SubscriptionStatus.PastDue,
      SubscriptionStatus.Trialing,
      SubscriptionStatus.Unpaid,
      SubscriptionStatus.Paused
    ]
  })
});
