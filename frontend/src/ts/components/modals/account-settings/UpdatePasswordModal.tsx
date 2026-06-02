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

export function showUpdatePasswordModal(): void {
  if (!isAuthenticated()) return;
  if (!isUsingPasswordAuthentication()) {
    showNoticeNotification("Password authentication is not enabled");
  }
  showSimpleModal({
    title: "Update password",
    schema: z.object({
      previousPass: getPasswordSchema(),
      newPassword: getPasswordSchema(),
      newPassConfirm: getPasswordSchema(),
    }),
    inputs: {
      previousPass: {
        placeholder: "current password",
        type: "password",
      },
      newPassword: {
        placeholder: "new password",
        type: "password",
      },
      newPassConfirm: {
        placeholder: "confirm new password",
        type: "password",
      },
    },
    buttonText: "update",
    execFn: async ({ previousPass, newPassword, newPassConfirm }) => {
      if (newPassword !== newPassConfirm) {
        return {
          status: "notice",
          message: "New passwords don't match",
        };
      }

      if (newPassword === previousPass) {
        return {
          status: "notice",
          message: "New password must be different from previous password",
        };
      }

      const reauth = await reauthenticate({ password: previousPass });
      if (reauth.status !== "success") {
        return {
          status: reauth.status,
          message: reauth.message,
        };
      }

      const response = await Ape.users.updatePassword({
        body: { newPassword },
      });

      if (response.status !== 200) {
        return {
          status: "error",
          message: "Failed to update password",
          notificationOptions: { response },
        };
      }

      signOut();

      return {
        status: "success",
        message: "Password updated",
      };
    },
  });
}
