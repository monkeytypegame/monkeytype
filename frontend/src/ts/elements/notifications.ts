import { debounce } from "throttle-debounce";
import * as Misc from "../utils/misc";
import * as BannerEvent from "../observables/banner-event";
import * as NotificationEvent from "../observables/notification-event";
import { convertRemToPixels } from "../utils/numbers";
import { animate } from "animejs";

function updateMargin(): void {
  const height = $("#bannerCenter").height() as number;
  $("#app").css("padding-top", height + convertRemToPixels(2) + "px");
  $("#notificationCenter").css("margin-top", height + "px");
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
    allowHTML?: boolean
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
      $("#notificationCenter .history").prepend(`
        <div class="notif ${cls}" id=${this.id} style="opacity: 0;">
            <div class="message"><div class="title"><div class="icon">${icon}</div>${title}</div>${this.message}</div>
        </div>
      `);
      const notif = document.querySelector<HTMLElement>(
        `#notificationCenter .notif[id='${this.id}']`
      );
      if (notif === null) return;

      const notifHeight = notif.offsetHeight;
      const duration = Misc.applyReducedMotion(250);

      animate(notif, {
        opacity: [0, 1],
        duration: duration / 2,
        delay: duration / 2,
      });
      notif?.addEventListener("click", () => {
        this.hide();
        this.closeCallback();
        if (this.duration === 0) {
          visibleStickyNotifications--;
        }
        updateClearAllButton();
      });

      const historyElement = document.querySelector(
        "#notificationCenter .history"
      ) as HTMLElement;
      animate(historyElement, {
        marginTop: {
          from: "-=" + notifHeight,
          to: 0,
        },
        duration: duration / 2,
      });
      $(`#notificationCenter .notif[id='${this.id}']`).on("hover", () => {
        $(`#notificationCenter .notif[id='${this.id}']`).toggleClass("hover");
      });
    } else if (this.type === "banner" || this.type === "psa") {
      let leftside = `<div class="icon lefticon">${icon}</div>`;

      let withImage = false;
      if (/images\/.*/.test(this.customIcon as string)) {
        withImage = true;
        leftside = `<div class="icon lefticon"><i class="fas fa-fw fa-bullhorn"></i></div><div class="image" style="background-image: url(${this.customIcon})"></div>`;
      }

      $("#bannerCenter").prepend(`
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
        $(
          `#bannerCenter .banner[id='${this.id}'] .closeButton, #bannerCenter .psa[id='${this.id}'] .closeButton`
        ).on("click", () => {
          this.hide();
          this.closeCallback();
        });
      }
      // NOTE: This need to be changed if the update banner text is changed
      if (/please (<a.*>)?refresh/i.test(this.message)) {
        // add pointer when refresh is needed
        $(
          `#bannerCenter .banner[id='${this.id}'], #bannerCenter .psa[id='${this.id}']`
        ).addClass("clickable");
        // refresh on clicking banner
        $(
          `#bannerCenter .banner[id='${this.id}'], #bannerCenter .psa[id='${this.id}']`
        ).on("click", () => {
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
      const elem = document.querySelector(
        `#notificationCenter .notif[id='${this.id}']`
      ) as HTMLElement;

      const duration = Misc.applyReducedMotion(250);

      animate(elem, {
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
          elem.remove();
        },
      });
    } else if (this.type === "banner" || this.type === "psa") {
      $(
        `#bannerCenter .banner[id='${this.id}'], #bannerCenter .psa[id='${this.id}']`
      ).remove();
      updateMargin();
      BannerEvent.dispatch();
    }
  }
}

function updateClearAllButton(): void {
  if (visibleStickyNotifications > 1) {
    $("#notificationCenter .clearAll").removeClass("invisible");
    $("#notificationCenter .clearAll").slideDown(125);
  } else if (visibleStickyNotifications < 1) {
    $("#notificationCenter .clearAll").addClass("invisible");
    $("#notificationCenter .clearAll").slideUp(125);
  }
}

export type AddNotificationOptions = {
  important?: boolean;
  duration?: number;
  customTitle?: string;
  customIcon?: string;
  closeCallback?: () => void;
  allowHTML?: boolean;
};

export function add(
  message: string,
  level = 0,
  options: AddNotificationOptions = {}
): void {
  NotificationEvent.dispatch(message, level, options.customTitle);

  new Notification(
    "notification",
    message,
    level,
    options.important,
    options.duration,
    options.customTitle,
    options.customIcon,
    options.closeCallback,
    options.allowHTML
  ).show();
}

export function addBanner(
  message: string,
  level = -1,
  customIcon = "bullhorn",
  sticky = false,
  closeCallback?: () => void,
  allowHTML?: boolean
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
    allowHTML
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
  allowHTML?: boolean
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
    allowHTML
  );
  psa.show();
  return psa.id;
}

export function clearAllNotifications(): void {
  $("#notificationCenter .notif").remove();
  visibleStickyNotifications = 0;
  updateClearAllButton();
}

const debouncedMarginUpdate = debounce(100, updateMargin);

$(window).on("resize", () => {
  debouncedMarginUpdate();
});

$("#notificationCenter .clearAll").on("click", () => {
  $("#notificationCenter .notif.bad").each((_, element) => {
    $(element)[0]?.click();
  });
  visibleStickyNotifications = 0;
  updateClearAllButton();
});
