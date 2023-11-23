import Page from "./page";
import * as Skeleton from "../popups/skeleton";
import { Auth } from "../firebase";
import * as DB from "../db";
import Ape from "../ape";

function reset(): void {
  $(".premiumDisabled").removeClass("hidden");
  $(".premiumActive").addClass("hidden");
  $(".premiumAvailable").addClass("hidden");
}

async function fill(): Promise<void> {
  const user = Auth?.currentUser;
  if (!user) return;

  const data = DB.getSnapshot();

  console.log("++++ fill", { user, data });

  if (!data) return;

  //TODO check backend config for user.premium.enabled
  $(".premiumDisabled").addClass("hidden");

  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get("action");

  if (action === "success") {
    const sessionId = urlParams.get("session_id");
    alert("complete purchase for sessionId " + sessionId);
    //TODO: call backend POST /store/checkouts/${sessionId}
    //TODO: on success reload user info
    //simulate
    data.isPremium = true;
    data.premium = {
      startTimestamp: 1701471599,
      expirationTimestamp: 1704149999,
    };
  } else if (action === "cancel") {
    alert("purchase cancelled.");
  }

  if (data.isPremium === true) {
    let premiumEndDate = "";
    if (data.premium?.expirationTimestamp) {
      if (data.premium?.expirationTimestamp === -1) {
        premiumEndDate = "the end of the universe";
        $("#premium_sub_cancel").attr("disabled", "disabled");
      } else {
        premiumEndDate = new Date(
          data.premium?.expirationTimestamp * 1000
        ).toDateString();
      }
      $("#premium_until").html(premiumEndDate);
    }

    $(".premiumActive").removeClass("hidden");
  } else {
    $(".premiumActive").addClass("hidden");
    $(".premiumAvailable").removeClass("hidden");
  }
}

$(".premium_sub").on("click", async (e) => {
  const item = e.currentTarget.getAttribute("data-item") || "";
  const response = await Ape.store.createCheckout(item);
  if (response.status >= 300) {
    alert("request failed: " + response.status + " " + response.message);
    return;
  }
  const redirectUrl = response.data.redirectUrl;
  window.location.href = redirectUrl;
});

export const page = new Page(
  "store",
  $(".page.pageStore"),
  "/store",
  async () => {
    //
  },
  async () => {
    reset();
    Skeleton.remove("pageStore");
  },
  async () => {
    Skeleton.append("pageStore", "main");
    fill();
  },
  async () => {
    //
  }
);

Skeleton.save("pageStore");
