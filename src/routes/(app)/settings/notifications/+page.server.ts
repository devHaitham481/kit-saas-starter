import { message, superValidate } from "sveltekit-superforms";
import type { PageServerLoad } from "./$types";
import { zod } from "sveltekit-superforms/adapters";
import { fail, type Actions } from "@sveltejs/kit";
import { FLASH_MESSAGE_STATUS } from "$configs/general";
import { isUserAuthenticated, verifyRateLimiter } from "$server/security";
import { logger } from "$lib/logger";
import { redirect, setFlash } from "sveltekit-flash-message/server";
import { route } from "$lib/ROUTES";
import { updateUserById } from "$server/db/users";
import { settingsNotificationsFormSchema, type SettingsNotificationsFormSchema } from "$validations/app/settings";
import { notificationsSettingsLimiter } from "$configs/rate-limiters/app";
import * as m from "$paraglide/messages";

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  isUserAuthenticated(locals, cookies, url);

  const { user } = locals;

  const form = await superValidate<SettingsNotificationsFormSchema, FlashMessage>({ name: user.name }, zod(settingsNotificationsFormSchema));

  return { form, user };
};

export const actions: Actions = {
  default: async (event) => {
    const { request, locals, url, cookies } = event;
    const flashMessage = { status: FLASH_MESSAGE_STATUS.ERROR, text: "" };

    isUserAuthenticated(locals, cookies, url);

    const minutes = await verifyRateLimiter(event, notificationsSettingsLimiter);
    if (minutes) {
      flashMessage.text = m.core_form_shared_tooManyRequest({ minutes });
      logger.debug(flashMessage.text);

      setFlash(flashMessage, cookies);
      return fail(429);
    }

    const form = await superValidate<SettingsNotificationsFormSchema, FlashMessage>(request, zod(settingsNotificationsFormSchema));
    if (!form.valid) {
      flashMessage.text = m.core_form_shared_invalidForm();
      logger.debug(flashMessage.text);

      return message(form, flashMessage);
    }

    // TODO implements notifications
    const { name } = form.data;
    const { id: userId } = locals.user;

    const updatedUser = await updateUserById(locals.db, userId, { name });
    if (!updatedUser) {
      flashMessage.text = m.core_form_shared_userNotFound();
      logger.debug(flashMessage.text);

      return message(form, flashMessage, { status: 400 });
    }

    flashMessage.status = FLASH_MESSAGE_STATUS.SUCCESS;
    flashMessage.text = "Profile updated successfully";

    redirect(route("/settings/notifications"), flashMessage, cookies);
  }
};
