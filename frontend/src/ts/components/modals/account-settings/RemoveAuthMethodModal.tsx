import { z } from "zod";

import { pickReauthMethod, removeAuthMethod } from "../../../auth/actions";
import {
  getAuthMethodDisplay,
  getThirdParties,
  hasOtherAuthMethods,
  isAuthenticated,
} from "../../../auth/state";
import { showNoticeNotification } from "../../../states/notifications";
import { showSimpleModal } from "../../../states/simple-modal";
import { getPasswordSchema } from "../../common/form/utils";

export function showRemoveAuthMethodModal(options: {
  /** a third party id, or `"password"` */
  authMethod: string;
}): void {
  if (!isAuthenticated()) return;

  //check there is at least one authentication remaining
  const hasRemainingAuth = hasOtherAuthMethods(options.authMethod);

  if (!hasRemainingAuth) {
    showNoticeNotification("No remaining authentication enabled");
    return;
  }

  const reauthMethod = pickReauthMethod(options.authMethod);
  if (reauthMethod === undefined) return;
  const withPassword = reauthMethod === "password";

  const methodDisplay = getAuthMethodDisplay(options.authMethod);

  showSimpleModal({
    title: `Remove ${methodDisplay} authentication`,
    buttonText:
      options.authMethod !== "password" ? "remove" : "reauthenticate to remove",
    buttonAlwaysEnabled: options.authMethod !== "password",
    schema: z.object({
      password: getPasswordSchema(),
      checked: z.literal(true),
    }),
    inputs: {
      password: {
        placeholder: "Password",
        type: "password",
        hidden: !withPassword,
      },
      checked: {
        type: "checkbox",
        label: `I understand I will lose access to my Monkeytype account if my ${getThirdParties()
          .map((it) => it.display)
          .join("/")} account is lost or disabled.`,
        hidden: options.authMethod !== "password",
      },
    },

    execFn: async ({ password }) => {
      // shows its own notifications
      const result = await removeAuthMethod(
        options.authMethod,
        withPassword
          ? { method: "password", password }
          : { method: reauthMethod },
      );
      return { status: result.status, showNotification: false };
    },
  });
}
