import { UserEmailSchema } from "@monkeytype/schemas/users";
import { z } from "zod";

import { addAuthMethod } from "../../../auth/actions";
import { showSimpleModal } from "../../../states/simple-modal";
import { getPasswordSchema } from "../../ui/form/utils";

export function showAddPasswordAuthModal(): void {
  showSimpleModal({
    title: "Add password authentication",
    buttonText: "reauthenticate to add",
    schema: z.object({
      email: UserEmailSchema,
      emailConfirm: UserEmailSchema,
      password: getPasswordSchema({ isNew: true }),
      passConfirm: getPasswordSchema({ isNew: true }),
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

      await addAuthMethod({ method: "password", email, password });

      return {
        status: "success",
        showNotification: false,
      };
    },
  });
}
