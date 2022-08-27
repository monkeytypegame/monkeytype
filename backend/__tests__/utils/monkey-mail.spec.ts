import { buildMonkeyMail } from "../../src/utils/monkey-mail";

const inboxConfig = {
  enabled: true,
  systemName: "Hey, I'm a system",
  maxMail: 10,
};

describe("Monkey Mail", () => {
  it("should properly create a mail object", () => {
    const mailConfig = {
      subject: "",
      body: "",
      timestamp: Date.now(),
      getTemplate: (): any => ({}),
    };

    const mail = buildMonkeyMail(mailConfig, inboxConfig) as any;

    expect(mail.id).toBeDefined();
    expect(mail.from).toBe("Hey, I'm a system");
    expect(mail.to).toBe("");
    expect(mail.subject).toBe("");
    expect(mail.body).toBe("");
    expect(mail.timestamp).toBeDefined();
    expect(mail.read).toBe(false);
    expect(mail.rewards).toEqual([]);
    expect(mail.getTemplate).toBeDefined();
  });
});
