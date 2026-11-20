import { z } from "zod";

import Ape from "../../../ape";
import { reauthenticate, signOut } from "../../../auth/actions";
import { isAuthenticated, isUsingPasswordAuth } from "../../../auth/state";
import { showNoticeNotification } from "../../../states/notifications";
import { showSimpleModal } from "../../../states/simple-modal";
import { getPasswordSchema } from "../../ui/form/utils";

export function showUpdatePasswordModal(): void {
  if (!isAuthenticated()) return;
  if (!isUsingPasswordAuth()) {
    showNoticeNotification("Password authentication is not enabled");
    return;
  }
  showSimpleModal({
    title: "Update password",
    schema: z.object({
      previousPass: getPasswordSchema(),
      newPassword: getPasswordSchema({ isNew: true }),
      newPassConfirm: getPasswordSchema({ isNew: true }),
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

      const reauth = await reauthenticate({
        method: "password",
        password: previousPass,
      });
      if (reauth.status !== "success") {
        // reauthenticate already told the user
        return { status: reauth.status, showNotification: false };
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
