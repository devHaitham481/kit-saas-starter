import { route } from "$lib/ROUTES";
import type { PageServerLoad } from "./$types";
import { fail, type Actions } from "@sveltejs/kit";
import { superValidate, message } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { logger } from "$lib/logger";
import { resetPasswordFormSchemaFirstStep, type ResetPasswordFormSchemaFirstStep } from "$validations/auth";
import { getUserByEmail } from "$lib/server/db/users";
import { sendPasswordResetEmail } from "$lib/server/email/send";
import { redirect, setFlash } from "sveltekit-flash-message/server";
import { generateToken } from "$lib/server/auth/auth-utils";
import { TOKEN_TYPE } from "$lib/server/db/tokens";
import { isAnonymous, validateTurnstileToken, verifyRateLimiter } from "$lib/server/security";
import { resetPasswordLimiter } from "$configs/rate-limiters/auth";
import { FLASH_MESSAGE_STATUS } from "$configs/general";
import * as m from "$paraglide/messages";

export const load = (async ({ locals }) => {
  isAnonymous(locals);

  const form = await superValidate<ResetPasswordFormSchemaFirstStep, FlashMessage>(zod(resetPasswordFormSchemaFirstStep));

  return { form };
}) satisfies PageServerLoad;

export const actions: Actions = {
  default: async (event) => {
    const { request, locals, cookies, getClientAddress } = event;
    const flashMessage = { status: FLASH_MESSAGE_STATUS.ERROR, text: "" };

    isAnonymous(locals);

    const minutes = await verifyRateLimiter(event, resetPasswordLimiter);
    if (minutes) {
      flashMessage.text = m.core_form_shared_tooManyRequest({ minutes });
      logger.debug(flashMessage.text);

      setFlash(flashMessage, cookies);
      return fail(429);
    }

    const form = await superValidate<ResetPasswordFormSchemaFirstStep, FlashMessage>(request, zod(resetPasswordFormSchemaFirstStep));
    if (!form.valid) {
      flashMessage.text = m.core_form_shared_invalidForm();
      logger.debug(flashMessage.text);

      return message(form, flashMessage);
    }

    const { email, turnstileToken } = form.data;
    const ip = getClientAddress();

    const validatedTurnstileToken = await validateTurnstileToken(turnstileToken, ip);
    if (!validatedTurnstileToken.success) {
      flashMessage.text = m.core_form_shared_invalidTurnstile();
      logger.debug(validatedTurnstileToken.error, flashMessage.text);

      return message(form, flashMessage, { status: 400 });
    }

    const userFromDb = await getUserByEmail(email);
    if (!userFromDb) {
      flashMessage.status = FLASH_MESSAGE_STATUS.SUCCESS;
      flashMessage.text = m.core_form_shared_emailSentSuccessfully();

      // we send a success message even if the user doesn't exist to prevent email enumeration
      redirect(route("/"), flashMessage, cookies);
    }

    const { id: userId } = userFromDb;

    const newToken = await generateToken(userId, email, TOKEN_TYPE.PASSWORD_RESET);
    if (!newToken) {
      flashMessage.text = m.core_form_shared_failedToGenerateToken();
      logger.error(flashMessage.text);

      return message(form, flashMessage, { status: 500 });
    }

    const mailSent = await sendPasswordResetEmail(email, newToken.token);
    if (!mailSent) {
      flashMessage.text = m.core_form_shared_failedToSendEmail();
      logger.debug(flashMessage.text);

      return message(form, flashMessage, { status: 500 });
    }

    flashMessage.status = FLASH_MESSAGE_STATUS.SUCCESS;
    flashMessage.text = m.core_form_shared_emailSentSuccessfully();

    redirect(route("/auth/reset-password/[userId=userId]", { userId }), flashMessage, cookies);
  }
};
