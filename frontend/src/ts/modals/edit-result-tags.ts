import { showLoaderBar, hideLoaderBar } from "../states/loader-bar";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../states/notifications";
import { areUnsortedArraysEqual } from "../utils/arrays";
import * as TestResult from "../test/result";
import AnimatedModal from "../utils/animated-modal";
import { __nonReactive } from "../collections/tags";
import { updateTags } from "../collections/results";

type State = {
  resultId: string;
  startingTags: string[];
  tags: string[];
  source: "accountPage" | "resultPage";
};

const state: State = {
  resultId: "",
  startingTags: [],
  tags: [],
  source: "accountPage",
};

export function show(
  resultId: string,
  tags: string[],
  source: "accountPage" | "resultPage",
): void {
  if (resultId === "") {
    showErrorNotification(
      "Failed to show edit result tags modal: result id is empty",
    );
    return;
  }

  const knownTagIds = new Set(__nonReactive.getTags().map((it) => it._id));
  tags = tags.filter((it) => knownTagIds.has(it));

  state.resultId = resultId;
  state.startingTags = [...tags];
  state.tags = [...tags];
  state.source = source;

  void modal.show({
    beforeAnimation: async (): Promise<void> => {
      appendButtons();
      updateActiveButtons();
    },
  });
}

function hide(): void {
  void modal.hide();
}

function appendButtons(): void {
  const buttonsEl = modal.getModal().qs(".buttons");

  if (buttonsEl === null) {
    showErrorNotification(
      "Failed to append buttons to edit result tags modal: could not find buttons element",
    );
    return;
  }

  const tagIds = new Set([
    ...__nonReactive.getTags().map((tag) => tag._id),
    ...state.tags,
  ]);

  buttonsEl.empty();
  for (const tagId of tagIds) {
    const tag = __nonReactive.getTag(tagId);
    const button = document.createElement("button");
    button.classList.add("toggleTag");
    button.setAttribute("data-tag-id", tagId);
    button.innerHTML = tag?.name ?? tag?._id ?? "unknown tag"; //this shouldnt happen?
    button.addEventListener("click", (e) => {
      toggleTag(tagId);
      updateActiveButtons();
    });
    buttonsEl.append(button);
  }
}

function updateActiveButtons(): void {
  const buttons = modal.getModal().qsa(".buttons button");
  for (const button of buttons) {
    const tagid: string = button.getAttribute("data-tag-id") ?? "";
    if (state.tags.includes(tagid)) {
      button.addClass("active");
    } else {
      button.removeClass("active");
    }
  }
}

function toggleTag(tagId: string): void {
  if (state.tags.includes(tagId)) {
    state.tags = state.tags.filter((el) => el !== tagId);
  } else {
    state.tags.push(tagId);
  }
}

async function save(): Promise<void> {
  showLoaderBar();
  await updateTags({
    resultId: state.resultId,
    tagIds: state.tags,
    afterUpdate: ({ tagPbs }) => {
      if (state.source === "resultPage") {
        TestResult.updateTagsAfterEdit(state.tags, tagPbs);
      }
    },
  });
  hideLoaderBar();

  //if got no freaking idea why this is needed
  //but update tags somehow adds undefined to the end of the array
  //i tried spreading, json parsing - nothing helped.
  state.tags = state.tags.filter((el) => el !== undefined);
  showSuccessNotification("Tags updated", { durationMs: 2000 });
}

const modal = new AnimatedModal({
  dialogId: "editResultTagsModal",
  setup: async (modalEl): Promise<void> => {
    modalEl.qs("button.saveButton")?.on("click", (e) => {
      if (areUnsortedArraysEqual(state.startingTags, state.tags)) {
        hide();
        return;
      }
      hide();
      void save();
    });
  },
});
