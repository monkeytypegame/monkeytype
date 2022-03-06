import Config, * as UpdateConfig from "../config";
import * as Notifications from "../elements/notifications";
import * as Settings from "../pages/settings";
import * as Misc from "../misc";

function keysPerRow(row: number, type: MonkeyTypes.LayoutType): number {
  switch (row) {
    case 1:
      return 13;
    case 2:
      if (type === "iso") return 12;
      else return 13;
    case 3:
      if (type === "iso") return 12;
      else return 11;
    case 4:
      if (type === "iso") return 11;
      else return 10;
    case 5:
      return 1;

    default:
      return 0;
  }
}

export function show(action: "add" | "edit" | "remove", name?: string): void {
  if (action === "add") {
    $("#customLayoutsWrapper #customLayoutsEdit").attr("action", "add");
    $("#customLayoutsWrapper #customLayoutsEdit .title").html("Add new layout");
    $("#customLayoutsWrapper #customLayoutsEdit .button").html(
      `<i class="fas fa-plus"></i>`
    );
    $("#customLayoutsWrapper #customLayoutsEdit select")
      .removeClass("hidden")
      .select2({
        width: "20%", // If there's a better way to do this, then replace it
      });
    $("#customLayoutsWrapper #customLayoutsEdit .checkbox").removeClass(
      "hidden"
    );
    $("#customLayoutsWrapper #customLayoutsEdit label").removeClass("hidden");
    $("#customLayoutsWrapper #customLayoutsEdit input")
      .val("")
      .removeClass("hidden");

    refreshKeysEditor();
  } else if (action === "edit" && name) {
    $("#customLayoutsWrapper #customLayoutsEdit").attr("action", "edit");
    $("#customLayoutsWrapper #customLayoutsEdit").attr("name", name);
    $("#customLayoutsWrapper #customLayoutsEdit .title").html(
      `Edit layout ${name}`
    );
    $("#customLayoutsWrapper #customLayoutsEdit .button").html(
      `<i class="fas fa-pen"></i>`
    );
    $("#customLayoutsWrapper #customLayoutsEdit select")
      .removeClass("hidden")
      .select2({
        width: "20%",
      });
    $("#customLayoutsWrapper #customLayoutsEdit .checkbox").removeClass(
      "hidden"
    );
    $("#customLayoutsWrapper #customLayoutsEdit label").removeClass("hidden");
    $("#customLayoutsWrapper #customLayoutsEdit input")
      .val(name)
      .removeClass("hidden");

    Misc.getLayout(name).then((layout) => refreshKeysEditor(undefined, layout));
  } else if (action === "remove" && name) {
    $("#customLayoutsWrapper #customLayoutsEdit").attr("action", "remove");
    $("#customLayoutsWrapper #customLayoutsEdit").attr("name", name);
    $("#customLayoutsWrapper #customLayoutsEdit .title").html(
      `Remove layout ${name}`
    );
    $("#customLayoutsWrapper #customLayoutsEdit .button").html(
      `<i class="fas fa-check"></i>`
    );
    $("#customLayoutsWrapper #customLayoutsEdit select").addClass("hidden");
    $(
      "#customLayoutsWrapper #customLayoutsEdit #customLayoutKeysEditor"
    ).addClass("hidden");
    $("#customLayoutsWrapper #customLayoutsEdit label").addClass("hidden");
    $("#customLayoutsWrapper #customLayoutsEdit input").addClass("hidden");
  }

  if ($("#customLayoutsWrapper").hasClass("hidden")) {
    $("#customLayoutsWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, () => {
        $("#customLayoutsWrapper #customLayoutsEdit #customLayoutName").focus();
      });
  }
}

function hide(): void {
  if (!$("#customLayoutsWrapper").hasClass("hidden")) {
    $("#customLayoutsWrapper #customLayoutsEdit").attr("action", "");
    $("#customLayoutsWrapper #customLayoutsEdit").attr("name", "");
    $("#customLayoutsWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#customLayoutsWrapper").addClass("hidden");
        }
      );
  }
}

function getRow(row: number): string[] {
  return [
    ...$(`#customLayoutsWrapper #customLayoutsEdit .row.r${row}`)
      .children("div")
      .children("input"),
  ].map((v) => v.value);
}

