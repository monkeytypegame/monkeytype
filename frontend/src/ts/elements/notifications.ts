import { debounce } from "throttle-debounce";
import * as Misc from "../utils/misc";
import * as BannerEvent from "../observables/banner-event";
// import * as Alerts from "./alerts";
import * as NotificationEvent from "../observables/notification-event";

function updateMargin(): void {
  const height = $("#bannerCenter").height() as number;
  $("#centerContent").css(
    "padding-top",
    height + Misc.convertRemToPixels(2) + "px"
  );
  $("#notificationCenter").css("margin-top", height + "px");
}

let id = 0;
class Notification {
  id: number;
  type: string;
  message: string;
  level: number;
  important: boolean;
  duration: number;
  customTitle?: string;
  customIcon?: string;
  closeCallback: () => void;
  constructor(
    type: string,
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
    this.important = important || false;
    if (type === "banner") {
      this.duration = duration as number;
    } else {
      if (duration == undefined) {
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
    let icon = `<i class="fas fa-fw fa-exclamation"></i>`;
    let title = "Notice";
    if (this.level === 1) {
      cls = "good";
      icon = `<i class="fas fa-fw fa-check"></i>`;
      title = "Success";
    } else if (this.level === -1) {
      cls = "bad";
      icon = `<i class="fas fa-fw fa-times"></i>`;
      title = "Error";
      console.error(this.message);
    }

    if (this.important) {
      cls += " important";
    }

    if (this.customTitle != undefined) {
      title = this.customTitle;
    }

    if (this.type === "banner") {
      icon = `<i class="fas fa-fw fa-bullhorn"></i>`;
    }

    if (this.customIcon != undefined) {
      icon = `<i class="fas fa-fw fa-${this.customIcon}"></i>`;
    }

    if (this.type === "notification") {
      // moveCurrentToHistory();
      const oldHeight = $("#notificationCenter .history").height() as number;
      $("#notificationCenter .history").prepend(`
          
          <div class="notif ${cls}" id=${this.id}>
              <div class="icon">${icon}</div>
              <div class="message"><div class="title">${title}</div>${this.message}</div>
          </div>     

          `);
      const newHeight = $("#notificationCenter .history").height() as number;
      $(`#notificationCenter .notif[id='${this.id}']`).remove();
      $("#notificationCenter .history")
        .css("margin-top", 0)
        .animate(
          {
            marginTop: newHeight - oldHeight,
          },
          125,
          () => {
            $("#notificationCenter .history").css("margin-top", 0);
            $("#notificationCenter .history").prepend(`
          
                  <div class="notif ${cls}" id=${this.id}>
                      <div class="icon">${icon}</div>
                      <div class="message"><div class="title">${title}</div>${this.message}</div>
                  </div>     

              `);
            $(`#notificationCenter .notif[id='${this.id}']`)
              .css("opacity", 0)
              .animate(
                {
                  opacity: 1,
                },
                125,
                () => {
                  $(`#notificationCenter .notif[id='${this.id}']`).css(
                    "opacity",
                    ""
                  );
                }
              );
            $(`#notificationCenter .notif[id='${this.id}']`).on("click", () => {
              this.hide();
              this.closeCallback();
            });
          }
        );
      $(`#notificationCenter .notif[id='${this.id}']`).hover(() => {
        $(`#notificationCenter .notif[id='${this.id}']`).toggleClass("hover");
      });
    } else if (this.type === "banner") {
      let leftside = `<div class="icon lefticon">${icon}</div>`;

      if (/images\/.*/.test(this.customIcon as string)) {
        leftside = `<div class="image" style="background-image: url(${this.customIcon})"></div>`;
      }

      $("#bannerCenter").prepend(`
        <div class="banner ${cls}" id="${this.id}">
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
        $(`#bannerCenter .banner[id='${this.id}'] .closeButton`).on(
          "click",
          () => {
            this.hide();
            this.closeCallback();
          }
        );
      }
      // NOTE: This need to be changed if the update banner text is changed
      if (this.message.includes("please refresh")) {
        // add pointer when refresh is needed
        $(`#bannerCenter .banner[id='${this.id}']`).css("cursor", "pointer");
        // refresh on clicking banner
        $(`#bannerCenter .banner[id='${this.id}']`).on("click", () => {
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
      $(`#notificationCenter .notif[id='${this.id}']`)
        .css("opacity", 1)
        .animate(
          {
            opacity: 0,
          },
          125,
          () => {
            $(`#notificationCenter .notif[id='${this.id}']`).animate(
              {
                height: 0,
              },
              125,
              () => {
                $(`#notificationCenter .notif[id='${this.id}']`).remove();
              }
            );
          }
        );
    } else if (this.type === "banner") {
      $(`#bannerCenter .banner[id='${this.id}']`)
        .css("opacity", 1)
        .animate(
          {
            opacity: 0,
          },
          125,
          () => {
            $(`#bannerCenter .banner[id='${this.id}']`).remove();
            updateMargin();
            BannerEvent.dispatch();
          }
        );
    }
  }
}

interface AddNotificationOptions {
  important?: boolean;
  duration?: number;
  customTitle?: string;
  customIcon?: string;
  closeCallback?: () => void;
  allowHTML?: boolean;
}

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

export function clearAllNotifications(): void {
  $("#notificationCenter .notif").remove();
}

const debouncedMarginUpdate = debounce(100, updateMargin);

$(window).on("resize", () => {
  debouncedMarginUpdate();
});
