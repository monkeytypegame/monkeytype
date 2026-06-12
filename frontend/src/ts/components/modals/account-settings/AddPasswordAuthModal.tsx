import { UserEmailSchema } from "@monkeytype/schemas/users";
import { EmailAuthProvider, linkWithCredential } from "firebase/auth";
import { z } from "zod";

import Ape from "../../../ape";
import { getPasswordSchema, reauthenticate } from "../../../auth";
import { showSimpleModal } from "../../../states/simple-modal";
import { createErrorMessage } from "../../../utils/error";

export function showAddPasswordAuthModal(options?: {
  callback?: () => void;
}): void {
  showSimpleModal({
    title: "Add password authentication",
    buttonText: "reauthenticate to add",
    schema: z.object({
      email: UserEmailSchema,
      emailConfirm: UserEmailSchema,
      password: getPasswordSchema(),
      passConfirm: getPasswordSchema(),
    }),
    inputs: {
      email: {
        placeholder: "email",
        type: "email",
      },
      emailConfirm: {
        placeholder: "confirm email",
        type: "email",
      },
      password: {
        placeholder: "new password",
        type: "password",
      },
      passConfirm: {
        placeholder: "confirm new password",
        type: "password",
      },
    },

    execFn: async ({ email, emailConfirm, password, passConfirm }) => {
      if (email !== emailConfirm) {
        return {
          status: "notice",
          message: "Emails don't match",
        };
      }

      if (password !== passConfirm) {
        return {
          status: "notice",
          message: "Passwords don't match",
        };
      }

      const reauth = await reauthenticate({ password });
      if (reauth.status !== "success") {
        return {
          status: reauth.status,
          message: reauth.message,
        };
      }

      try {
        const credential = EmailAuthProvider.credential(email, password);
        await linkWithCredential(reauth.user, credential);
      } catch (e) {
        const message = createErrorMessage(
          e,
          "Failed to add password authentication",
        );
        return {
          status: "error",
          message,
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
          message:
            "Password authentication added but updating the database email failed. This shouldn't happen, please contact support. Error",
          notificationOptions: { response },
        };
      }

      options?.callback?.();

      return {
        status: "success",
        message: "Password authentication added",
      };
    },
  });
}
