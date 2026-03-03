import { formatDistanceToNowStrict } from "date-fns/formatDistanceToNowStrict";
import Ape from "../ape";
import { isAuthenticated } from "../firebase";
import * as DB from "../db";
import * as NotificationEvent from "../observables/notification-event";
import * as BadgeController from "../controllers/badge-controller";
import * as Notifications from "../elements/notifications";
import {
  applyReducedMotion,
  createErrorMessage,
  escapeHTML,
  promiseAnimate,
} from "../utils/misc";
import AnimatedModal from "../utils/animated-modal";
import { MonkeyMail } from "@monkeytype/schemas/users";
import * as XPBar from "../elements/xp-bar";
import * as AuthEvent from "../observables/auth-event";
import { animate } from "animejs";
import { qs, qsr } from "../utils/dom";

const alertsPopupEl = qsr("#alertsPopup");
const accountAlertsListEl = alertsPopupEl.qsr(".accountAlerts .list");
const psasListEl = alertsPopupEl.qsr(".psas .list");
const notificationHistoryListEl = alertsPopupEl.qsr(
  ".notificationHistory .list",
);

let accountAlerts: MonkeyMail[] = [];
let maxMail = 0;
let mailToMarkRead: string[] = [];
let mailToDelete: string[] = [];

type State = {
  notifications: {
    id: string;
    title: string;
    message: string;
    level: number;
    details?: string | object;
  }[];
  psas: { message: string; level: number }[];
};

let notificationId = 0;
const state: State = {
  notifications: [],
  psas: [],
};

function hide(): void {
  setNotificationBubbleVisible(false);
  DB.updateInboxUnreadSize(0);
  void modal.hide({
    afterAnimation: async () => {
      notificationHistoryListEl?.empty();
      psasListEl?.empty();

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
          },
        );
      }

      if (totalXpClaimed > 0) {
        const snapxp = DB.getSnapshot()?.xp ?? 0;
        void XPBar.update(snapxp, totalXpClaimed);

        DB.addXp(totalXpClaimed);
      }
    },
  });
}

