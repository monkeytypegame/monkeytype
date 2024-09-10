import * as nodemailer from "nodemailer";
import Logger from "../utils/logger";
import fs from "fs";
import { join } from "path";
import mjml2html from "mjml";
import mustache from "mustache";
import { recordEmail } from "../utils/prometheus";
import type { EmailTaskContexts, EmailType } from "../queues/email-queue";
import { isDevEnvironment } from "../utils/misc";

type EmailMetadata = {
  subject: string;
  templateName: string;
};

const templates: Record<EmailType, EmailMetadata> = {
  verify: {
    subject: "Verify your Monkeytype account",
    templateName: "verification.html",
  },
  resetPassword: {
    subject: "Reset your Monkeytype password",
    templateName: "reset-password.html",
  },
};

let transportInitialized = false;
let transporter: nodemailer.Transporter;

export function isInitialized(): boolean {
  return transportInitialized;
}

export async function init(): Promise<void> {
  if (isInitialized()) {
    return;
  }

  const { EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_PORT } = process.env;

  if (!(EMAIL_HOST ?? "") || !(EMAIL_USER ?? "") || !(EMAIL_PASS ?? "")) {
    if (isDevEnvironment()) {
      Logger.warning(
        "No email client configuration provided. Running without email."
      );
      return;
    }
    throw new Error("No email client configuration provided");
  }

  try {
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      secure: EMAIL_PORT === "465" ? true : false,
      port: parseInt(EMAIL_PORT ?? "578", 10),
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
    transportInitialized = true;

    Logger.info("Verifying email client configuration...");
    const result = await transporter.verify();

    if (!result) {
      throw new Error(
        `Could not verify email client configuration: ` + JSON.stringify(result)
      );
    }

    Logger.success("Email client configuration verified");
  } catch (error) {
    transportInitialized = false;
    Logger.error(error.message as string);
    Logger.error("Failed to verify email client configuration.");
  }
}

type MailResult = {
  success: boolean;
  message: string;
};

export async function sendEmail(
  templateName: EmailType,
  to: string,
  data: EmailTaskContexts[EmailType]
): Promise<MailResult> {
  if (!isInitialized()) {
    return {
      success: false,
      message: "Email client transport not initialized",
    };
  }

  const template = await fillTemplate<typeof templateName>(templateName, data);

  const mailOptions = {
    from: "Monkeytype <noreply@monkeytype.com>",
    to,
    subject: templates[templateName].subject,
    html: template,
  };

  let result;
  try {
    result = await transporter.sendMail(mailOptions);
  } catch (e) {
    recordEmail(templateName, "fail");
    return {
      success: false,
      message: e.message,
    };
  }

  recordEmail(templateName, result.accepted.length === 0 ? "fail" : "success");

  return {
    success: result.accepted.length !== 0,
    message: result.response,
  };
}

const EMAIL_TEMPLATES_DIRECTORY = join(__dirname, "../../email-templates");

const cachedTemplates: Record<string, string> = {};

async function getTemplate(name: string): Promise<string> {
  const cachedTemp = cachedTemplates[name];
  if (cachedTemp !== undefined) {
    return cachedTemp;
  }

  const template = await fs.promises.readFile(
    `${EMAIL_TEMPLATES_DIRECTORY}/${name}`,
    "utf-8"
  );

  const html = mjml2html(template).html;

  cachedTemplates[name] = html;
  return html;
}

async function fillTemplate<M extends EmailType>(
  type: M,
  data: EmailTaskContexts[M]
): Promise<string> {
  const template = await getTemplate(templates[type].templateName);
  return mustache.render(template, data);
}
