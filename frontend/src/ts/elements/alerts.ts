import formatDistanceToNowStrict from "date-fns/formatDistanceToNowStrict";
import Ape from "../ape";
import { Auth } from "../firebase";
import * as AccountButton from "../elements/account-button";
import * as DB from "../db";
import * as NotificationEvent from "../observables/notification-event";
import * as BadgeController from "../controllers/badge-controller";
import * as Notifications from "../elements/notifications";

let accountAlerts: MonkeyTypes.MonkeyMail[] = [];
let maxMail = 0;
let mailToMarkRead: string[] = [];
let mailToDelete: string[] = [];

export function hide(): void {
  if (!$("#alertsPopupWrapper").hasClass("hidden")) {
    setBellButtonColored(false);

    let mailUpdatedPromiseResolve: (value?: unknown) => void;
    const mailUpdatedPromise = new Promise((resolve) => {
      mailUpdatedPromiseResolve = resolve;
    });

    const badgesClaimed: string[] = [];
    let totalXpClaimed = 0;
    if (mailToMarkRead.length > 0 || mailToDelete.length > 0) {
      Ape.users
        .updateInbox({
          mailIdsToMarkRead:
            mailToMarkRead.length > 0 ? mailToMarkRead : undefined,
          mailIdsToDelete: mailToDelete.length > 0 ? mailToDelete : undefined,
        })
        .then(async (updateResponse) => {
          const status = (await updateResponse).status;
          const message = (await updateResponse).message;
          if (status !== 200) {
            Notifications.add(`Failed to update inbox: ${message}`, -1);
            return;
          } else {
            const rewardsClaimed = accountAlerts
              .filter((ie) => {
                return ie.rewards.length > 0 && mailToMarkRead.includes(ie.id);
              })
              .map((ie) => ie.rewards)
              .reduce(function (a, b) {
                return a.concat(b);
              }, []);

            for (const r of rewardsClaimed) {
              if (r.type === "xp") {
                totalXpClaimed += r.item as number;
              } else if (r.type === "badge") {
                const badge = BadgeController.getById(r.item.id);
                badgesClaimed.push(badge.name);
                DB.addBadge(r.item);
              }
            }
          }
          mailUpdatedPromiseResolve();
        });
    }

    $("#alertsPopup").animate(
      {
        marginRight: "-10rem",
      },
      100,
      "easeInCubic"
    );
    $("#alertsPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          mailUpdatedPromise.then(() => {
            if (badgesClaimed.length > 0) {
              Notifications.add(
                `New badge${
                  badgesClaimed.length > 1 ? "s" : ""
                } unlocked: ${badgesClaimed.join(", ")}`,
                1,
                5,
                "Reward",
                "gift"
              );
            }
            if (totalXpClaimed > 0) {
              const snapxp = DB.getSnapshot().xp;
              AccountButton.updateXpBar(snapxp, totalXpClaimed);
              DB.addXp(totalXpClaimed);
            }
          });
          $("#alertsPopupWrapper").addClass("hidden");
        }
      );
  }
}

export async function show(): Promise<void> {
  if ($("#alertsPopupWrapper").hasClass("hidden")) {
    $("#alertsPopup").css("marginRight", "-10rem").animate(
      {
        marginRight: 0,
      },
      100,
      "easeOutCubic"
    );

    if (Auth.currentUser) {
      $("#alertsPopup .accountAlerts").removeClass("hidden");
      $("#alertsPopup .separator.accountSeparator").removeClass("hidden");
      $("#alertsPopup .accountAlerts .list").html(`
        <div class="preloader"><i class="fas fa-fw fa-spin fa-circle-notch"></i></div>`);
    } else {
      $("#alertsPopup .accountAlerts").addClass("hidden");
      $("#alertsPopup .separator.accountSeparator").addClass("hidden");
    }

    accountAlerts = [];
    mailToDelete = [];
    mailToMarkRead = [];

    $("#alertsPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate(
        {
          opacity: 1,
        },
        100,
        () => {
          if (Auth.currentUser) {
            getAccountAlerts();
          }
        }
      );
  }
}

