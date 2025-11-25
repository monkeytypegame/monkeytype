import { InputIndicator } from "../elements/input-indicator";
import { sleep } from "../utils/misc";
import Ape from "../ape";
import { navigate } from "../controllers/route-controller";
import * as Skeleton from "../utils/skeleton";
import { qs } from "../utils/dom";

const searchIndicator = new InputIndicator(
  qs(".page.pageProfileSearch .search input", { guaranteed: true }),
  {
    notFound: {
      icon: "fa-user-slash",
      level: -1,
    },
    error: {
      icon: "fa-times",
      level: -1,
    },
    checking: {
      icon: "fa-circle-notch",
      spinIcon: true,
      level: 1,
    },
  }
);

function disableInputs(): void {
  qs(".page.pageProfileSearch .search button")?.addClass("disabled");
  qs(".page.pageProfileSearch .search input")?.disable();
}

function enableInputs(): void {
  qs(".page.pageProfileSearch .search button")?.removeClass("disabled");
  qs(".page.pageProfileSearch .search input")?.enable();
}

function areInputsDisabled(): boolean {
  return qs(".page.pageProfileSearch .search input")?.isDisabled() ?? false;
}

function focusInput(): void {
  qs(".page.pageProfileSearch .search input")?.dispatch("focus");
}

async function lookupProfile(): Promise<void> {
  searchIndicator.hide();
  const name =
    qs<HTMLInputElement>(".page.pageProfileSearch .search input")?.getValue() ??
    "";
  if (name === "") return;

  searchIndicator.show("checking");
  disableInputs();

  await sleep(500);

  const response = await Ape.users.getProfile({ params: { uidOrName: name } });
  enableInputs();
  if (response.status === 404) {
    focusInput();
    searchIndicator.show("notFound", "User not found");
    return;
  } else if (response.status !== 200) {
    focusInput();
    searchIndicator.show("error", `Error: ${response.body.message}`);
    return;
  }
  searchIndicator.hide();
  await navigate(`/profile/${name}`, {
    data: response.body.data,
  });
}

qs(".page.pageProfileSearch form")?.on("submit", (e) => {
  e.preventDefault();
  if (areInputsDisabled()) return;
  void lookupProfile();
});

Skeleton.save("pageProfileSearch");
