import { z } from "zod";
import { IdSchema } from "@monkeytype/schemas/util";
import {
  NewPasswordSchema,
  UserEmailSchema,
  UserNameSchema,
} from "@monkeytype/schemas/users";

export const LocalLoginSchema = z.object({
  email: UserEmailSchema.max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(64),
  rememberMe: z.boolean().default(false),
});
export const LocalRegisterSchema = LocalLoginSchema.extend({
  name: UserNameSchema,
  password: NewPasswordSchema,
});
export const LocalReauthSchema = LocalLoginSchema.pick({ password: true });

export const LocalAuthUserSchema = z.object({
  uid: IdSchema,
  email: z.string(),
  emailVerified: z.literal(false),
  providerData: z.array(
    z.object({
      uid: IdSchema,
      providerId: z.literal("password"),
      email: z.string(),
      displayName: z.string(),
      photoURL: z.null(),
      phoneNumber: z.null(),
    }),
  ),
});
export type LocalAuthUser = z.infer<typeof LocalAuthUserSchema>;
