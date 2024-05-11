import { route } from "$lib/ROUTES";
import type { PageServerLoad } from "./$types";
import { fail, type Actions } from "@sveltejs/kit";
import { changeEmailFormSchemaSecondStep, type ChangeEmailFormSchemaSecondStep } from "$validations/auth";
import { superValidate, message } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { logger } from "$lib/logger";
import { updateUserById } from "$server/db/users";
import { redirect, setFlash } from "sveltekit-flash-message/server";
import { generateToken, verifyToken } from "$server/auth/auth-utils";
import { TOKEN_TYPE, getTokenByUserId } from "$server/db/tokens";
import { isUserAuthenticated, validateTurnstileToken, verifyRateLimiter } from "$server/security";
import { changeEmailLimiter } from "$configs/rate-limiters/auth";
import { FLASH_MESSAGE_STATUS } from "$configs/general";
import { sendEmailChangeEmail } from "$server/email/send";
import { resendChangeEmailLimiter } from "$configs/rate-limiters/auth";
import * as m from "$paraglide/messages";

export const load = (async ({ locals, cookies, url }) => {
  isUserAuthenticated(locals, cookies, url);

  const form = await superValidate<ChangeEmailFormSchemaSecondStep, FlashMessage>(zod(changeEmailFormSchemaSecondStep));

  return { form };
}) satisfies PageServerLoad;

export const actions: Actions = {
  confirm: async (event) => {
    const { request, locals, url, cookies, getClientAddress } = event;
    const flashMessage = { status: FLASH_MESSAGE_STATUS.ERROR, text: "" };

    isUserAuthenticated(locals, cookies, url);

    const minutes = await verifyRateLimiter(event, changeEmailLimiter);
    if (minutes) {
      flashMessage.text = m.core_form_shared_tooManyRequest({ minutes });
      logger.error(flashMessage.text);

      setFlash(flashMessage, cookies);
      return fail(429);
    }

    const form = await superValidate<ChangeEmailFormSchemaSecondStep, FlashMessage>(request, zod(changeEmailFormSchemaSecondStep));
    if (!form.valid) {
      flashMessage.text = m.core_form_shared_invalidForm();
      logger.debug(flashMessage.text);

      return message(form, flashMessage);
    }

    const { token, turnstileToken } = form.data;
    const ip = getClientAddress();

    const validatedTurnstileToken = await validateTurnstileToken(turnstileToken, ip);
    if (!validatedTurnstileToken.success) {
      flashMessage.text = m.core_form_shared_invalidTurnstile();
      logger.debug(validatedTurnstileToken.error, flashMessage.text);

      return message(form, flashMessage, { status: 400 });
    }

    const { id: userId } = locals.user;

    const emailFromDatabase = await verifyToken(locals.db, userId, token, TOKEN_TYPE.EMAIL_CHANGE);
    if (!emailFromDatabase) {
      flashMessage.text = m.core_form_shared_invalidToken();
      logger.debug(flashMessage.text);

      return message(form, flashMessage, { status: 500 });
    }

    await locals.lucia.invalidateUserSessions(userId);

    const updatedUser = await updateUserById(locals.db, userId, { email: emailFromDatabase });
    if (!updatedUser) {
      flashMessage.text = m.core_form_shared_failedToUpdateUser();
      logger.debug(flashMessage.text);

      return message(form, flashMessage, { status: 404 });
    }

    flashMessage.status = FLASH_MESSAGE_STATUS.SUCCESS;
    flashMessage.text = m.auth_changeEmail_emailChangedSuccessfully();

    redirect(route("/auth/login"), flashMessage, cookies);
  },

  resendEmail: async (event) => {
    const { locals, url, cookies } = event;
    const flashMessage = { status: FLASH_MESSAGE_STATUS.ERROR, text: "" };

    isUserAuthenticated(locals, cookies, url);

    const minutes = await verifyRateLimiter(event, resendChangeEmailLimiter);
    if (minutes) {
      flashMessage.text = m.core_form_shared_tooManyRequest({ minutes });
      logger.debug(flashMessage.text);

      setFlash(flashMessage, cookies);
      return fail(429);
    }

    const { id: userId, name } = locals.user;

    const tokenFromDatabase = await getTokenByUserId(locals.db, userId, TOKEN_TYPE.EMAIL_CHANGE);
    if (!tokenFromDatabase) {
      flashMessage.text = m.core_form_shared_invalidToken();
      logger.debug(flashMessage.text);

      setFlash(flashMessage, cookies);
      return fail(500);
    }

    const newEmail = tokenFromDatabase.email;

    const newToken = await generateToken(locals.db, userId, newEmail, TOKEN_TYPE.EMAIL_CHANGE);
    if (!newToken) {
      flashMessage.text = m.core_form_shared_failedToGenerateToken();
      logger.error(flashMessage.text);

      setFlash(flashMessage, cookies);
      return fail(500);
    }

    const mailSent = await sendEmailChangeEmail(newEmail, name, newToken.token);
    if (!mailSent) {
      flashMessage.text = m.core_form_shared_failedToSendEmail();
      logger.debug(flashMessage.text);

      setFlash(flashMessage, cookies);
      return fail(500);
    }

    flashMessage.status = FLASH_MESSAGE_STATUS.SUCCESS;
    flashMessage.text = m.core_form_shared_emailSentSuccessfully();

    redirect(route("/auth/change-email/confirm"), flashMessage, cookies);
  }
};
