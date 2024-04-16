import { logger } from "$lib/logger";
import { resetPasswordFormSchemaThirdStep, type ResetPasswordFormSchemaThirdStep } from "$validations/auth";
import { redirect, setFlash } from "sveltekit-flash-message/server";
import type { Actions, PageServerLoad } from "./$types";
import { superValidate, message } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { route } from "$lib/ROUTES";
import { updateUserById } from "$lib/server/db/users";
import { hashPassword } from "worker-password-auth";
import { isAnonymous, validateTurnstileToken, verifyRateLimiter } from "$lib/server/security";
import { resetPasswordLimiter } from "$configs/rate-limiters/auth";
import { FLASH_MESSAGE_STATUS } from "$configs/general";
import { fail } from "@sveltejs/kit";
import * as m from "$paraglide/messages";

export const load = (async ({ locals }) => {
  isAnonymous(locals);

  const form = await superValidate<ResetPasswordFormSchemaThirdStep, FlashMessage>(zod(resetPasswordFormSchemaThirdStep));

  return { form };
}) satisfies PageServerLoad;

export const actions: Actions = {
  default: async (event) => {
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

    const form = await superValidate<ResetPasswordFormSchemaThirdStep, FlashMessage>(request, zod(resetPasswordFormSchemaThirdStep));

    const { password, turnstileToken } = form.data;

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

    const { userId } = params;

    await locals.lucia.invalidateUserSessions(userId);

    const hashedPassword = await hashPassword(password);
    const updatedUser = await updateUserById(userId, { password: hashedPassword });
    if (!updatedUser) {
      flashMessage.text = m.core_form_shared_failedToUpdateUser();
      logger.debug(flashMessage.text);

      return message(form, flashMessage, { status: 500 });
    }

    flashMessage.status = FLASH_MESSAGE_STATUS.SUCCESS;
    flashMessage.text = m.auth_resetPassword_resetPasswordSuccessfully();

    redirect(route("/auth/login"), flashMessage, cookies);
  }
};
