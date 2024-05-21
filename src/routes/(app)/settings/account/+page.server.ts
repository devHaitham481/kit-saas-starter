import { message, superValidate } from "sveltekit-superforms";
import type { PageServerLoad } from "./$types";
import { zod } from "sveltekit-superforms/adapters";
import { settingsAccountFormSchema, type SettingsAccountFormSchema } from "$validations/app/settings";
import { fail, type Actions } from "@sveltejs/kit";
import { FLASH_MESSAGE_STATUS } from "$configs/general";
import { isUserAuthenticated, verifyRateLimiter } from "$server/security";
import { accountSettingsLimiter } from "$configs/rate-limiters/app";
import { logger } from "$lib/logger";
import { redirect, setFlash } from "sveltekit-flash-message/server";
import { updateUserById } from "$server/db/users";
import { route } from "$lib/ROUTES";
import * as m from "$paraglide/messages";

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  isUserAuthenticated(locals, cookies, url);

  const { user } = locals;

  const form = await superValidate<SettingsAccountFormSchema, FlashMessage>({ name: user.name }, zod(settingsAccountFormSchema));

  return { form, user };
};

export const actions: Actions = {
  default: async (event) => {
    const { request, locals, url, cookies } = event;
    const flashMessage = { status: FLASH_MESSAGE_STATUS.ERROR, text: "" };

    isUserAuthenticated(locals, cookies, url);

    const minutes = await verifyRateLimiter(event, accountSettingsLimiter);
    if (minutes) {
      flashMessage.text = m.core_form_shared_tooManyRequest({ minutes });
      logger.debug(flashMessage.text);

      setFlash(flashMessage, cookies);
      return fail(429);
    }

    const form = await superValidate<SettingsAccountFormSchema, FlashMessage>(request, zod(settingsAccountFormSchema));
    if (!form.valid) {
      flashMessage.text = m.core_form_shared_invalidForm();
      logger.debug(flashMessage.text);

      return message(form, flashMessage);
    }

    const { name } = form.data;
    const { id: userId } = locals.user;

    const updatedUser = await updateUserById(locals.db, userId, { name });
    if (!updatedUser) {
      flashMessage.text = m.core_form_shared_userNotFound();
      logger.debug(flashMessage.text);

      return message(form, flashMessage, { status: 400 });
    }

    flashMessage.status = FLASH_MESSAGE_STATUS.SUCCESS;
    flashMessage.text = "Account updated successfully";

    redirect(route("/settings/account"), flashMessage, cookies);
  }
};
