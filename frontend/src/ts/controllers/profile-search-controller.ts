import { InputIndicator } from "../elements/input-indicator";
import { sleep } from "../utils/misc";
import Ape from "../ape";
import { navigate } from "../controllers/route-controller";
import * as Skeleton from "../popups/skeleton";

const searchIndicator = new InputIndicator(
  $(".page.pageProfileSearch .search input"),
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
  $(".page.pageProfileSearch .search .button").addClass("disabled");
  $(".page.pageProfileSearch .search input").attr("disabled", "disabled");
}

function enableInputs(): void {
  $(".page.pageProfileSearch .search .button").removeClass("disabled");
  $(".page.pageProfileSearch .search input").removeAttr("disabled");
}

function areInputsDisabled(): boolean {
  return (
    $(".page.pageProfileSearch .search input").attr("disabled") !== undefined
  );
}

async function lookupProfile(): Promise<void> {
  searchIndicator.hide();
  const name = $(".page.pageProfileSearch .search input").val() as string;
  if (name === "") return;

  searchIndicator.show("checking");
  disableInputs();

  await sleep(500);

  const response = await Ape.users.getProfileByName(name);
  enableInputs();
  if (response.status === 404) {
    searchIndicator.show("notFound", "User not found");
    return;
  } else if (response.status !== 200) {
    searchIndicator.show("error", `Error: ${response.message}`);
    return;
  }
  searchIndicator.hide();
  navigate(`/profile/${name}`, {
    data: response.data,
  });
}

$(".page.pageProfileSearch .search input").on("keyup", (e) => {
  if (e.key === "Enter" && !areInputsDisabled()) lookupProfile();
});

$(".page.pageProfileSearch .search .button").on("click", () => {
  if (areInputsDisabled()) return;
  lookupProfile();
});

Skeleton.save("pageProfileSearch");
