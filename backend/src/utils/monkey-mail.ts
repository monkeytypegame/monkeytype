import { v4 } from "uuid";

interface MonkeyMailTemplate {
  from?: string;
  to?: string;
  subject?: string;
  body?: string;
}

export interface MonkeyMailWithTemplate extends MonkeyTypes.MonkeyMail {
  getTemplate?: (user: MonkeyTypes.User) => MonkeyMailTemplate;
}

type MonkeyMailOptions = Partial<Omit<MonkeyMailWithTemplate, "id" | "read">>;

export function buildMonkeyMail(
  options: MonkeyMailOptions,
  inboxConfig: MonkeyTypes.Configuration["users"]["inbox"]
): MonkeyMailWithTemplate {
  return {
    id: v4(),
    from: options.from || inboxConfig.systemName || "monkeytype",
    to: options.to || "",
    subject: options.subject || "",
    body: options.body || "",
    timestamp: options.timestamp || Date.now(),
    read: false,
    rewards: options.rewards || [],
    getTemplate: options.getTemplate,
  };
}
