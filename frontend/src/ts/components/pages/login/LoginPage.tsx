import { useQuery } from "@tanstack/solid-query";
import { JSXElement, Show } from "solid-js";

import { isLocalAuth } from "../../../firebase";
import { getServerConfigurationQueryOptions } from "../../../queries/server-configuration";
import { getLoginPageInputsEnabled } from "../../../states/login";
import { Fa } from "../../common/Fa";
import { Page } from "../../common/Page";
import { Login } from "./Login";
import { Register } from "./Register";

export function LoginPage(): JSXElement {
  const serverConfig = useQuery(() => getServerConfigurationQueryOptions());
  const isSignUpDisabled = (): boolean =>
    !(serverConfig.data?.users.signUp ?? true) && !isLocalAuth();

  return (
    <Page id="login">
      <Show when={!getLoginPageInputsEnabled()}>
        <div class="fixed top-1/2 left-1/2 z-1 -translate-x-1/2 -translate-y-1/2 text-3xl text-main transition-opacity duration-250">
          <Fa icon="fa-circle-notch" class="animate-spin" />
        </div>
      </Show>
      <Show
        when={isSignUpDisabled()}
        fallback={
          <div class="flex h-full flex-col items-center justify-around gap-4 md:flex-row">
            <Show
              when={serverConfig.data?.users.signUp ?? true}
              fallback={
                <p class="text-sub">
                  Registration is disabled on this instance.
                </p>
              }
            >
              <Register />
            </Show>
            <Login />
          </div>
        }
      >
        <div class="grid h-full place-items-center">
          <p>
            Login/Signup is disabled or the server is down/under maintenance.
          </p>
        </div>
      </Show>
    </Page>
  );
}
