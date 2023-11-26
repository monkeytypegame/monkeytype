import request from "supertest";
import app from "../../../src/app";
import _ from "lodash";
import * as Configuration from "../../../src/init/configuration";
import * as AuthUtils from "../../../src/utils/auth";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import * as Stripe from "../../../src/services/stripe";
import * as UserDal from "../../../src/dal/user";

const uid = "123456";

const mockDecodedToken: DecodedIdToken = {
  uid,
  email: "newuser@mail.com",
  iat: 0,
} as DecodedIdToken;

const dummyUser = {
  uid,
  addedAt: 0,
  email: "test@example.com",
  name: "Bob",
  personalBests: {
    time: {},
    words: {},
    quote: {},
    custom: {},
    zen: {},
  },
};

jest.spyOn(AuthUtils, "verifyIdToken").mockResolvedValue(mockDecodedToken);

const stripePriceMock = jest.spyOn(Stripe, "getPrices");
const stripeCreateCheckoutMock = jest.spyOn(Stripe, "createCheckout");
const stripeGetCheckoutMock = jest.spyOn(Stripe, "getCheckout");
const stripeGetSubscriptionMock = jest.spyOn(Stripe, "getSubscription");

const userGetUserMock = jest.spyOn(UserDal, "getUser");
const userLinkCustomerByUidMock = jest.spyOn(
  UserDal,
  "linkStripeCustomerIdByUid"
);
const userUpdatePremiumMock = jest.spyOn(
  UserDal,
  "updatePremiumByStripeCustomerId"
);

const mockApp = request(app);
const configuration = Configuration.getCachedConfiguration();

