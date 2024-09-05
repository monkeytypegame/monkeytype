import { formatDistanceToNowStrict } from "date-fns/formatDistanceToNowStrict";
import Ape from "../ape";
import { isAuthenticated } from "../firebase";
import * as AccountButton from "../elements/account-button";
import * as DB from "../db";
import * as NotificationEvent from "../observables/notification-event";
import * as BadgeController from "../controllers/badge-controller";
import * as Notifications from "../elements/notifications";
import * as ConnectionState from "../states/connection";
import { escapeHTML } from "../utils/misc";
import AnimatedModal from "../utils/animated-modal";
import { updateXp as accountPageUpdateProfile } from "./profile";

let accountAlerts: MonkeyTypes.MonkeyMail[] = [];
let maxMail = 0;
let mailToMarkRead: string[] = [];
let mailToDelete: string[] = [];

type State = {
  notifications: { message: string; level: number; customTitle?: string }[];
  psas: { message: string; level: number }[];
};

const state: State = {
  notifications: [],
  psas: [],
};

function hide(): void {
  setNotificationBubbleVisible(false);
  void modal.hide({
    afterAnimation: async () => {
      $("#alertsPopup .notificationHistory .list").empty();
      $("#alertsPopup .psas .list").empty();

      const badgesClaimed: string[] = [];
      let totalXpClaimed = 0;

      if (mailToMarkRead.length === 0 && mailToDelete.length === 0) return;

      const updateResponse = await Ape.users.updateInbox({
        body: {
          mailIdsToMarkRead:
            mailToMarkRead.length > 0 ? mailToMarkRead : undefined,
          mailIdsToDelete: mailToDelete.length > 0 ? mailToDelete : undefined,
        },
      });

      const status = updateResponse.status;
      const message = updateResponse.body.message;
      if (status !== 200) {
        Notifications.add(`Failed to update inbox: ${message}`, -1);
        return;
      }

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
          totalXpClaimed += r.item;
        } else if (r.type === "badge") {
          const badge = BadgeController.getById(r.item.id);
          if (badge) {
            badgesClaimed.push(badge.name);
            DB.addBadge(r.item);
          }
        }
      }

      if (badgesClaimed.length > 0) {
        Notifications.add(
          `New badge${
            badgesClaimed.length > 1 ? "s" : ""
          } unlocked: ${badgesClaimed.join(", ")}`,
          1,
          {
            duration: 5,
            customTitle: "Reward",
            customIcon: "gift",
          }
        );
      }

      if (totalXpClaimed > 0) {
        const snapxp = DB.getSnapshot()?.xp ?? 0;
        void AccountButton.updateXpBar(snapxp, totalXpClaimed);
        accountPageUpdateProfile(snapxp + totalXpClaimed);
        DB.addXp(totalXpClaimed);
      }
    },
  });
}

async function show(): Promise<void> {
  void modal.show({
    beforeAnimation: async () => {
      if (isAuthenticated()) {
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

      fillNotifications();
      fillPSAs();
    },
    afterAnimation: async () => {
      if (isAuthenticated()) {
        void getAccountAlerts();
      }
    },
  });
}

async function getAccountAlerts(): Promise<void> {
  if (!ConnectionState.get()) {
    $("#alertsPopup .accountAlerts .list").html(`
    <div class="nothing">
    You are offline
    </div>
    `);
    return;
  }

  const inboxResponse = await Ape.users.getInbox();

  if (inboxResponse.status === 503) {
    $("#alertsPopup .accountAlerts .list").html(`
    <div class="nothing">
    Account inboxes are temporarily unavailable
    </div>
    `);
    return;
  } else if (inboxResponse.status !== 200) {
    $("#alertsPopup .accountAlerts .list").html(`
    <div class="nothing">
    Error getting inbox: ${inboxResponse.body.message} Please try again later
    </div>
    `);
    return;
  }
  const inboxData = inboxResponse.body.data;

  accountAlerts = inboxData.inbox;

  updateClaimDeleteAllButton();

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

  $("#alertsPopup .accountAlerts .list").empty();

  for (const ie of accountAlerts) {
    if (!ie.read && ie.rewards.length === 0) {
      mailToMarkRead.push(ie.id);
    }

    let rewardsString = "";

    if (ie.rewards.length > 0 && !ie.read) {
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
            ie.rewards.length > 0 && !ie.read
              ? `<button class="markReadAlert textButton" aria-label="Claim" data-balloon-pos="left"><i class="fas fa-gift"></i></button>`
              : ``
          }
          ${
            (ie.rewards.length > 0 && ie.read) || ie.rewards.length === 0
              ? `<button class="deleteAlert textButton" aria-label="Delete" data-balloon-pos="left"><i class="fas fa-trash"></i></button>`
              : ``
          }
        </div>
      </div>
    
    `);
  }
}

export function addPSA(message: string, level: number): void {
  state.psas.push({
    message,
    level,
  });
}

function fillPSAs(): void {
  if (state.psas.length === 0) {
    $("#alertsPopup .psas .list").html(
      `<div class="nothing">Nothing to show</div>`
    );
  } else {
    $("#alertsPopup .psas .list").empty();

    for (const p of state.psas) {
      const { message, level } = p;
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
          ${escapeHTML(message)}
        </div>
      </div>
      `);
    }
  }
}

