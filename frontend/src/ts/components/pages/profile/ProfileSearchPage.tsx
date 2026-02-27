import { UserNameSchema } from "@monkeytype/schemas/users";
import { createSignal, JSXElement, Show } from "solid-js";

import * as NavigationEvent from "../../../observables/navigation-event";
import { queryClient } from "../../../queries";
import { getUserProfile } from "../../../queries/profile";
import {
  getActivePage,
  getSelectedProfileName,
  setSelectedProfileName,
} from "../../../signals/core";
import { Button } from "../../common/Button";
import { H2 } from "../../common/Headers";
import { ValidatedInput } from "../../ui/ValidatedInput";

export function ProfileSearchPage(): JSXElement {
  const [isValid, setValid] = createSignal(false);
  const isOpen = () => getActivePage() === "profileSearch";

  const goToPage = () => {
    if (isValid()) {
      NavigationEvent.dispatch(`/profile/${getSelectedProfileName()}`, {});
    }
  };

  return (
    <Show when={isOpen()}>
      <div class="grid min-h-full place-items-center">
        <form
          class="inline-grid w-96 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            goToPage();
          }}
        >
          <div class="text-center">
            <H2 class="text-2xl" text="Profile lookup" />
          </div>

          <div class="flex w-full gap-2 text-xl">
            <div class="flex-1 text-center">
              <ValidatedInput
                placeholder="username"
                schema={UserNameSchema}
                callback={(result) => setValid(result.success)}
                // fine unless we read a reactive state after the await
                // eslint-disable-next-line solid/reactivity
                isValid={async (name: string) => {
                  try {
                    const result = await queryClient.fetchQuery(
                      getUserProfile(name),
                    );
                    setSelectedProfileName(name);
                    return result !== null || "Unknown user";
                  } catch (e) {
                    return "Unknown user or error fetching.";
                  }
                }}
              />
            </div>
            <div class="text-center">
              <Button
                class="shrink"
                fa={{ icon: "fa-chevron-right", fixedWidth: true }}
                disabled={!isValid()}
                onClick={() => goToPage()}
              />
            </div>
          </div>
        </form>
      </div>
    </Show>
  );
}
