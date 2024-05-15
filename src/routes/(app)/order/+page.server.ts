import type { PageServerLoad, Actions } from "./$types";
import { message, superValidate } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { redirect } from "sveltekit-flash-message/server";
import { route } from "$lib/ROUTES";
import { logger } from "$lib/logger";
import { isUserAuthenticated } from "$server/security";
import { FLASH_MESSAGE_STATUS } from "$configs/general";
import * as m from "$paraglide/messages";
import { subscribeFormSchema, type SubscribeFormSchema } from "$validations/app";
import { StripeServices } from "$server/payments";
import { STRIPE_CLIENT_SECRET } from "$configs/cookies-names";

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  isUserAuthenticated(locals, cookies, url);

  const form = await superValidate<SubscribeFormSchema, FlashMessage>(zod(subscribeFormSchema));

  return { form };
};

export const actions: Actions = {
  default: async (event) => {
    const { request, locals, url, cookies } = event;
    const flashMessage = { status: FLASH_MESSAGE_STATUS.ERROR, text: "" };

    isUserAuthenticated(locals, cookies, url);

    const form = await superValidate<SubscribeFormSchema, FlashMessage>(request, zod(subscribeFormSchema));
    if (!form.valid) {
      flashMessage.text = m.core_form_shared_invalidForm();
      logger.debug(form.errors);

      return message(form, flashMessage);
    }

    const session = await StripeServices.subscribe(form.data.priceId);
    if (!session?.client_secret) {
      redirect(302, route("/order/cancel"));
    }

    cookies.set(STRIPE_CLIENT_SECRET, session.client_secret, {
      path: "/",
      httpOnly: true,
      secure: true
    });

    redirect(302, route("/order/checkout"));
  }
};
