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
    success_url: `${MY_DOMAIN}/store?action=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${MY_DOMAIN}/store?action=cancel`,
    client_reference_id: uid,
  };

  //reuse existing customer
  if (user.stripeData?.customerId !== undefined) {
    createSession.customer = user.stripeData.customerId;
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

export async function finalizeCheckout(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const stripeSessionId = req.params.stripeSessionId;
  const session = await Stripe.getCheckout(stripeSessionId);

  //check the checkout was for the current user
  if (session.client_reference_id !== uid) {
    throw new MonkeyError(400, "Invalid checkout for the current user.");
  }

  //session must be linked to a stripe customer
  await UserDal.linkStripeCustomerIdByUid(uid, session.customer as string);

  //check session payment is not pending
  if (
    session.payment_status !== "paid" &&
    session.payment_status !== "no_payment_required"
  ) {
    throw new MonkeyError(500, "Session is not paid.");
  }

  switch (session.mode) {
    case "subscription":
      await processSubscription(session.subscription as string);
      break;
    default:
      throw new MonkeyError(
        500,
        `Session mode ${session.mode} is not supported yet.`
      );
  }

  return new MonkeyResponse("Checkout finalized", {});
}

async function processSubscription(subscriptionId: string): Promise<void> {
  const subscription = await Stripe.getSubscription(subscriptionId);

  if (subscription.status === "active") {
    //
    const startDate = subscription.start_date * 1000;
    const endDate = subscription.current_period_end * 1000;

    await UserDal.updatePremiumByStripeCustomerId(
      subscription.customer as string,
      startDate,
      endDate
    );
  } else {
    //we don't need to handle other states as premium validity is calculated based on the expirationTimestamp.
  }
}

export async function handleWebhook(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const event = await Stripe.validateAndGetEvent(
    req.body,
    req.headers["stripe-signature"] as string
  );

  switch (event.type) {
    case "customer.created":
      await processCustomerCreated(event.data.object);
      break;
    case "invoice.paid":
      await processInvoicePaid(event.data.object);
      break;
    case "customer.subscription.deleted":
      //TODO implement
      break;
  }

  return new MonkeyResponse("webhook", {});
}

async function processCustomerCreated(
  customer: Stripe.Customer
): Promise<void> {
  if (customer.email === null) {
    //Should not happen as we defined createCheckout to always create the user with email
    throw new MonkeyError(422, "Customer is missing the email.");
  }
  await UserDal.linkStripeCustomerIdByEmail(customer.email, customer.id);
}

async function processInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = invoice.subscription as string;
  await processSubscription(subscriptionId);
}
