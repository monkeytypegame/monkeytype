// The app's router instance: real auth and query client, the router type
// registration, and app-only side effects (title, og:url, focus, ads).
// Importing it creates the router - tests use createAppRouter instead

import * as AdController from "../controllers/ad-controller";
import { authEvent } from "../events/auth";
import { isAuthAvailable } from "../firebase";
import { queryClient } from "../queries";
import { isAuthenticated } from "../states/core";
import { getRoutePage, PageName } from "../states/router";
import * as Focus from "../test/focus";
import { updateTitle } from "../utils/misc";
import { capitalizeFirstLetterOfEachWord } from "../utils/strings";
import { setRouter } from "./navigate";
import { createRouterAuth } from "./create-router-auth";
import { createAppRouter } from "./create-router";

const auth = createRouterAuth({
  isAvailable: isAuthAvailable,
  isSignedIn: isAuthenticated,
});

authEvent.subscribe((event) => {
  if (event.type !== "authStateChanged") return;
  auth.stateChanged(
    event.data.isUserSignedIn
      ? {
          download: event.data.loadPromise,
          redownload: event.data.reloadUserData,
        }
      : undefined,
  );
});

export const router = createAppRouter({ queryClient, auth });

declare module "@tanstack/solid-router" {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- module augmentation needs an interface
  interface Register {
    router: typeof router;
  }
}

setRouter(router);

let isInitialLoad = true;
let prevPage: PageName = "loading";

router.subscribe("onResolved", () => {
  updateOpenGraphUrl();

  if (isInitialLoad) {
    isInitialLoad = false;
    document.body.classList.remove("loading");
  }

  const page = getRoutePage();
  if (page === prevPage) return;
  prevPage = page;

  updatePageTitle(page);
  Focus.set(false);
  void AdController.reinstate();
});

function updatePageTitle(page: PageName): void {
  if (page === "test") {
    updateTitle();
  } else {
    updateTitle(`${capitalizeFirstLetterOfEachWord(page)} | Monkeytype`);
  }
}

function updateOpenGraphUrl(): void {
  let tag = document.querySelector('meta[property="og:url"]');
  if (tag === null) {
    tag = document.createElement("meta");
    tag.setAttribute("property", "og:url");
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", window.location.href);
}
