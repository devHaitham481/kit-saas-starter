import { message, superValidate } from "sveltekit-superforms";
import type { PageServerLoad } from "./$types";
import { zod } from "sveltekit-superforms/adapters";
import { settingsProfileFormSchema, type SettingsProfileFormSchema } from "$validations/app/settings";
import { fail, type Actions } from "@sveltejs/kit";
import { FLASH_MESSAGE_STATUS } from "$configs/general";
import { isUserAuthenticated, verifyRateLimiter } from "$server/security";
import { profileSettingsLimiter } from "$configs/rate-limiters/app";
import { logger } from "$lib/logger";
import { redirect, setFlash } from "sveltekit-flash-message/server";
import { route } from "$lib/ROUTES";
import { getUserByUsername, updateUserById } from "$server/db/users";
import * as m from "$paraglide/messages";

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  isUserAuthenticated(locals, cookies, url);

  const { user } = locals;

  const form = await superValidate<SettingsProfileFormSchema, FlashMessage>({ username: user.username }, zod(settingsProfileFormSchema));

  return { form, user };
};

export const actions: Actions = {
  default: async (event) => {
    const { request, locals, url, cookies } = event;
    const flashMessage = { status: FLASH_MESSAGE_STATUS.ERROR, text: "" };

    isUserAuthenticated(locals, cookies, url);

    const minutes = await verifyRateLimiter(event, profileSettingsLimiter);
    if (minutes) {
      flashMessage.text = m.core_form_shared_tooManyRequest({ minutes });
      logger.debug(flashMessage.text);

      setFlash(flashMessage, cookies);
      return fail(429);
    }

    const form = await superValidate<SettingsProfileFormSchema, FlashMessage>(request, zod(settingsProfileFormSchema));
    if (!form.valid) {
      flashMessage.text = m.core_form_shared_invalidForm();
      logger.debug(flashMessage.text);

      return message(form, flashMessage);
    }

    const { username } = form.data;
    const { id: userId } = locals.user;

    const existingUser = await getUserByUsername(locals.db, username);
    if (existingUser && existingUser.id !== userId) {
      flashMessage.text = "Username already taken";
      logger.debug(flashMessage.text);

      return message(form, flashMessage, { status: 400 });
    }

    const updatedUser = await updateUserById(locals.db, userId, { username });
    if (!updatedUser) {
      flashMessage.text = m.core_form_shared_userNotFound();
      logger.debug(flashMessage.text);

      return message(form, flashMessage, { status: 400 });
    }

    flashMessage.status = FLASH_MESSAGE_STATUS.SUCCESS;
    flashMessage.text = "Profile updated successfully";

    redirect(route("/settings/profile"), flashMessage, cookies);
  }
};
