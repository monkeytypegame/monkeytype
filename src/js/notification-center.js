const notificationHistory = [];
let id = 0;
class Notification {
  constructor(message, level, duration, customTitle, customIcon) {
    this.message = message;
    this.level = level;
    if (duration == undefined) {
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

    if (this.customIcon != undefined) {
      icon = `<i class="fas fa-fw fa-${this.customIcon}"></i>`;
    }

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
          $(`#notificationCenter .notif[id='${this.id}']`).click((e) => {
            this.hide();
          });
        }
      );
    if (this.duration > 0) {
      setTimeout(() => {
        this.hide();
      }, this.duration + 250);
    }
    $(`#notificationCenter .notif[id='${this.id}']`).hover((e) => {
      $(`#notificationCenter .notif[id='${this.id}']`).toggleClass("hover");
    });
  }
  hide() {
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
  }
}

export function add(message, level, duration, customTitle, customIcon) {
  notificationHistory.push(
    new Notification(message, level, duration, customTitle, customIcon).show()
  );
}
