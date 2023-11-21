import { describeIntegration } from "../setup-tests";
import * as Stripe from "../../src/services/stripe";

describeIntegration("stripe", () => {
  it("should list prices", async () => {
    const prices = await Stripe.getPrices(["prime_monthly", "prime_yearly"]);
    expect(prices).toHaveLength(2);
  });
});
