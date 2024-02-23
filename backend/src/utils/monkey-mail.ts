import { v4 } from "uuid";

type MonkeyMailOptions = Partial<Omit<SharedTypes.MonkeyMail, "id" | "read">>;

export function buildMonkeyMail(
  options: MonkeyMailOptions
): SharedTypes.MonkeyMail {
  return {
    id: v4(),
    subject: options.subject ?? "",
    body: options.body ?? "",
    timestamp: options.timestamp ?? Date.now(),
    read: false,
    rewards: options.rewards ?? [],
  };
}
