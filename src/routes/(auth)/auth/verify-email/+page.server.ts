import { route } from "$lib/ROUTES";
import type { PageServerLoad } from "./$types";
import { redirect, type Actions } from "@sveltejs/kit";
import { verifyEmailFormSchema, type VerifyEmailFormSchema } from "$validations/auth";
import { superValidate, message } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { logger } from "$lib/logger";
import { createAndSetSession, verifyToken } from "$lib/server/auth/auth-utils";
import { getUserByEmail, updateUserById } from "$lib/server/db/users";
import { sendWelcomeEmail } from "$lib/server/email/send";
import { AUTH_METHODS } from "$configs/auth-methods";
import { TOKEN_TYPE } from "$lib/server/db/tokens";

export const load = (async ({ locals: { user } }) => {
  if (!user) redirect(302, route("/auth/login"));
  if (user.isVerified) redirect(302, route("/dashboard"));

  const form = await superValidate<VerifyEmailFormSchema, FlashMessage>(zod(verifyEmailFormSchema));

  return { form };
}) satisfies PageServerLoad;

export const actions: Actions = {
  default: async ({ cookies, request, locals: { db, user, lucia } }) => {
    if (!user) redirect(302, route("/auth/login"));
    if (user.isVerified) redirect(302, route("/dashboard"));

    const form = await superValidate<VerifyEmailFormSchema, FlashMessage>(request, zod(verifyEmailFormSchema));

    if (!form.valid) {
      logger.debug("Invalid form");

      return message(form, { status: "error", text: "Invalid form" });
    }

    const { token } = form.data;
    const { id: userId, email, name } = user;

    const isValidToken = await verifyToken(db, userId, token, TOKEN_TYPE.EMAIL_VERIFICATION);
    if (!isValidToken) {
      return message(form, { status: "error", text: "Invalid token" }, { status: 500 });
    }

    await lucia.invalidateUserSessions(userId);

    const existingUser = await getUserByEmail(db, email);
    if (!existingUser) {
      return message(form, { status: "error", text: "User not found" }, { status: 404 });
    }

    const authMethods = existingUser.authMethods ?? [];
    authMethods.push(AUTH_METHODS.EMAIL);

    const updatedUser = await updateUserById(db, userId, { isVerified: true, authMethods });
    if (!updatedUser) {
      return message(form, { status: "error", text: "User not found" }, { status: 404 });
    }

    await createAndSetSession(lucia, userId, cookies);

    await sendWelcomeEmail(email, name);

    redirect(302, route("/dashboard"));
  }
};
