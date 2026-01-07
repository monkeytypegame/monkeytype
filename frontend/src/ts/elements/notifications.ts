import { debounce } from "throttle-debounce";
import * as Misc from "../utils/misc";
import * as BannerEvent from "../observables/banner-event";
import * as NotificationEvent from "../observables/notification-event";
import { convertRemToPixels } from "../utils/numbers";
import { animate } from "animejs";
import { qsr } from "../utils/dom";
import { CommonResponsesType } from "@monkeytype/contracts/util/api";

const notificationCenter = qsr("#notificationCenter");
const notificationCenterHistory = notificationCenter.qsr(".history");
const bannerCenter = qsr("#bannerCenter");
const app = qsr("#app");
const clearAllButton = notificationCenter.qsr(".clearAll");

function updateMargin(): void {
  const height = bannerCenter.native.offsetHeight;
  app.setStyle({ paddingTop: height + convertRemToPixels(2) + "px" });
  notificationCenter.setStyle({ marginTop: height + "px" });
}

let visibleStickyNotifications = 0;
let id = 0;

type NotificationType = "notification" | "banner" | "psa";
class Notification {
  id: number;
  type: NotificationType;
  message: string;
  level: number;
  important: boolean;
  duration: number;
  customTitle?: string;
  customIcon?: string;
  closeCallback: () => void;
  constructor(
    type: NotificationType,
    message: string,
    level: number,
    important: boolean | undefined,
    duration: number | undefined,
    customTitle?: string,
    customIcon?: string,
    closeCallback = (): void => {
      //
    },
    allowHTML?: boolean,
  ) {
    this.type = type;
    this.message = allowHTML ? message : Misc.escapeHTML(message);
    this.level = level;
    this.important = important ?? false;
    if (type === "banner" || type === "psa") {
      this.duration = duration as number;
    } else {
      if (duration === undefined) {
        if (level === -1) {
          this.duration = 0;
        } else {
          this.duration = 3000;
        }
      } else {
        this.duration = duration * 1000;
      }
    }
    this.customTitle = customTitle;
    this.customIcon = customIcon;
    this.id = id++;
    this.closeCallback = closeCallback;
  }
  //level
  //0 - notice
  //1 - good
  //-1 - bad
  show(): void {
    let cls = "notice";
    let icon = `<i class="fas fa-info-circle"></i>`;
    let title = "Notice";
    if (this.level === 1) {
      cls = "good";
      icon = `<i class="fas fa-check-circle"></i>`;
      title = "Success";
    } else if (this.level === -1) {
      cls = "bad";
      icon = `<i class="fas fa-times-circle"></i>`;
      title = "Error";
    }

    if (this.important) {
      cls += " important";
    }

    if (this.customTitle !== undefined) {
      title = this.customTitle;
    }

    if (this.type === "banner" || this.type === "psa") {
      icon = `<i class="fas fa-fw fa-bullhorn"></i>`;
    }

    if (this.customIcon !== undefined) {
      icon = `<i class="fas fa-fw fa-${this.customIcon}"></i>`;
    }

    if (this.type === "notification") {
      // moveCurrentToHistory();
      if (this.duration === 0) {
        visibleStickyNotifications++;
        updateClearAllButton();
      }

      notificationCenterHistory.prependHtml(`
        <div class="notif ${cls}" id=${this.id} style="opacity: 0;">
            <div class="message"><div class="title"><div class="icon">${icon}</div>${title}</div>${this.message}</div>
        </div>
      `);
      const notif = notificationCenter.qs(`.notif[id='${this.id}']`);
      if (notif === null) return;

      const notifHeight = notif.native.offsetHeight;
      const duration = Misc.applyReducedMotion(250);

      animate(notif.native, {
        opacity: [0, 1],
        duration: duration / 2,
        delay: duration / 2,
      });
      notif?.on("click", () => {
        this.hide();
        this.closeCallback();
        if (this.duration === 0) {
          visibleStickyNotifications--;
        }
        updateClearAllButton();
      });

      animate(notificationCenterHistory.native, {
        marginTop: {
          from: "-=" + notifHeight,
          to: 0,
        },
        duration: duration / 2,
      });
      notif?.on("hover", () => {
        notif?.toggleClass("hover");
      });
    } else if (this.type === "banner" || this.type === "psa") {
      let leftside = `<div class="icon lefticon">${icon}</div>`;

      let withImage = false;
      if (/images\/.*/.test(this.customIcon as string)) {
        withImage = true;
        leftside = `<div class="icon lefticon"><i class="fas fa-fw fa-bullhorn"></i></div><div class="image" style="background-image: url(${this.customIcon})"></div>`;
      }

      bannerCenter.prependHtml(`
        <div class="${this.type} ${cls} content-grid ${
          withImage ? "withImage" : ""
        }" id="${this.id}">
        <div class="container">
          ${leftside}
          <div class="text">
            ${this.message}
          </div>
          ${
            this.duration >= 0
              ? `
          <div class="closeButton">
            <i class="fas fa-fw fa-times"></i>
          </div>
          `
              : `<div class="righticon">${icon}</div>`
          }
        </div>
      </div>
      `);
      updateMargin();
      BannerEvent.dispatch();
      if (this.duration >= 0) {
        bannerCenter
          .qsa(
            `.banner[id='${this.id}'] .closeButton, .psa[id='${this.id}'] .closeButton`,
          )
          .on("click", () => {
            this.hide();
            this.closeCallback();
          });
      }
      // NOTE: This need to be changed if the update banner text is changed
      if (/please (<a.*>)?refresh/i.test(this.message)) {
        // add pointer when refresh is needed
        bannerCenter
          .qsa(`.banner[id='${this.id}'], .psa[id='${this.id}']`)
          .addClass("clickable");
        // refresh on clicking banner
        bannerCenter
          .qsa(`.banner[id='${this.id}'], .psa[id='${this.id}']`)
          .on("click", () => {
            window.location.reload();
          });
      }
    }
    if (this.duration > 0) {
      setTimeout(() => {
        this.hide();
      }, this.duration + 250);
    }
  }
  hide(): void {
    if (this.type === "notification") {
      const notif = notificationCenter.qs(`.notif[id='${this.id}']`);

      if (notif === null) return;

      const duration = Misc.applyReducedMotion(250);

      animate(notif.native, {
        opacity: {
          to: 0,
          duration: duration,
        },
        height: {
          to: 0,
          duration: duration / 2,
          delay: duration / 2,
        },
        marginBottom: {
          to: 0,
          duration: duration / 2,
          delay: duration / 2,
        },
        onComplete: () => {
          notif.remove();
        },
      });
    } else if (this.type === "banner" || this.type === "psa") {
      bannerCenter
        .qsa(`.banner[id='${this.id}'], .psa[id='${this.id}']`)
        .remove();
      updateMargin();
      BannerEvent.dispatch();
    }
  }
}

