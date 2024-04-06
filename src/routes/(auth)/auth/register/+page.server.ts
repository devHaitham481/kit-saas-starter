import type { PageServerLoad, Actions } from "./$types";
import { generateId } from "lucia";
import { createAndSetSession, generateToken } from "$lib/server/auth/auth-utils";
import { registerFormSchema, type RegisterFormSchema } from "$validations/auth";
import { superValidate, message } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { sendEmailVerificationEmail } from "$lib/server/email/send";
import { redirect, setFlash } from "sveltekit-flash-message/server";
import { route } from "$lib/ROUTES";
import { logger } from "$lib/logger";
import { createUser, getUserByEmail, updateUserById } from "$lib/server/db/users";
import { USER_ID_LEN } from "$configs/fields-length";
import { AUTH_METHODS } from "$configs/auth-methods";
import { hashPassword } from "worker-password-auth";
import { TOKEN_TYPE } from "$lib/server/db/tokens";
import { isAnonymous, validateTurnstileToken, verifyRateLimiter } from "$lib/server/security";
import { registerLimiter } from "$configs/rate-limiters/auth";
import { FLASH_MESSAGE_STATUS } from "$configs/general";
import { fail } from "@sveltejs/kit";
import * as m from "$paraglide/messages";

export const load: PageServerLoad = async ({ locals }) => {
  isAnonymous(locals);

  const form = await superValidate<RegisterFormSchema, FlashMessage>(zod(registerFormSchema));

  return { form };
};

export const actions: Actions = {
  default: async (event) => {
    const { request, locals, cookies, getClientAddress } = event;
    const flashMessage = { status: FLASH_MESSAGE_STATUS.ERROR, text: "" };

    isAnonymous(locals);

    const minutes = await verifyRateLimiter(event, registerLimiter);
    if (minutes) {
      flashMessage.text = m.core_form_shared_tooManyRequest({ minutes });
      logger.debug(flashMessage.text);

      setFlash(flashMessage, cookies);
      return fail(429);
    }

    const form = await superValidate<RegisterFormSchema, FlashMessage>(request, zod(registerFormSchema));

    const { name, email, password, turnstileToken } = form.data;

    form.data.password = "";
    form.data.passwordConfirm = "";

    if (!form.valid) {
      flashMessage.text = m.core_form_shared_invalidForm();
      logger.debug(flashMessage.text);

      return message(form, flashMessage);
    }

    const ip = getClientAddress();
    const validatedTurnstileToken = await validateTurnstileToken(turnstileToken, ip);
    if (!validatedTurnstileToken.success) {
      flashMessage.text = m.core_form_shared_invalidTurnstile();
      logger.debug(validatedTurnstileToken.error, flashMessage.text);

      return message(form, flashMessage, { status: 400 });
    }

    const existingUser = await getUserByEmail(locals.db, email);
    if (existingUser && existingUser.authMethods.includes(AUTH_METHODS.EMAIL)) {
      flashMessage.text = m.auth_register_emailAlreadyUsed();
      logger.debug(flashMessage.text);

      return message(form, flashMessage, { status: 400 });
    }

    const userId = existingUser?.id ?? generateId(USER_ID_LEN);
    const hashedPassword = await hashPassword(password);

    if (!existingUser) {
      const newUser = await createUser(locals.db, {
        id: userId,
        name,
        email,
        username: email.split("@")[0] + generateId(5),
        password: hashedPassword,
        isVerified: false,
        isAdmin: false,
        authMethods: []
      });

      if (!newUser) {
        flashMessage.text = m.auth_register_failed();
        logger.debug(flashMessage.text);

        return message(form, flashMessage, { status: 400 });
      }
    } else {
      const updatedUser = await updateUserById(locals.db, existingUser.id, { password: hashedPassword, isVerified: false });

      if (!updatedUser) {
        flashMessage.text = m.auth_register_failed();
        logger.debug(flashMessage.text);

        return message(form, flashMessage, { status: 400 });
      }
    }

    const newToken = await generateToken(locals.db, userId, email, TOKEN_TYPE.EMAIL_VERIFICATION);
    if (!newToken) {
      flashMessage.text = m.core_form_shared_failedToGenerateToken();
      logger.error(flashMessage.text);

      return message(form, flashMessage, { status: 500 });
    }

    const res = await sendEmailVerificationEmail(email, name, newToken.token);
    if (!res) {
      flashMessage.text = m.core_form_shared_failedToSendEmail();
      logger.debug(flashMessage.text);

      return message(form, flashMessage, { status: 500 });
    }

    await createAndSetSession(locals.lucia, userId, cookies);

    flashMessage.status = FLASH_MESSAGE_STATUS.SUCCESS;
    flashMessage.text = m.auth_register_accountCreatedSuccessfully();

    redirect(route("/auth/verify-email"), flashMessage, cookies);
  }
};
