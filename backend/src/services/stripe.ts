import Stripe from "stripe";
import MonkeyError from "../utils/error";
const { STRIPE_API_KEY } = process.env;
const stripe =
  STRIPE_API_KEY !== undefined ? new Stripe(STRIPE_API_KEY) : undefined;

export type Price = {
  id: string;
  type: Stripe.Price.Type;
};
export type SessionCreateParams = Stripe.Checkout.SessionCreateParams;
export type Session = Stripe.Checkout.Session;
export type Subscription = Stripe.Subscription;

export async function getPrices(
  lookupKeys: Array<string>
): Promise<Array<Price>> {
  const result = await getService().prices.list({
    lookup_keys: lookupKeys,
  });
  //TODO error handling
  return result.data;
}

export async function createCheckout(
  params: SessionCreateParams
): Promise<string> {
  const result = await getService().checkout.sessions.create(params);
  if (result.url === null) {
    throw new MonkeyError(500, "Cannot create checkout session"); //TODO error handling
  }
  return result.url;
}

export async function getCheckout(sessionId: string): Promise<Session> {
  const session = await getService().checkout.sessions.retrieve(sessionId);

  return session;
}
export async function getSubscription(
  subscriptionId: string
): Promise<Subscription> {
  const subscription = await getService().subscriptions.retrieve(
    subscriptionId
  );
  return subscription;
}

function getService(): Stripe {
  if (stripe === undefined)
    throw new Error("Stripe config missing from environment 'STRIPE_API_KEY'.");
  return stripe;
}
