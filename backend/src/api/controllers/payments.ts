import { MonkeyResponse } from "../../utils/monkey-response";
import * as UserDal from "../../dal/user";

import * as Stripe from "../../services/stripe";
import MonkeyError from "../../utils/error";
import { getFrontendUrl } from "../../utils/misc";

const MY_DOMAIN = getFrontendUrl();

export async function createCheckout(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const user = await UserDal.getUser(uid, "createCheckout");
  const items = req.body.items.map((it) => it.lookupKey);

  const prices = await Stripe.getPrices(items);
  if (prices.length !== 1)
    throw new MonkeyError(500, `Price lookup failed for ${items}.`);
  const price = prices[0];

  const createSession: Stripe.SessionCreateParams = {
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    billing_address_collection: "auto",
    success_url: `${MY_DOMAIN}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${MY_DOMAIN}/payment/cancel`,
    client_reference_id: uid,
  };

  //reuse existing customer
  if (user.payment?.stripe?.customerId !== undefined) {
    createSession.customer = user.payment.stripe.customerId;
  } else {
    createSession.customer_email = user.email;
  }

  if (price.type === "one_time") {
    createSession.mode = "payment";
    createSession.customer_creation = "always";
  } else {
    createSession.mode = "subscription";
  }

  const redirectUrl = await Stripe.createCheckout(createSession);

  return new MonkeyResponse("Checkout created", { redirectUrl });
}
