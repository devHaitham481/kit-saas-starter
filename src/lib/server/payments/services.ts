import { Stripe } from "stripe";
import { stripe } from ".";
import { logger } from "$lib/logger";
import { APP_URL } from "$configs/general";

/**
 * Update the current subscription to stop recurring payments at the end of the current pay period.
 *
 * @param subscriptionId - The ID of the subscription to be canceled.
 * @returns A Promise that resolves to the canceled subscription object, or undefined if an error occurs.
 */
const cancel = async (subscriptionId: string): Promise<Stripe.Subscription | undefined> => {
  try {
    return await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
  } catch (error) {
    logger.error(error);
  }
};

/**
 * Retrieves a Stripe Checkout session by session ID.
 *
 * @param sessionId - The ID of the session to retrieve.
 * @returns A Promise that resolves to the session object if found, or undefined if not found.
 */
const getSession = async (sessionId: string): Promise<Stripe.Checkout.Session | undefined> => {
  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error) {
    logger.error(error);
  }
};

/**
 * Retrieves a subscription from Stripe.
 *
 * @param subscriptionId - The ID of the subscription to retrieve.
 * @returns A Promise that resolves to the subscription object if found, or undefined if not found.
 */
const getSubscription = async (subscriptionId: string): Promise<Stripe.Subscription | undefined> => {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    logger.error(error);
  }
};

/**
 * Stripe embedded subscribe
 *
 * This is returns an embedded subscription mode for a item of *priceId*. This could,
 * alternatively redirect user's the Stripe site to pay or to a custom form.
 */
/**
 * Creates a new subscription session for the given price ID.
 *
 * @param priceId - The ID of the price for the subscription.
 * @returns A Promise that resolves to the session object representing the created subscription session, or undefined if an error occurred.
 */
const subscribe = async (priceId: string, email: string): Promise<Stripe.Checkout.Session | undefined> => {
  try {
    return await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: "subscription",
      customer_email: email,
      return_url: `${APP_URL}/order/success?sessionId={CHECKOUT_SESSION_ID}`
    });
  } catch (error) {
    logger.error(error);
  }
};

const getCustomerInfo = async (customerId: string): Promise<Stripe.Customer | Stripe.DeletedCustomer | undefined> => {
  try {
    return await stripe.customers.retrieve(customerId, {
      expand: ["subscriptions"]
    });
  } catch (error) {
    logger.error(error);
  }
};

export const StripeServices = {
  cancel,
  getSession,
  getSubscription,
  subscribe,
  getCustomerInfo
};
