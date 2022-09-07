import { buildMonkeyMail } from "../../src/utils/monkey-mail";

describe("Monkey Mail", () => {
  it("should properly create a mail object", () => {
    const mailConfig = {
      subject: "",
      body: "",
      timestamp: Date.now(),
    };

    const mail = buildMonkeyMail(mailConfig) as any;

    expect(mail.id).toBeDefined();
    expect(mail.subject).toBe("");
    expect(mail.body).toBe("");
    expect(mail.timestamp).toBeDefined();
    expect(mail.read).toBe(false);
    expect(mail.rewards).toEqual([]);
  });
});
