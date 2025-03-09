import Ape from "../ape";
import * as DB from "../db";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import * as AccountPage from "../pages/account";
import * as ConnectionState from "../states/connection";
import { areUnsortedArraysEqual } from "../utils/arrays";
import * as TestResult from "../test/result";
import AnimatedModal from "../utils/animated-modal";

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
  source: "accountPage" | "resultPage"
): void {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, {
      duration: 2,
    });
    return;
  }
  if (resultId === "") {
    Notifications.add(
      "Failed to show edit result tags modal: result id is empty",
      -1
    );
    return;
  }

  state["resultId"] = resultId;
  state["startingTags"] = [...tags];
  state["tags"] = [...tags];
  state["source"] = source;

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
  const buttonsEl = modal.getModal().querySelector(".buttons");

  if (buttonsEl === null) {
    Notifications.add(
      "Failed to append buttons to edit result tags modal: could not find buttons element",
      -1
    );
    return;
  }

  const tagIds = new Set([
    ...(DB.getSnapshot()?.tags.map((tag) => tag._id) ?? []),
    ...state.tags,
  ]);

  buttonsEl.innerHTML = "";
  for (const tagId of tagIds) {
    const tag = DB.getSnapshot()?.tags.find((tag) => tag._id === tagId);
    const button = document.createElement("button");
    button.classList.add("toggleTag");
    button.setAttribute("data-tag-id", tagId);
    button.innerHTML = tag?.display ?? "unknown tag";
    button.addEventListener("click", (e) => {
      toggleTag(tagId);
      updateActiveButtons();
    });
    buttonsEl.appendChild(button);
  }
}

function updateActiveButtons(): void {
  for (const button of $("#editResultTagsModal .modal .buttons button")) {
    const tagid: string = $(button).attr("data-tag-id") ?? "";
    if (state.tags.includes(tagid)) {
      $(button).addClass("active");
    } else {
      $(button).removeClass("active");
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
  Loader.show();
  const response = await Ape.results.updateTags({
    body: { resultId: state.resultId, tagIds: state.tags },
  });
  Loader.hide();

  //if got no freaking idea why this is needed
  //but update tags somehow adds undefined to the end of the array
  //i tried spreading, json parsing - nothing helped.
  state.tags = state.tags.filter((el) => el !== undefined);

  if (response.status !== 200) {
    Notifications.add(
      "Failed to update result tags: " + response.body.message,
      -1
    );
    return;
  }

  //can do this because the response will not be null if the status is 200
  const responseTagPbs = response.body.data?.tagPbs ?? [];

  Notifications.add("Tags updated", 1, {
    duration: 2,
  });

  DB.getSnapshot()?.results?.forEach((result) => {
    if (result._id === state.resultId) {
      result.tags = state.tags;
    }
  });

  if (state.source === "accountPage") {
    AccountPage.updateTagsForResult(state.resultId, state.tags);
  } else if (state.source === "resultPage") {
    TestResult.updateTagsAfterEdit(state.tags, responseTagPbs);
  }
}

const modal = new AnimatedModal({
  dialogId: "editResultTagsModal",
  setup: async (modalEl): Promise<void> => {
    modalEl
      .querySelector("button.saveButton")
      ?.addEventListener("click", (e) => {
        if (areUnsortedArraysEqual(state.startingTags, state.tags)) {
          hide();
          return;
        }
        hide();
        void save();
      });
  },
});
