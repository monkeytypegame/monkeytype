import * as Misc from "./misc";
// const notificationHistory = [];
let id = 0;
class Notification {
  constructor(
    type,
    message,
    level,
    duration,
    customTitle,
    customIcon,
    closeCallback = () => {}
  ) {
    this.type = type;
    this.message = message;
    this.level = level;
    if (type === "banner") {
      this.duration = duration;
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
  show() {
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
      let oldHeight = $("#notificationCenter .history").height();
      $("#notificationCenter .history").prepend(`
          
          <div class="notif ${cls}" id=${this.id}>
              <div class="icon">${icon}</div>
              <div class="message"><div class="title">${title}</div>${this.message}</div>
          </div>     

          `);
      let newHeight = $("#notificationCenter .history").height();
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
            $(`#notificationCenter .notif[id='${this.id}']`).click(() => {
              this.hide();
              this.closeCallback();
            });
          }
        );
      $(`#notificationCenter .notif[id='${this.id}']`).hover(() => {
        $(`#notificationCenter .notif[id='${this.id}']`).toggleClass("hover");
      });
    } else if (this.type === "banner") {
      let leftside = `<div class="icon">${icon}</div>`;

      if (/^images\/.*/.test(this.customIcon)) {
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
              : `<div style="margin-right: 2rem;">${icon}</div>`
          }
        </div>
      </div>
      `);
      let height = $("#bannerCenter").height();
      $("#centerContent").css(
        "padding-top",
        height + Misc.convertRemToPixels(2) + "px"
      );
      $("#notificationCenter").css("margin-top", height + "px");
      if (this.duration >= 0) {
        $(`#bannerCenter .banner[id='${this.id}'] .closeButton`).click(() => {
          this.hide();
          this.closeCallback();
        });
      }
    }
    if (this.duration > 0) {
      setTimeout(() => {
        this.hide();
      }, this.duration + 250);
    }
  }
  hide() {
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
      $(`#bannerCenter .banner[id='${this.id}']`).remove();
      let height = $("#bannerCenter").height();
      $("#centerContent").css(
        "padding-top",
        height + Misc.convertRemToPixels(2) + "px"
      );
      $("#notificationCenter").css("margin-top", height + "px");
    }
  }
}

export function add(
  message,
  level,
  duration,
  customTitle,
  customIcon,
  closeCallback
) {
  // notificationHistory.push(
  new Notification(
    "notification",
    message,
    level,
    duration,
    customTitle,
    customIcon,
    closeCallback
  ).show();
  // );
}

export function addBanner(
  message,
  level = -1,
  customIcon = "bullhorn",
  sticky = false,
  closeCallback
) {
  // notificationHistory.push(
  new Notification(
    "banner",
    message,
    level,
    sticky ? -1 : 0,
    undefined,
    customIcon,
    closeCallback
  ).show();
  // );
}
