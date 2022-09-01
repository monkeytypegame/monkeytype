export function hide(): void {
  if (!$("#alertsPopupWrapper").hasClass("hidden")) {
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
    $("#alertsPopup .accountAlerts .list").html(`
  <div class="preloader"><i class="fas fa-fw fa-spin fa-circle-notch"></i></div>`);
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
          getAccountAlerts();
        }
      );
  }
}

async function getAccountAlerts(): Promise<void> {
  //
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

export function addNotification(
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
}

export function init(): void {
  $("#alertsPopup .list")
    .empty()
    .append(`<div class="nothing">Nothing to show</div>`);
}

$("#top #menu .showAlerts").on("click", () => {
  show();
});

$("#alertsPopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "alertsPopupWrapper") {
    hide();
  }
});
