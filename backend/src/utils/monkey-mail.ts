import { v4 } from "uuid";

type MonkeyMailOptions = Partial<Omit<MonkeyMailWithTemplate, "id" | "read">>;
export interface MonkeyMailWithTemplate extends MonkeyTypes.MonkeyMail {
  getTemplate?: (user: MonkeyTypes.User) => MonkeyMailOptions;
}

export function buildMonkeyMail(
  options: MonkeyMailOptions
): MonkeyMailWithTemplate {
  return {
    id: v4(),
    subject: options.subject || "",
    body: options.body || "",
    timestamp: options.timestamp || Date.now(),
    read: false,
    rewards: options.rewards || [],
    getTemplate: options.getTemplate,
  };
}
