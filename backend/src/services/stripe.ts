import * as config from "../credentials/stripeConfig.json";
import Stripe from "stripe";
import MonkeyError from "../utils/error";
const stripe = new Stripe(config.apiKey);

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
  const result = await stripe.prices.list({
    lookup_keys: lookupKeys,
  });
  //TODO error handling
  return result.data;
}

export async function createCheckout(
  params: SessionCreateParams
): Promise<string> {
  const result = await stripe.checkout.sessions.create(params);
  if (result.url === null) {
    throw new MonkeyError(500, "Cannot create checkout session"); //TODO error handling
  }
  return result.url;
}

export async function getCheckout(sessionId: string): Promise<Session> {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  return session;
}
export async function getSubscription(
  subscriptionId: string
): Promise<Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
}