async function getAccountAlerts(): Promise<void> {
  const inboxResponse = await Ape.users.getInbox();

  $("#alertsPopup .accountAlerts .list").empty();

  if (inboxResponse.status === 503) {
    $("#alertsPopup .accountAlerts .list").html(`
    <div class="nothing">
    Account inboxes are temporarily unavailable.
    </div>
    `);
    return;
  } else if (inboxResponse.status !== 200) {
    $("#alertsPopup .accountAlerts .list").html(`
    <div class="nothing">
    Error getting inbox: ${inboxResponse.message} Please try again later.
    </div>
    `);
    return;
  }
  const inboxData = inboxResponse.data as {
    inbox: MonkeyTypes.MonkeyMail[];
    maxMail: number;
  };

  accountAlerts = inboxData.inbox;

  if (accountAlerts.length === 0) {
    $("#alertsPopup .accountAlerts .list").html(`
    <div class="nothing">
    Nothing to show
    </div>
    `);
    return;
  }

  maxMail = inboxData.maxMail;

  updateInboxSize();

  for (const ie of accountAlerts) {
    if (!ie.read && ie.rewards.length == 0) {
      mailToMarkRead.push(ie.id);
    }

    let rewardsString = "";

    if (ie.rewards.length > 0 && ie.read === false) {
      rewardsString = `<div class="rewards">
        <i class="fas fa-fw fa-gift"></i>
        <span>${ie.rewards.length}</span>
      </div>`;
    }

    $("#alertsPopup .accountAlerts .list").append(`
    
      <div class="item" data-id="${ie.id}">
        <div class="indicator ${ie.read ? "" : "main"}"></div>
        <div class="timestamp">${formatDistanceToNowStrict(
          new Date(ie.timestamp)
        )} ago</div>
        <div class="title">${ie.subject}</div>
        <div class="body">
          ${ie.body}\n\n${rewardsString}
        </div>
        <div class="buttons">
          ${
            ie.rewards.length > 0 && ie.read === false
              ? `<div class="markReadAlert textButton" aria-label="Claim" data-balloon-pos="left"><i class="fas fa-gift"></i></div>`
              : ``
          }
          ${
            (ie.rewards.length > 0 && ie.read === true) ||
            ie.rewards.length == 0
              ? `<div class="deleteAlert textButton" aria-label="Delete" data-balloon-pos="left"><i class="fas fa-trash"></i></div>`
              : ``
          }
        </div>
      </div>
    
    `);
  }
}

export function addPSA(message: string, level: number): void {
  if ($("#alertsPopup .psas .list .nothing").length > 0) {
    $("#alertsPopup .psas .list").empty();
  }

  let levelClass = "";
  if (level === -1) {
    levelClass = "error";
  } else if (level === 1) {
    levelClass = "main";
  } else if (level === 0) {
    levelClass = "sub";
  }
  $("#alertsPopup .psas .list").prepend(`
    <div class="item">
    <div class="indicator ${levelClass}"></div>
    <div class="body">
      ${message}
    </div>
  </div>
  `);
}

function addNotification(
  message: string,
  level: number,
  customTitle?: string
): void {
  if ($("#alertsPopup .notificationHistory .list .nothing").length > 0) {
    $("#alertsPopup .notificationHistory .list").empty();
  }

  let title = "Notice";
  let levelClass = "sub";
  if (level === -1) {
    levelClass = "error";
    title = "Error";
  } else if (level === 1) {
    levelClass = "main";
    title = "Success";
  }

  if (customTitle) {
    title = customTitle;
  }

  $("#alertsPopup .notificationHistory .list").prepend(`
    <div class="item">
    <div class="indicator ${levelClass}"></div>
    <div class="title">${title}</div>
    <div class="body">
      ${message}
    </div>
  </div>
  `);

  if ($("#alertsPopup .notificationHistory .list").length > 25) {
    $("#alertsPopup .notificationHistory .list .item:last").remove();
  }
}

export function setBellButtonColored(tf: boolean): void {
  if (tf) {
    $("#top #menu .showAlerts").addClass("active");
  } else {
    $("#top #menu .showAlerts").removeClass("active");
  }
}

function updateInboxSize(): void {
  $("#alertsPopup .accountAlerts .title .right").text(
    `${accountAlerts.length}/${maxMail}`
  );
}

$("#top #menu .showAlerts").on("click", () => {
  show();
});

$("#alertsPopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "alertsPopupWrapper") {
    hide();
  }
});

$("#alertsPopup .mobileClose").on("click", () => {
  hide();
});

$("#alertsPopup .accountAlerts .list").on(
  "click",
  ".item .buttons .deleteAlert",
  (e) => {
    const id = $(e.currentTarget).closest(".item").attr("data-id") as string;
    mailToDelete.push(id);
    $(e.currentTarget).closest(".item").remove();
    accountAlerts = accountAlerts.filter((ie) => ie.id !== id);
    if (accountAlerts.length === 0) {
      $("#alertsPopup .accountAlerts .list").html(`
      <div class="nothing">
      Nothing to show
      </div>
      `);
    }
    updateInboxSize();
  }
);

$("#alertsPopup .accountAlerts .list").on(
  "click",
  ".item .buttons .markReadAlert",
  (e) => {
    const id = $(e.currentTarget).closest(".item").attr("data-id") as string;
    mailToMarkRead.push(id);
    const item = $(e.currentTarget).closest(".item");

    item.find(".indicator").removeClass("main");
    item.find(".buttons").empty();
    item
      .find(".buttons")
      .append(
        `<div class="deleteAlert textButton" aria-label="Delete" data-balloon-pos="left"><i class="fas fa-trash"></i></div>`
      );
    item.find(".rewards").animate(
      {
        opacity: 0,
        height: 0,
        marginTop: 0,
      },
      250,
      "easeOutCubic",
      () => {
        item.find(".rewards").remove();
      }
    );
  }
);

$(document).on("keydown", (e) => {
  if (e.key === "Escape" && !$("#alertsPopupWrapper").hasClass("hidden")) {
    hide();
  }
});

NotificationEvent.subscribe((message, level, customTitle) => {
  addNotification(message, level, customTitle);
});
