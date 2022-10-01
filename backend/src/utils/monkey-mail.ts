import { v4 } from "uuid";

type MonkeyMailOptions = Partial<Omit<MonkeyTypes.MonkeyMail, "id" | "read">>;

export function buildMonkeyMail(
  options: MonkeyMailOptions
): MonkeyTypes.MonkeyMail {
  return {
    id: v4(),
    subject: options.subject || "",
    body: options.body || "",
    timestamp: options.timestamp || Date.now(),
    read: false,
    rewards: options.rewards || [],
  };
}
