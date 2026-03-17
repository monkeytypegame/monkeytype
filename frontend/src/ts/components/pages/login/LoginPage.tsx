import { useQuery } from "@tanstack/solid-query";
import { JSXElement, Show } from "solid-js";

import { getServerConfigurationQueryOptions } from "../../../queries/server-configuration";
import { getActivePage } from "../../../states/core";
import { getLoginPageInputsEnabled } from "../../../states/login";
import { Conditional } from "../../common/Conditional";
import { Login } from "./Login";
import { Register } from "./Register";

export function LoginPage(): JSXElement {
  const isOpen = () => getActivePage() === "login";

  const serverConfig = useQuery(() => getServerConfigurationQueryOptions());
  const isSignUpDisabled = (): boolean =>
    !(serverConfig.data?.users.signUp ?? true);

  return (
    <Show when={isOpen()}>
      <Show when={!getLoginPageInputsEnabled()}>
        <div class="fixed top-1/2 left-1/2 z-1 -translate-x-1/2 -translate-y-1/2 text-3xl text-main transition-opacity duration-250">
          <i class="fas fa-fw fa-spin fa-circle-notch"></i>
        </div>
      </Show>
      <Conditional
        if={isSignUpDisabled()}
        then={
          <div class="grid h-full place-items-center">
            <p>
              Login/Signup is disabled or the server is down/under maintenance.
            </p>
          </div>
        }
        else={
          <div class="flex h-full flex-col items-center justify-around gap-4 md:flex-row">
            <Register />
            <Login />
          </div>
        }
      />
    </Show>
  );
}
