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
const stripeCreateCheckout = jest.spyOn(Stripe, "createCheckout");
const userGetUserMock = jest.spyOn(UserDal, "getUser");

const mockApp = request(app);
const configuration = Configuration.getCachedConfiguration();

describe("payments controller test", () => {
  describe("createCheckout", () => {
    beforeEach(async () => {
      await enablePremiumFeatures(true);
    });
    afterEach(async () => {
      [stripePriceMock, stripeCreateCheckout, userGetUserMock].forEach((it) =>
        it.mockReset()
      );
    });
    it("should create checkout for single subscription for first time user", async () => {
      //GIVEN
      stripePriceMock.mockResolvedValue([
        { id: "price_id", type: "recurring" },
      ]);
      stripeCreateCheckout.mockResolvedValue("http://example.com");
      userGetUserMock.mockResolvedValue(dummyUser);

      //WHEN
      const response = await mockApp
        .post("/payments/checkouts")
        .set("Authorization", "Bearer 123456789")
        .send({ items: [{ lookupKey: "prime_monthly" }] })
        .expect(200);

      //THEN
      const {
        body: { data: checkoutData },
      } = response;

      expect(checkoutData).toHaveProperty("redirectUrl", "http://example.com");

      expect(stripePriceMock).toHaveBeenCalledWith(["prime_monthly"]);
      expect(stripeCreateCheckout).toHaveBeenCalledWith({
        line_items: [{ price: "price_id", quantity: 1 }],
        billing_address_collection: "auto",
        success_url:
          "http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "http://localhost:3000/payment/cancel",
        client_reference_id: uid,
        mode: "subscription",
        customer_email: "test@example.com",
      });
    });
    it("should create checkout for single one_time_payment for first time user", async () => {
      //GIVEN
      stripePriceMock.mockResolvedValue([{ id: "price_id", type: "one_time" }]);
      stripeCreateCheckout.mockResolvedValue("http://example.com");
      userGetUserMock.mockResolvedValue(dummyUser);

      //WHEN
      const response = await mockApp
        .post("/payments/checkouts")
        .set("Authorization", "Bearer 123456789")
        .send({ items: [{ lookupKey: "prime_monthly" }] })
        .expect(200);

      //THEN
      const {
        body: { data: checkoutData },
      } = response;

      expect(checkoutData).toHaveProperty("redirectUrl", "http://example.com");

      expect(stripePriceMock).toHaveBeenCalledWith(["prime_monthly"]);
      expect(stripeCreateCheckout).toHaveBeenCalledWith({
        line_items: [{ price: "price_id", quantity: 1 }],
        billing_address_collection: "auto",
        success_url:
          "http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "http://localhost:3000/payment/cancel",
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
      stripeCreateCheckout.mockResolvedValue("http://example.com");
      const returningUser = _.merge(dummyUser, {
        payment: { stripe: { customerId: "cust_1234" } },
      });
      userGetUserMock.mockResolvedValue(returningUser);

      //WHEN
      const response = await mockApp
        .post("/payments/checkouts")
        .set("Authorization", "Bearer 123456789")
        .send({ items: [{ lookupKey: "prime_monthly" }] })
        .expect(200);

      //THEN
      const {
        body: { data: checkoutData },
      } = response;

      expect(checkoutData).toHaveProperty("redirectUrl", "http://example.com");

      expect(stripePriceMock).toHaveBeenCalledWith(["prime_monthly"]);
      expect(stripeCreateCheckout).toHaveBeenCalledWith({
        line_items: [{ price: "price_id", quantity: 1 }],
        billing_address_collection: "auto",
        success_url:
          "http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "http://localhost:3000/payment/cancel",
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
          .post("/payments/checkouts")
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
          .post("/payments/checkouts")
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
          .post("/payments/checkouts")
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
          .post("/payments/checkouts")
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
          .post("/payments/checkouts")
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
          .post("/payments/checkouts")
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
