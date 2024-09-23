import { MonkeyMail } from "@monkeytype/contracts/schemas/users";
import { v4 } from "uuid";

type MonkeyMailOptions = Partial<Omit<MonkeyMail, "id" | "read">>;

export function buildMonkeyMail(options: MonkeyMailOptions): MonkeyMail {
  return {
    id: v4(),
    subject: options.subject ?? "",
    body: options.body ?? "",
    timestamp: options.timestamp ?? Date.now(),
    read: false,
    rewards: options.rewards ?? [],
  };
}
