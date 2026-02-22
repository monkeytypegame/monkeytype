import * as Misc from "../utils/misc";
import * as NotificationEvent from "../observables/notification-event";
import { animate } from "animejs";
import { qsr } from "../utils/dom";
import { CommonResponsesType } from "@monkeytype/contracts/util/api";
import { createEffect } from "solid-js";
import { getGlobalOffsetTop } from "../signals/core";

const notificationCenter = qsr("#notificationCenter");
const notificationCenterHistory = notificationCenter.qsr(".history");
const clearAllButton = notificationCenter.qsr(".clearAll");

let visibleStickyNotifications = 0;
let id = 0;

class Notification {
  id: number;
  message: string;
  level: number;
  important: boolean;
  duration: number;
  customTitle?: string;
  customIcon?: string;
  closeCallback: () => void;
  constructor(
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
    this.message = allowHTML ? message : Misc.escapeHTML(message);
    this.level = level;
    this.important = important ?? false;

    if (duration === undefined) {
      if (level === -1) {
        this.duration = 0;
      } else {
        this.duration = 3000;
      }
    } else {
      this.duration = duration * 1000;
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

    if (this.customIcon !== undefined) {
      icon = `<i class="fas fa-fw fa-${this.customIcon}"></i>`;
    }

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

    if (this.duration > 0) {
      setTimeout(() => {
        this.hide();
      }, this.duration + 250);
    }
  }
  hide(): void {
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
  }
}

function updateClearAllButton(): void {
  if (visibleStickyNotifications > 1) {
    animate(clearAllButton.native, {
      height: [0, "2.25em"],
      padding: [0, "0.5em"],
      duration: 125,
      onBegin: () => {
        clearAllButton?.show();
      },
    });
  } else if (visibleStickyNotifications < 1) {
    animate(clearAllButton.native, {
      height: ["2.25em", 0],
      padding: ["0.5em", 0],
      duration: 125,
      onComplete: () => {
        clearAllButton?.hide();
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

export function clearAllNotifications(): void {
  notificationCenter.qsa(".notif").remove();
  visibleStickyNotifications = 0;
  updateClearAllButton();
}

notificationCenter.qs(".clearAll")?.on("click", () => {
  notificationCenter.qsa(".notif").forEach((element) => {
    element.native.click();
  });
  visibleStickyNotifications = 0;
  updateClearAllButton();
});

createEffect(() => {
  notificationCenter.setStyle({
    marginTop: getGlobalOffsetTop() + "px",
  });
});