function updateClearAllButton(): void {
  if (visibleStickyNotifications > 1) {
    animate(clearAllButton.native, {
      height: [0, "2.25em"],
      padding: [0, "0.5em"],
      duration: 125,
      onBegin: () => {
        clearAllButton?.removeClass("hidden");
      },
    });
  } else if (visibleStickyNotifications < 1) {
    animate(clearAllButton.native, {
      height: ["2.25em", 0],
      padding: ["0.5em", 0],
      duration: 125,
      onComplete: () => {
        clearAllButton?.addClass("hidden");
      },
    });
  }
}

export type AddNotificationOptions = {
  important?: boolean;
  duration?: number;
  customTitle?: string;
  customIcon?: string;
  closeCallback?: () => void;
  allowHTML?: boolean;
  details?: object | string;
  response?: CommonResponsesType;
};

export function add(
  message: string,
  level = 0,
  options: AddNotificationOptions = {},
): void {
  let details = options.details;

  if (options.response !== undefined) {
    details = {
      status: options.response.status,
      additionalDetails: options.details,
      validationErrors:
        options.response.status === 422
          ? options.response.body.validationErrors
          : undefined,
    };
    message = message + ": " + options.response.body.message;
  }

  NotificationEvent.dispatch(message, level, {
    customTitle: options.customTitle,
    details,
  });

  new Notification(
    "notification",
    message,
    level,
    options.important,
    options.duration,
    options.customTitle,
    options.customIcon,
    options.closeCallback,
    options.allowHTML,
  ).show();
}

export function addBanner(
  message: string,
  level = -1,
  customIcon = "bullhorn",
  sticky = false,
  closeCallback?: () => void,
  allowHTML?: boolean,
): number {
  const banner = new Notification(
    "banner",
    message,
    level,
    false,
    sticky ? -1 : 0,
    undefined,
    customIcon,
    closeCallback,
    allowHTML,
  );
  banner.show();
  return banner.id;
}

export function addPSA(
  message: string,
  level = -1,
  customIcon = "bullhorn",
  sticky = false,
  closeCallback?: () => void,
  allowHTML?: boolean,
): number {
  const psa = new Notification(
    "psa",
    message,
    level,
    false,
    sticky ? -1 : 0,
    undefined,
    customIcon,
    closeCallback,
    allowHTML,
  );
  psa.show();
  return psa.id;
}

export function clearAllNotifications(): void {
  notificationCenter.qsa(".notif").remove();
  visibleStickyNotifications = 0;
  updateClearAllButton();
}

const debouncedMarginUpdate = debounce(100, updateMargin);

window.addEventListener("resize", () => {
  debouncedMarginUpdate();
});

notificationCenter.qs(".clearAll")?.on("click", () => {
  notificationCenter.qsa(".notif").forEach((element) => {
    element.native.click();
  });
  visibleStickyNotifications = 0;
  updateClearAllButton();
});
