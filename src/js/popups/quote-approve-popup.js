import * as Misc from "./misc";
import * as Notifications from "./notifications";
import Config from "./config";
import * as ManualRestart from "./manual-restart-tracker";
import * as TestLogic from "./test-logic";
import axiosInstance from "./axios-instance";
import * as Loader from "./loader";

export async function show(noAnim = false) {
  if ($("#quoteApprovePopupWrapper").hasClass("hidden")) {
    getQuotes();
    $("#quoteApprovePopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, noAnim ? 0 : 100, (e) => {});
  }
}

export function hide() {
  if (!$("#quoteApprovePopupWrapper").hasClass("hidden")) {
    $("#quoteApprovePopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        (e) => {
          $("#quoteApprovePopupWrapper").addClass("hidden");
          $("#quoteApprovePopupWrapper .quotes").empty();
        }
      );
  }
}

async function getQuotes() {
  Loader.show();
  let response;
  try {
    response = await axiosInstance.get("/new-quotes/get");
  } catch (e) {
    Loader.hide();
    let msg = e?.response?.data?.message ?? e.message;
    Notifications.add("Failed to get new quotes: " + msg, -1);
    return;
  }
  Loader.hide();
  if (response.status !== 200) {
    Notifications.add(response.data.message);
  } else {
    console.log(response.data);
  }
}

$("#quoteApprovePopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "quoteApprovePopupWrapper") {
    hide();
  }
});