async function apply(): Promise<void> {
  const action = $("#customLayoutsWrapper #customLayoutsEdit").attr("action");
  const nameAttr = $("#customLayoutsWrapper #customLayoutsEdit").attr(
    "name"
  ) as string;
  const nameInput = $(
    "#customLayoutsWrapper #customLayoutsEdit #customLayoutName"
  ).val() as string;
  const name = nameAttr || nameInput;
  const keymapShowTopRow = $(
    "#customLayoutsWrapper #customLayoutsEdit .checkbox"
  )
    .children("input")
    .is(":checked");
  const type = $(
    "#customLayoutsWrapper #customLayoutsEdit select option:selected"
  ).val() as MonkeyTypes.LayoutType;

  // if (
  //   (Config.layout === name || Config.keymapLayout === name) &&
  //   action === "remove"
  // ) {
  //   Notifications.add(
  //     "Failed to remove custom layout: you must remove the layout from the layout emulator and the keymap.",
  //     -1
  //   );
  //   return;
  // }

  const keys = {
    row1: getRow(1),
    row2: getRow(2),
    row3: getRow(3),
    row4: getRow(4),
    row5: getRow(5),
  };

  hide();

  const customLayouts = { ...Config.customLayouts };

  if (action === "add") {
    customLayouts[name] = { keymapShowTopRow, keys, type };

    const isValid = await UpdateConfig.setCustomLayouts(customLayouts);

    if (isValid) {
      Notifications.add("Custom layout added", 1);
      Settings.update();
    }
  } else if (action === "edit") {
    if (nameAttr !== nameInput) {
      delete customLayouts[nameAttr];

      customLayouts[nameInput] = { keymapShowTopRow, keys, type };
    } else {
      customLayouts[name] = { keymapShowTopRow, keys, type };
    }

    const isValid = await UpdateConfig.setCustomLayouts(customLayouts);

    if (isValid) {
      Notifications.add("Custom layout edited.", 1);
      Settings.update();
    }
  } else if (action === "remove") {
    delete customLayouts[name];

    const isValid = await UpdateConfig.setCustomLayouts(customLayouts);

    if (Config.layout === name || Config.keymapLayout === name) {
      UpdateConfig.setLayout("default");
      UpdateConfig.setKeymapLayout("overrideSync");
    }

    if (isValid) {
      Notifications.add("Custom layout removed", 1);
      Settings.update();
    }
  }
}

async function refreshKeysEditor(
  isIso?: boolean,
  layout?: MonkeyTypes.LayoutObject
): Promise<void> {
  const keyEditor = $(
    "#customLayoutsWrapper #customLayoutsEdit #customLayoutKeysEditor"
  )
    .empty()
    .removeClass("hidden");

  let keyEditorElement = "";

  for (let row = 1; row <= 5; row++) {
    const amount = keysPerRow(row, isIso ? "iso" : "ansi");

    let rowElement = "";

    const rowStr = `row${row}` as keyof MonkeyTypes.Keys;

    for (let keyIndex = 0; keyIndex < amount; keyIndex++) {
      const bump = row === 3 && (keyIndex === 3 || keyIndex === 6);

      const value = (
        layout !== undefined
          ? layout.keys[rowStr][keyIndex]
          : (await Misc.getLayout("qwerty")).keys[rowStr][keyIndex]
      ).replace(/"/g, "&quot;");
      rowElement += `<div class="key"><input type="text" maxlength="2" minlength="1" value="${value}"/>${
        bump ? "<div class='bump'></div>" : ""
      }</div>`;
    }

    keyEditorElement += `<div class="row r${row}">${rowElement}</div>`;
  }

  keyEditor.html(keyEditorElement);
}

$("#customLayoutsWrapper").click((e) => {
  if ($(e.target).attr("id") === "customLayoutsWrapper") {
    hide();
  }
});

$("#customLayoutsWrapper #customLayoutsEdit .button").click(() => {
  apply();
});

$("#customLayoutsWrapper #customLayoutsEdit input").keypress((e) => {
  if (e.keyCode == 13) {
    apply();
  }
});

$(document).on(
  "click",
  ".pageSettings .section.customLayouts .addButton",
  () => {
    show("add");
  }
);

$(document).on(
  "click",
  ".pageSettings .section.customLayouts .customLayoutsList .customLayout .editButton",
  (e) => {
    const name = $(e.currentTarget)
      .siblings(".customLayoutButton")
      .children(".title")
      .text();
    show("edit", name);
  }
);

$(document).on(
  "click",
  ".pageSettings .section.customLayouts .customLayoutsList .customLayout .removeButton",
  (e) => {
    const name = $(e.currentTarget)
      .siblings(".customLayoutButton")
      .children(".title")
      .text();
    show("remove", name);
  }
);

$(document).on(
  "change",
  "#customLayoutsWrapper #customLayoutsEdit select",
  () => {
    refreshKeysEditor(
      $("#customLayoutsWrapper #customLayoutsEdit select").val() === "iso"
    );
  }
);
