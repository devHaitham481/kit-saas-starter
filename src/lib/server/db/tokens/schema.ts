import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { users } from "../schema";
import { TOKEN_LEN } from "../../../configs/fields-length";

enum TOKEN_TYPE {
  EMAIL_CHANGE = "email_change",
  EMAIL_VERIFICATION = "email_verification",
  PASSWORD_RESET = "password_reset"
}

export const tokens = sqliteTable("tokens", {
  token: text("token", { length: TOKEN_LEN }).primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  type: text("type", { enum: [TOKEN_TYPE.EMAIL_CHANGE, TOKEN_TYPE.EMAIL_VERIFICATION, TOKEN_TYPE.PASSWORD_RESET] }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
});
