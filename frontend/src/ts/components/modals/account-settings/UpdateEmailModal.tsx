import { UserEmailSchema } from "@monkeytype/schemas/users";
import { z } from "zod";

import Ape from "../../../ape";
import { signOut } from "../../../auth";
import { isAuthenticated } from "../../../states/core";
import { showNoticeNotification } from "../../../states/notifications";
import { showSimpleModal } from "../../../states/simple-modal";
import {
  getPasswordSchema,
  isUsingPasswordAuthentication,
  reauthenticate,
} from "../../../utils/firebase-auth";

export function showUpdateEmailModal(): void {
  if (!isAuthenticated()) return;
  if (!isUsingPasswordAuthentication()) {
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

      const reauth = await reauthenticate({ password });
      if (reauth.status !== "success") {
        return {
          status: reauth.status,
          message: reauth.message,
        };
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
