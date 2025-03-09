import * as CustomText from "../test/custom-text";
import * as Notifications from "../elements/notifications";
import * as CustomTextState from "../states/custom-text-name";
import { InputIndicator } from "../elements/input-indicator";
import { debounce } from "throttle-debounce";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";

let indicator: InputIndicator | undefined;

type State = {
  textToSave: string[];
};

const state: State = {
  textToSave: [],
};

export async function show(options: ShowOptions<IncomingData>): Promise<void> {
  state.textToSave = [];
  void modal.show({
    ...options,
    beforeAnimation: async (modalEl, modalChainData) => {
      state.textToSave = modalChainData?.text ?? [];
      $("#saveCustomTextModal .textName").val("");
      $("#saveCustomTextModal .isLongText").prop("checked", false);
      $("#saveCustomTextModal button.save").prop("disabled", true);
    },
  });
}

function hide(): void {
  void modal.hide();
}

function save(): boolean {
  const name = $("#saveCustomTextModal .textName").val() as string;
  const checkbox = $("#saveCustomTextModal .isLongText").prop(
    "checked"
  ) as boolean;

  if (!name) {
    Notifications.add("Custom text needs a name", 0);
    return false;
  }

  if (state.textToSave.length === 0) {
    Notifications.add("Custom text can't be empty", 0);
    return false;
  }

  CustomText.setCustomText(name, state.textToSave, checkbox);
  CustomTextState.setCustomTextName(name, checkbox);
  Notifications.add("Custom text saved", 1);
  return true;
}

function updateIndicatorAndButton(): void {
  const val = $("#saveCustomTextModal .textName").val() as string;
  const checkbox = $("#saveCustomTextModal .isLongText").prop(
    "checked"
  ) as boolean;

  if (!val) {
    indicator?.hide();
    $("#saveCustomTextModal button.save").prop("disabled", true);
  } else {
    const names = CustomText.getCustomTextNames(checkbox);
    if (names.includes(val)) {
      indicator?.show("unavailable");
      $("#saveCustomTextModal button.save").prop("disabled", true);
    } else {
      indicator?.show("available");
      $("#saveCustomTextModal button.save").prop("disabled", false);
    }
  }
}

const updateInputAndButtonDebounced = debounce(500, updateIndicatorAndButton);

async function setup(modalEl: HTMLElement): Promise<void> {
  indicator = new InputIndicator($("#saveCustomTextModal .textName"), {
    available: {
      icon: "fa-check",
      level: 1,
    },
    unavailable: {
      icon: "fa-times",
      level: -1,
    },
    loading: {
      icon: "fa-circle-notch",
      spinIcon: true,
      level: 0,
    },
  });
  modalEl.addEventListener("submit", (e) => {
    e.preventDefault();
    if (save()) hide();
  });
  modalEl.querySelector(".textName")?.addEventListener("input", (e) => {
    const val = (e.target as HTMLInputElement).value;
    if (val.length > 0) {
      indicator?.show("loading");
      updateInputAndButtonDebounced();
    }
  });
  modalEl.querySelector(".isLongText")?.addEventListener("input", (e) => {
    const val = (e.target as HTMLInputElement).value;
    if (val.length > 0) {
      indicator?.show("loading");
      updateInputAndButtonDebounced();
    }
  });
}

type IncomingData = {
  text: string[];
};

const modal = new AnimatedModal<IncomingData>({
  dialogId: "saveCustomTextModal",
  setup,
});
