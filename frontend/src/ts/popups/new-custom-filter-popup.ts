// the function to call after name is inputed by user
let callbackFunc: ((name: string) => void) | null = null;

export function show(): void {
  if ($("#newCustomFilterPopupWrapper").hasClass("hidden")) {
    $("#newCustomFilterPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, () => {
        $("#newCustomFilterPopup input").trigger("focus").select();
      });
  }
}

export function hide(): void {
  if (!$("#newCustomFilterPopupWrapper").hasClass("hidden")) {
    $("#newCustomFilterPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#newCustomFilterPopupWrapper").addClass("hidden");
        }
      );
  }
}

function apply(): void {
  const name = $("#newCustomFilterPopup input").val() as string;
  if (callbackFunc) {
    callbackFunc(name);
  }
  hide();
}

$("#newCustomFilterPopupWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "newCustomFilterPopupWrapper") {
    hide();
  }
});

$("#newCustomFilterPopup input").on("keypress", (e) => {
  if (e.key === "Enter") {
    apply();
  }
});

$("#newCustomFilterPopup .button").on("click", () => {
  apply();
});

// this function is called to display the popup,
// it must specify the callback function to call once the name is selected
export function showNewCustomFilterePopup(
  callback: (name: string) => void
): void {
  callbackFunc = callback;
  show();
}

$(document).on("click", "#top .config .wordCount .text-button", (e) => {
  const wrd = $(e.currentTarget).attr("wordCount");
  if (wrd == "custom") {
    show();
  }
});

$(document).on("keydown", (event) => {
  if (
    event.key === "Escape" &&
    !$("#newCustomFilterPopupWrapper").hasClass("hidden")
  ) {
    hide();
    event.preventDefault();
  }
});