describe("store controller test", () => {
  describe("createCheckout", () => {
    beforeEach(async () => {
      await enablePremiumFeatures(true);
    });
    afterEach(async () => {
      [stripePriceMock, stripeCreateCheckoutMock, userGetUserMock].forEach(
        (it) => it.mockReset()
      );
    });
    it("should create checkout for single subscription for first time user", async () => {
      //GIVEN
      stripePriceMock.mockResolvedValue([
        { id: "price_id", type: "recurring" },
      ]);
      stripeCreateCheckoutMock.mockResolvedValue("http://example.com");
      userGetUserMock.mockResolvedValue(dummyUser);

      //WHEN
      const response = await mockApp
        .post("/store/checkouts")
        .set("Authorization", "Bearer 123456789")
        .send({ items: [{ lookupKey: "prime_monthly" }] })
        .expect(200);

      //THEN
      const {
        body: { data: checkoutData },
      } = response;

      expect(checkoutData).toHaveProperty("redirectUrl", "http://example.com");

      expect(stripePriceMock).toHaveBeenCalledWith(["prime_monthly"]);
      expect(stripeCreateCheckoutMock).toHaveBeenCalledWith({
        line_items: [{ price: "price_id", quantity: 1 }],
        billing_address_collection: "auto",
        success_url:
          "http://localhost:3000/store?action=success&session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "http://localhost:3000/store?action=cancel",
        client_reference_id: uid,
        mode: "subscription",
        customer_email: "test@example.com",
      });
    });
    it("should create checkout for single one_time_payment for first time user", async () => {
      //GIVEN
      stripePriceMock.mockResolvedValue([{ id: "price_id", type: "one_time" }]);
      stripeCreateCheckoutMock.mockResolvedValue("http://example.com");
      userGetUserMock.mockResolvedValue(dummyUser);

      //WHEN
      const response = await mockApp
        .post("/store/checkouts")
        .set("Authorization", "Bearer 123456789")
        .send({ items: [{ lookupKey: "prime_monthly" }] })
        .expect(200);

      //THEN
      const {
        body: { data: checkoutData },
      } = response;

      expect(checkoutData).toHaveProperty("redirectUrl", "http://example.com");

      expect(stripePriceMock).toHaveBeenCalledWith(["prime_monthly"]);
      expect(stripeCreateCheckoutMock).toHaveBeenCalledWith({
        line_items: [{ price: "price_id", quantity: 1 }],
        billing_address_collection: "auto",
        success_url:
          "http://localhost:3000/store?action=success&session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "http://localhost:3000/store?action=cancel",
        client_reference_id: uid,
        mode: "payment",
        customer_creation: "always",
        customer_email: "test@example.com",
      });
    });
    it("should create checkout for single subscription for returning user", async () => {
      //GIVEN
      stripePriceMock.mockResolvedValue([
        { id: "price_id", type: "recurring" },
      ]);
      stripeCreateCheckoutMock.mockResolvedValue("http://example.com");
      const returningUser = _.merge(dummyUser, {
        stripeData: { customerId: "cust_1234" },
      });
      userGetUserMock.mockResolvedValue(returningUser);

      //WHEN
      const response = await mockApp
        .post("/store/checkouts")
        .set("Authorization", "Bearer 123456789")
        .send({ items: [{ lookupKey: "prime_monthly" }] })
        .expect(200);

      //THEN
      const {
        body: { data: checkoutData },
      } = response;

      expect(checkoutData).toHaveProperty("redirectUrl", "http://example.com");

      expect(stripePriceMock).toHaveBeenCalledWith(["prime_monthly"]);
      expect(stripeCreateCheckoutMock).toHaveBeenCalledWith({
        line_items: [{ price: "price_id", quantity: 1 }],
        billing_address_collection: "auto",
        success_url:
          "http://localhost:3000/store?action=success&session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "http://localhost:3000/store?action=cancel",
        client_reference_id: uid,
        mode: "subscription",
        customer: "cust_1234",
      });
    });

    describe("validations", () => {
      it("should fail without items", async () => {
        //GIVEN

        //WHEN
        await mockApp
          .post("/store/checkouts")
          .set("Authorization", "Bearer 123456789")
          .send()
          .expect(422)
          .expect(expectErrorMessage('"items" is required (undefined)'));

        //THEN
      });

      it("should fail with empty items", async () => {
        //GIVEN

        //WHEN
        await mockApp
          .post("/store/checkouts")
          .set("Authorization", "Bearer 123456789")
          .send({ items: [] })
          .expect(422)
          .expect(
            expectErrorMessage('"items" must contain at least 1 items ()')
          );

        //THEN
      });

      it("should fail with empty item", async () => {
        //GIVEN

        //WHEN
        await mockApp
          .post("/store/checkouts")
          .set("Authorization", "Bearer 123456789")
          .send({ items: [{}] })
          .expect(422)
          .expect(
            expectErrorMessage('"items[0].lookupKey" is required (undefined)')
          );

        //THEN
      });

      it("should fail with item with empty lookupKey", async () => {
        //GIVEN

        //WHEN
        await mockApp
          .post("/store/checkouts")
          .set("Authorization", "Bearer 123456789")
          .send({ items: [{ lookupKey: "" }] })
          .expect(422)
          .expect(
            expectErrorMessage(
              '"items[0].lookupKey" is not allowed to be empty ()'
            )
          );

        //THEN
      });

      it("should fail with multiple items", async () => {
        //GIVEN

        //WHEN
        await mockApp
          .post("/store/checkouts")
          .set("Authorization", "Bearer 123456789")
          .send({ items: [{ lookupKey: "first" }, { lookupKey: "second" }] })
          .expect(422)
          .expect(
            expectErrorMessage(
              '"items" must contain less than or equal to 1 items ([object Object],[object Object])'
            )
          );

        //THEN
      });

      it("should fail if premium feature is disabled", async () => {
        //GIVEN
        await enablePremiumFeatures(false);

        //WHEN
        await mockApp
          .post("/store/checkouts")
          .set("Authorization", "Bearer 123456789")
          .send()
          .expect(503)
          .expect(expectErrorMessage("Premium is temporarily disabled."));
      });
    });
  });
  describe("finalizeCheckout", () => {
    beforeEach(async () => {
      await enablePremiumFeatures(true);
      userLinkCustomerByUidMock.mockResolvedValue();
      userUpdatePremiumMock.mockResolvedValue();
    });
    afterEach(async () => {
      [
        userLinkCustomerByUidMock,
        userUpdatePremiumMock,
        stripeGetCheckoutMock,
        stripeGetSubscriptionMock,
      ].forEach((it) => it.mockReset());
    });

    it("should update premium for subscriptions", async () => {
      //GIVEN
      stripeGetCheckoutMock.mockResolvedValue({
        client_reference_id: uid,
        customer: "customerId",
        payment_status: "paid",
        mode: "subscription",
        subscription: "subscriptionId",
      } as Stripe.Session);
      stripeGetSubscriptionMock.mockResolvedValue({
        status: "active",
        customer: "customerId",
        start_date: 10,
        current_period_end: 20,
      } as Stripe.Subscription);

      //WHEN
      await mockApp
        .post("/store/checkouts/sessionId")
        .set("Authorization", "Bearer 123456789")
        .send()
        .expect(200);

      //THEN
      expect(stripeGetCheckoutMock).toHaveBeenCalledWith("sessionId");
      expect(userLinkCustomerByUidMock).toHaveBeenCalledWith(uid, "customerId");
      expect(stripeGetSubscriptionMock).toHaveBeenCalledWith("subscriptionId");
      expect(userUpdatePremiumMock).toHaveBeenCalledWith(
        "customerId",
        10000,
        20000
      );
    });

    it("should fail for mismatch user", async () => {
      //the MT user in the stripe session is not the same as in the request
      //GIVEN
      stripeGetCheckoutMock.mockResolvedValue({
        client_reference_id: "anotherUser",
      } as Stripe.Session);

      //WHEN /THEN
      await mockApp
        .post("/store/checkouts/theSessionId")
        .set("Authorization", "Bearer 123456789")
        .send()
        .expect(400)
        .expect(expectErrorMessage("Invalid checkout for the current user."));
    });
    it("should fail for unpaid subscriptions", async () => {
      //GIVEN
      stripeGetCheckoutMock.mockResolvedValue({
        client_reference_id: uid,
        customer: "customerId",
        payment_status: "unpaid",
      } as Stripe.Session);

      //WHEN
      await mockApp
        .post("/store/checkouts/sessionId")
        .set("Authorization", "Bearer 123456789")
        .send()
        .expect(500)
        .expect(expectErrorMessage("Session is not paid."));
    });
    it("should fail for non subscriptions", async () => {
      //GIVEN
      stripeGetCheckoutMock.mockResolvedValue({
        client_reference_id: uid,
        customer: "customerId",
        payment_status: "paid",
        mode: "payment",
      } as Stripe.Session);

      //WHEN
      await mockApp
        .post("/store/checkouts/sessionId")
        .set("Authorization", "Bearer 123456789")
        .send()
        .expect(500)
        .expect(
          expectErrorMessage("Session mode payment is not supported yet.")
        );
    });

    describe("validations", () => {
      it("should fail if premium feature is disabled", async () => {
        //GIVEN
        await enablePremiumFeatures(false);

        //WHEN
        await mockApp
          .post("/store/checkouts/theSessionId")
          .set("Authorization", "Bearer 123456789")
          .send()
          .expect(503)
          .expect(expectErrorMessage("Premium is temporarily disabled."));
      });
    });
  });
});

async function enablePremiumFeatures(premium: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    users: { premium: { enabled: premium } },
  });

  jest
    .spyOn(Configuration, "getCachedConfiguration")
    .mockResolvedValue(mockConfig);
}

function expectErrorMessage(message: string): (res: request.Response) => void {
  return (res) => expect(res.body).toHaveProperty("message", message);
}
