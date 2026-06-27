import { UserEmailSchema } from "@monkeytype/schemas/users";
import { z } from "zod";

import { addAuthProvider, getPasswordSchema } from "../../../auth";
import { showSimpleModal } from "../../../states/simple-modal";

export function showAddPasswordAuthModal(): void {
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

      await addAuthProvider({ authMethod: "password", email, password });

      return {
        status: "success",
        showNotification: false,
      };
    },
  });
}