function fillNotifications(): void {
  if (state.notifications.length === 0) {
    $("#alertsPopup .notificationHistory .list").html(
      `<div class="nothing">Nothing to show</div>`
    );
  } else {
    $("#alertsPopup .notificationHistory .list").empty();

    for (const n of state.notifications) {
      const { message, level, customTitle } = n;
      let title = "Notice";
      let levelClass = "sub";
      if (level === -1) {
        levelClass = "error";
        title = "Error";
      } else if (level === 1) {
        levelClass = "main";
        title = "Success";
      }

      if (customTitle !== undefined) {
        title = customTitle;
      }

      $("#alertsPopup .notificationHistory .list").prepend(`
      <div class="item">
      <div class="indicator ${levelClass}"></div>
      <div class="title">${title}</div>
      <div class="body">
        ${escapeHTML(message)}
      </div>
    </div>
    `);
    }
  }
}

export function setNotificationBubbleVisible(tf: boolean): void {
  if (tf) {
    $("header nav .showAlerts .notificationBubble").removeClass("hidden");
  } else {
    $("header nav .showAlerts .notificationBubble").addClass("hidden");
  }
}

function updateInboxSize(): void {
  $("#alertsPopup .accountAlerts .title .right").text(
    `${accountAlerts.length}/${maxMail}`
  );
}

function deleteAlert(id: string): void {
  mailToDelete.push(id);
  $(`#alertsPopup .accountAlerts .list .item[data-id="${id}"]`).remove();
  if ($("#alertsPopup .accountAlerts .list .item").length == 0) {
    $("#alertsPopup .accountAlerts .list").html(`
    <div class="nothing">
    Nothing to show
    </div>
    `);
  }
  updateClaimDeleteAllButton();
  updateInboxSize();
}

function markReadAlert(id: string): void {
  mailToMarkRead.push(id);
  const item = $(`#alertsPopup .accountAlerts .list .item[data-id="${id}"]`);
  updateClaimDeleteAllButton();

  item.find(".indicator").removeClass("main");
  item.find(".buttons").empty();
  item
    .find(".buttons")
    .append(
      `<button class="deleteAlert textButton" aria-label="Delete" data-balloon-pos="left"><i class="fas fa-trash"></i></button>`
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

function updateClaimDeleteAllButton(): void {
  const claimAllButton = $("#alertsPopup .accountAlerts .claimAll");
  const deleteAllButton = $("#alertsPopup .accountAlerts .deleteAll");

  claimAllButton.addClass("hidden");
  deleteAllButton.addClass("hidden");
  if (accountAlerts.length > 0) {
    let rewardsCount = 0;
    for (const ie of accountAlerts) {
      if (!ie.read && !mailToMarkRead.includes(ie.id)) {
        rewardsCount += ie.rewards.length;
      }
    }

    if (rewardsCount > 0) {
      claimAllButton.removeClass("hidden");
    } else {
      deleteAllButton.removeClass("hidden");
    }
  }
  if (mailToDelete.length === accountAlerts.length) {
    deleteAllButton.addClass("hidden");
  }
}

$("header nav .showAlerts").on("click", () => {
  void show();
});

NotificationEvent.subscribe((message, level, customTitle) => {
  state.notifications.push({
    message,
    level,
    customTitle,
  });
  if (state.notifications.length > 25) {
    state.notifications.shift();
  }
});

const modal = new AnimatedModal({
  dialogId: "alertsPopup",
  customAnimations: {
    show: {
      modal: {
        from: {
          marginRight: "-10rem",
        },
        to: {
          marginRight: "0",
        },
        easing: "easeOutCirc",
      },
    },
    hide: {
      modal: {
        from: {
          marginRight: "0",
        },
        to: {
          marginRight: "-10rem",
        },
        easing: "easeInCirc",
      },
    },
  },
  customEscapeHandler: (): void => {
    hide();
  },
  customWrapperClickHandler: (): void => {
    hide();
  },
  setup: async (): Promise<void> => {
    $("#alertsPopup .accountAlerts").on("click", ".claimAll", () => {
      for (const ie of accountAlerts) {
        if (!ie.read && !mailToMarkRead.includes(ie.id)) {
          markReadAlert(ie.id);
        }
      }
    });

    $("#alertsPopup .accountAlerts").on("click", ".deleteAll", () => {
      for (const ie of accountAlerts) {
        if (!mailToDelete.includes(ie.id)) {
          deleteAlert(ie.id);
        }
      }
    });

    $("#alertsPopup .mobileClose").on("click", () => {
      hide();
    });

    $("#alertsPopup .accountAlerts .list").on(
      "click",
      ".item .buttons .deleteAlert",
      (e) => {
        const id = $(e.currentTarget)
          .closest(".item")
          .attr("data-id") as string;
        deleteAlert(id);
      }
    );

    $("#alertsPopup .accountAlerts .list").on(
      "click",
      ".item .buttons .markReadAlert",
      (e) => {
        const id = $(e.currentTarget)
          .closest(".item")
          .attr("data-id") as string;
        markReadAlert(id);
      }
    );
  },
});
