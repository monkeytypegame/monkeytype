import * as nodemailer from "nodemailer";
import Logger from "../utils/logger";
import fs from "fs";
import { join } from "path";
import mjml2html from "mjml";
import mustache from "mustache";
import { recordEmail } from "../utils/prometheus";

let transportInitialized = false;
let transporter: nodemailer.Transporter;

export function isInitialized(): boolean {
  return transportInitialized;
}

export async function init(): Promise<void> {
  if (isInitialized()) {
    return;
  }

  const { EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_PORT, MODE } = process.env;

  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    if (MODE === "dev") {
      Logger.warning("No email configuration provided. Running without email.");
      return;
    }
    throw new Error("No email configuration provided");
  }

  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    secure: EMAIL_PORT === "465" ? true : false,
    port: parseInt(EMAIL_PORT ?? "578", 10),
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  try {
    Logger.info("Verifying email configuration...");
    const result = await transporter.verify();

    if (result !== true) {
      throw new Error(
        `Could not verify email configuration: ` + JSON.stringify(result)
      );
    }

    Logger.success("Email client configuration verified");
    transportInitialized = true;
  } catch (error) {
    Logger.error(error.message);
    if (MODE === "dev") {
      Logger.warning(
        `Failed to verify email configuration. Continuing in dev mode, running without email.`
      );
    } else {
      Logger.error(
        "Failed to verify email configuration. Exiting with exit status code 1."
      );
      process.exit(1);
    }
  }
}

interface MailResult {
  success: boolean;
  message: string;
}

export async function sendMailUsingTemplate<M extends MonkeyTypes.EmailType>(
  templateName: MonkeyTypes.EmailType,
  to: string,
  subject: string,
  data: MonkeyTypes.EmailTaskContexts[M]
): Promise<MailResult> {
  if (!isInitialized()) {
    return {
      success: false,
      message: "Email client transport not initialized",
    };
  }

  const template = await fillTemplate<typeof templateName>(templateName, data);

  console.log(template);

  const mailOptions = {
    from: "Monkeytype <noreply@monkeytype.com>",
    to,
    subject,
    html: template,
  };

  const result = await transporter.sendMail(mailOptions);

  recordEmail(templateName, result.accepted.length === 0 ? "fail" : "success");

  if (result.accepted.length === 0) {
    return {
      success: false,
      message: result.response,
    };
  } else {
    return {
      success: true,
      message: result.response,
    };
  }
}

export async function sendMail(
  to: string,
  subject: string,
  html: string
): Promise<MailResult> {
  if (!isInitialized()) {
    return {
      success: false,
      message: "Email client transport not initialized",
    };
  }

  const mailOptions = {
    from: "Monkeytype <noreply@monkeytype.com>",
    to,
    subject,
    html,
  };

  const result = await transporter.sendMail(mailOptions);

  recordEmail("-", result.accepted.length === 0 ? "fail" : "success");

  if (result.accepted.length === 0) {
    return {
      success: false,
      message: result.response,
    };
  } else {
    return {
      success: true,
      message: result.response,
    };
  }
}

const EMAIL_TEMPLATES_DIRECTORY = join(__dirname, "../email-templates");

const cachedTemplates: Record<string, string> = {};

async function getTemplate(name: string): Promise<string> {
  if (cachedTemplates[name]) {
    return cachedTemplates[name];
  }

  const template = await fs.promises.readFile(
    EMAIL_TEMPLATES_DIRECTORY + "/" + name,
    "utf-8"
  );

  const html = mjml2html(template).html;

  cachedTemplates[name] = html;
  return html;
}

async function fillTemplate<M extends MonkeyTypes.EmailType>(
  type: M,
  data: MonkeyTypes.EmailTaskContexts[M]
): Promise<string> {
  if (type === "verify") {
    const template = await getTemplate("verification.html");
    return mustache.render(template, data);
  }
  return "Unknown email type";
}
