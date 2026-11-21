import { UserEmailSchema } from "@monkeytype/schemas/users";
import { z } from "zod";

import Ape from "../../../ape";
import { reauthenticate, signOut } from "../../../auth/actions";
import { isAuthenticated, isUsingPasswordAuth } from "../../../auth/state";
import { showNoticeNotification } from "../../../states/notifications";
import { showSimpleModal } from "../../../states/simple-modal";
import { getPasswordSchema } from "../../ui/form/utils";

export function showUpdateEmailModal(): void {
  if (!isAuthenticated()) return;
  if (!isUsingPasswordAuth()) {
    showNoticeNotification("Password authentication is not enabled");
    return;
  }

  showSimpleModal({
    title: "Update email",
    buttonText: "update",
    schema: z.object({
      password: getPasswordSchema(),
      email: UserEmailSchema,
      emailConfirm: UserEmailSchema,
    }),
    inputs: {
      password: {
        placeholder: "Password",
        type: "password",
      },
      email: {
        type: "text",
        placeholder: "New email",
      },
      emailConfirm: {
        type: "text",
        placeholder: "Confirm new email",
      },
    },

    execFn: async ({ password, email, emailConfirm }) => {
      if (email !== emailConfirm) {
        return {
          status: "notice",
          message: "Emails don't match",
        };
      }

      const reauth = await reauthenticate({ method: "password", password });
      if (reauth.status !== "success") {
        // reauthenticate already told the user
        return { status: reauth.status, showNotification: false };
      }

      const response = await Ape.users.updateEmail({
        body: {
          newEmail: email,
          previousEmail: reauth.user.email as string,
        },
      });

      if (response.status !== 200) {
        return {
          status: "error",
          message: "Failed to update email",
          notificationOptions: { response },
        };
      }

      signOut();

      return {
        status: "success",
        message: "Email updated",
      };
    },
  });
}
