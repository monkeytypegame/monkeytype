import * as config from "../credentials/stripeConfig.json";
import Stripe from "stripe";
import MonkeyError from "../utils/error";
const stripe = new Stripe(config.apiKey);

export type Price = {
  id: string;
  type: Stripe.Price.Type;
};
export type SessionCreateParams = Stripe.Checkout.SessionCreateParams;

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