async function show(): Promise<void> {
  void modal.show({
    beforeAnimation: async () => {
      if (isAuthenticated()) {
        alertsPopupEl.qs(".accountAlerts")?.show();
        alertsPopupEl.qs(".separator.accountSeparator")?.show();
        accountAlertsListEl.setHtml(`
          <div class="preloader"><i class="fas fa-fw fa-spin fa-circle-notch"></i></div>`);
      } else {
        alertsPopupEl.qs(".accountAlerts")?.hide();
        alertsPopupEl.qs(".separator.accountSeparator")?.hide();
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
  const inboxResponse = await Ape.users.getInbox();

  if (inboxResponse.status === 503) {
    accountAlertsListEl.setHtml(`
    <div class="nothing">
    Account inboxes are temporarily unavailable
    </div>
    `);
    return;
  } else if (inboxResponse.status !== 200) {
    accountAlertsListEl.setHtml(`
    <div class="nothing">
    Error getting inbox: ${inboxResponse.body.message} Please try again later
    </div>
    `);
    return;
  }
  const inboxData = inboxResponse.body.data;

  accountAlerts = inboxData.inbox;

  // accountAlerts = [
  //   {
  //     id: "test-alert-1",
  //     subject: "Welcome to Monkeytype!",
  //     body: "Thank you for joining Monkeytype. We hope you enjoy your stay!",
  //     timestamp: new Date().toISOString(),
  //     read: false,
  //     rewards: [{ type: "xp", item: 100 }],
  //   },
  // ];

  updateClaimDeleteAllButton();

  if (accountAlerts.length === 0) {
    accountAlertsListEl.setHtml(`
    <div class="nothing">
    Nothing to show
    </div>
    `);
    return;
  }

  maxMail = inboxData.maxMail;

  updateInboxSize();

  accountAlertsListEl.empty();

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

    accountAlertsListEl.appendHtml(`
    
      <div class="item" data-id="${ie.id}">
        <div class="indicator ${ie.read ? "" : "main"}"></div>
        <div class="timestamp">${formatDistanceToNowStrict(
          new Date(ie.timestamp),
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
    psasListEl.setHtml(`<div class="nothing">Nothing to show</div>`);
  } else {
    psasListEl.empty();

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
      psasListEl.prependHtml(`
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
    notificationHistoryListEl.setHtml(
      `<div class="nothing">Nothing to show</div>`,
    );
  } else {
    notificationHistoryListEl.empty();
    for (const n of state.notifications) {
      const { message, level, title } = n;

      let levelClass = "sub";
      if (level === -1) {
        levelClass = "error";
      } else if (level === 1) {
        levelClass = "main";
      }

      notificationHistoryListEl.prependHtml(`
      <div class="item" data-id="${n.id}">
      <div class="indicator ${levelClass}"></div>
      <div class="title">${title}</div>
      <div class="body">
        ${escapeHTML(message)}
      </div>
      <div class="buttons">
        ${
          n.details !== undefined
            ? `<button class="copyNotification textButton" aria-label="Copy details to clipboard" data-balloon-pos="left"><i class="fas fa-fw fa-clipboard"></i></button>`
            : ``
        }
      </div>
    </div>
    `);
    }
  }
}

export function setNotificationBubbleVisible(tf: boolean): void {
  if (tf) {
    qs("header nav .showAlerts .notificationBubble")?.show();
  } else {
    qs("header nav .showAlerts .notificationBubble")?.hide();
  }
}

function updateInboxSize(): void {
  const remainingItems = accountAlerts.length - mailToDelete.length;
  alertsPopupEl
    .qs(".accountAlerts .title .right")
    ?.setText(`${remainingItems}/${maxMail}`);
}

function deleteAlert(id: string): void {
  mailToDelete.push(id);
  alertsPopupEl.qs(`.accountAlerts .list .item[data-id="${id}"]`)?.remove();
  if (alertsPopupEl.qsa(".accountAlerts .list .item").length === 0) {
    accountAlertsListEl.setHtml(`
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
  const item = alertsPopupEl.qsr(`.accountAlerts .list .item[data-id="${id}"]`);
  updateClaimDeleteAllButton();

  item.qs(".indicator")?.removeClass("main");
  item.qs(".buttons")?.empty();
  item
    .qs(".buttons")
    ?.appendHtml(
      `<button class="deleteAlert textButton" aria-label="Delete" data-balloon-pos="left"><i class="fas fa-trash"></i></button>`,
    );

  const itemToAnimate = item.qsr(".rewards");
  animate(itemToAnimate.native, {
    opacity: 0,
    height: 0,
    marginTop: 0,
    duration: 250,
    onComplete: () => {
      itemToAnimate.remove();
    },
  });
}

function updateClaimDeleteAllButton(): void {
  const claimAllButton = alertsPopupEl.qs(".accountAlerts .claimAll");
  const deleteAllButton = alertsPopupEl.qs(".accountAlerts .deleteAll");

  claimAllButton?.hide();
  deleteAllButton?.hide();
  if (accountAlerts.length > 0) {
    let rewardsCount = 0;
    for (const ie of accountAlerts) {
      if (!ie.read && !mailToMarkRead.includes(ie.id)) {
        rewardsCount += ie.rewards.length;
      }
    }

    if (rewardsCount > 0) {
      claimAllButton?.show();
    } else {
      deleteAllButton?.show();
    }
  }
  if (mailToDelete.length === accountAlerts.length) {
    deleteAllButton?.hide();
  }
}

async function copyNotificationToClipboard(target: HTMLElement): Promise<void> {
  const id = (target as HTMLElement | null)
    ?.closest(".item")
    ?.getAttribute("data-id")
    ?.toString();

  if (id === undefined) {
    throw new Error("Notification ID is undefined");
  }
  const notification = state.notifications.find((it) => it.id === id);
  if (notification === undefined) return;

  const icon = target.querySelector("i") as HTMLElement;

  try {
    await navigator.clipboard.writeText(
      JSON.stringify(
        {
          title: notification.title,
          message: notification.message,
          details: notification.details,
        },
        null,
        4,
      ),
    );

    const duration = applyReducedMotion(100);

    await promiseAnimate(icon, {
      scale: [1, 0.8],
      opacity: [1, 0],
      duration,
    });
    icon.classList.remove("fa-clipboard");
    icon.classList.add("fa-check", "highlight");
    await promiseAnimate(icon, {
      scale: [0.8, 1],
      opacity: [0, 1],
      duration,
    });

    await promiseAnimate(icon, {
      scale: [1, 0.8],
      opacity: [1, 0],
      delay: 3000,
      duration,
    });
    icon.classList.remove("fa-check", "highlight");
    icon.classList.add("fa-clipboard");

    await promiseAnimate(icon, {
      scale: [0.8, 1],
      opacity: [0, 1],
      duration,
    });
  } catch (e: unknown) {
    const msg = createErrorMessage(e, "Could not copy to clipboard");
    Notifications.add(msg, -1);
  }
}

qs("header nav .showAlerts")?.on("click", () => {
  void show();
});

NotificationEvent.subscribe((message, level, options) => {
  let title = "Notice";
  if (level === -1) {
    title = "Error";
  } else if (level === 1) {
    title = "Success";
  }
  if (options.customTitle !== undefined) {
    title = options.customTitle;
  }

  state.notifications.push({
    id: (notificationId++).toString(),
    title,
    message,
    level,
    details: options.details,
  });
  if (state.notifications.length > 25) {
    state.notifications.shift();
  }
});

AuthEvent.subscribe((event) => {
  if (event.type === "snapshotUpdated" && event.data.isInitial) {
    const snapshot = DB.getSnapshot();
    setNotificationBubbleVisible((snapshot?.inboxUnreadSize ?? 0) > 0);
  }
  if (event.type === "authStateChanged" && !event.data.isUserSignedIn) {
    setNotificationBubbleVisible(false);
    accountAlerts = [];
    mailToMarkRead = [];
    mailToDelete = [];
    accountAlertsListEl.empty();
  }
});

const modal = new AnimatedModal({
  dialogId: "alertsPopup",
  customAnimations: {
    show: {
      modal: {
        marginRight: ["-10rem", "0"],
      },
    },
    hide: {
      modal: {
        marginRight: ["0", "-10rem"],
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
    alertsPopupEl.qs(".accountAlerts")?.onChild("click", ".claimAll", () => {
      for (const ie of accountAlerts) {
        if (!ie.read && !mailToMarkRead.includes(ie.id)) {
          markReadAlert(ie.id);
        }
      }
    });

    alertsPopupEl.qs(".accountAlerts")?.onChild("click", ".deleteAll", () => {
      for (const ie of accountAlerts) {
        if (!mailToDelete.includes(ie.id)) {
          deleteAlert(ie.id);
        }
      }
    });

    alertsPopupEl.qs(".mobileClose")?.on("click", () => {
      hide();
    });

    alertsPopupEl
      .qs(".accountAlerts .list")
      ?.onChild("click", ".item .buttons .deleteAlert", (e) => {
        const id = (e.target as HTMLElement | null)
          ?.closest(".item")
          ?.getAttribute("data-id")
          ?.toString();

        if (id === undefined) {
          throw new Error("Alert ID is undefined");
        }

        deleteAlert(id);
      });

    alertsPopupEl
      .qs(".accountAlerts .list")
      ?.onChild("click", ".item .buttons .markReadAlert", (e) => {
        const id = (e.target as HTMLElement | null)
          ?.closest(".item")
          ?.getAttribute("data-id")
          ?.toString();

        if (id === undefined) {
          throw new Error("Alert ID is undefined");
        }

        markReadAlert(id);
      });

    alertsPopupEl
      .qs(".notificationHistory .list")
      ?.onChild("click", ".item .buttons .copyNotification", (e) => {
        void copyNotificationToClipboard(e.target as HTMLElement);
      });
  },
});
