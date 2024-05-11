import { resetPasswordFormSchemaSecondStep, type ResetPasswordFormSchemaSecondStep } from "$validations/auth";
import { superValidate, message } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { fail, type Actions } from "@sveltejs/kit";
import { logger } from "$lib/logger";
import { route } from "$lib/ROUTES";
import { redirect, setFlash } from "sveltekit-flash-message/server";
import type { PageServerLoad } from "./$types";
import { generateToken, verifyToken } from "$server/auth/auth-utils";
import { TOKEN_TYPE } from "$server/db/tokens";
import { isAnonymous, validateTurnstileToken, verifyRateLimiter } from "$server/security";
import { resetPasswordLimiter } from "$configs/rate-limiters/auth";
import { FLASH_MESSAGE_STATUS } from "$configs/general";
import { resendResetPasswordLimiter } from "$configs/rate-limiters/auth";
import { sendPasswordResetEmail } from "$server/email/send";
import { getUserById } from "$server/db/users";
import * as m from "$paraglide/messages";

export const load = (async ({ locals, params }) => {
  isAnonymous(locals);
  const { userId } = params;

  const form = await superValidate<ResetPasswordFormSchemaSecondStep, FlashMessage>(zod(resetPasswordFormSchemaSecondStep));

  return { form, userId };
}) satisfies PageServerLoad;

export const actions: Actions = {
  confirm: async (event) => {
    const { request, locals, cookies, params, getClientAddress } = event;
    const flashMessage = { status: FLASH_MESSAGE_STATUS.ERROR, text: "" };

    isAnonymous(locals);

    const minutes = await verifyRateLimiter(event, resetPasswordLimiter);
    if (minutes) {
      flashMessage.text = m.core_form_shared_tooManyRequest({ minutes });
      logger.debug(flashMessage.text);

      setFlash(flashMessage, cookies);
      return fail(429);
    }

    const form = await superValidate<ResetPasswordFormSchemaSecondStep, FlashMessage>(request, zod(resetPasswordFormSchemaSecondStep));
    if (!form.valid) {
      flashMessage.text = m.core_form_shared_invalidForm();
      logger.debug(flashMessage.text);

      return message(form, flashMessage);
    }

    const { token, turnstileToken } = form.data;
    const userId = params.userId as string;
    const user = await getUserById(locals.db, userId);
    if (!user) {
      flashMessage.text = m.core_form_shared_userNotFound();
      logger.debug(flashMessage.text);

      return message(form, flashMessage, { status: 404 });
    }

    const { email } = user;

    const ip = getClientAddress();
    const validatedTurnstileToken = await validateTurnstileToken(turnstileToken, ip);
    if (!validatedTurnstileToken.success) {
      flashMessage.text = m.core_form_shared_invalidTurnstile();
      logger.debug(validatedTurnstileToken.error, flashMessage.text);

      return message(form, flashMessage, { status: 400 });
    }

    const isValidToken = await verifyToken(locals.db, userId, token, TOKEN_TYPE.PASSWORD_RESET, email);
    if (!isValidToken) {
      flashMessage.text = m.core_form_shared_invalidToken();
      logger.debug(flashMessage.text);

      return message(form, flashMessage, { status: 500 });
    }

    flashMessage.status = FLASH_MESSAGE_STATUS.SUCCESS;
    flashMessage.text = m.core_form_shared_emailSentSuccessfully();

    redirect(route("/auth/reset-password/[userId=userId]/new-password", { userId }), flashMessage, cookies);
  },

  resendEmail: async (event) => {
    const { locals, cookies, params } = event;
    const flashMessage = { status: FLASH_MESSAGE_STATUS.ERROR, text: "" };

    isAnonymous(locals);

    const minutes = await verifyRateLimiter(event, resendResetPasswordLimiter);
    if (minutes) {
      flashMessage.text = m.core_form_shared_tooManyRequest({ minutes });
      logger.debug(flashMessage.text);

      setFlash(flashMessage, cookies);
      return fail(429);
    }

    const userId = params.userId as string;
    const user = await getUserById(locals.db, userId);
    if (!user) {
      flashMessage.text = m.core_form_shared_userNotFound();
      logger.debug(flashMessage.text);

      setFlash(flashMessage, cookies);
      return fail(500);
    }

    const { email } = user;

    const newToken = await generateToken(locals.db, userId, email, TOKEN_TYPE.PASSWORD_RESET);
    if (!newToken) {
      flashMessage.text = m.core_form_shared_failedToGenerateToken();
      logger.error(flashMessage.text);

      setFlash(flashMessage, cookies);
      return fail(500);
    }

    const mailSent = await sendPasswordResetEmail(email, newToken.token);
    if (!mailSent) {
      flashMessage.text = m.core_form_shared_failedToSendEmail();
      logger.debug(flashMessage.text);

      setFlash(flashMessage, cookies);
      return fail(500);
    }

    flashMessage.status = FLASH_MESSAGE_STATUS.SUCCESS;
    flashMessage.text = m.core_form_shared_emailSentSuccessfully();

    redirect(route("/auth/reset-password/[userId=userId]", { userId }), flashMessage, cookies);
  }
};
