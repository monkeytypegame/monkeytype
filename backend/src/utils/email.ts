import * as nodemailer from "nodemailer";
import Logger from "../utils/logger";
import fs from "fs";
import { join } from "path";
import { EmailType } from "../queues/email-queue";
import mjml2html from "mjml";

let transportInitialized = false;
let transporter: nodemailer.Transporter;

export function isInitialized(): boolean {
  return transportInitialized;
}

export async function init(): Promise<void> {
  if (isInitialized()) {
    return;
  }

  const { EMAIL_HOST, EMAIL_USER, EMAIL_PASS, MODE } = process.env;

  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    if (MODE === "dev") {
      Logger.warning("No email configuration provided. Running without email.");
      return;
    }
    throw new Error("No email configuration provided");
  }

  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    secure: true,
    port: 465,
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

export async function sendMail(
  to: string,
  subject: string,
  html: string
): Promise<MailResult> {
  if (!isInitialized()) {
    return {
      success: false,
      message: "Email transport not initialized",
    };
  }

  const mailOptions = {
    from: "Monkeytype <noreply@monkeytype.com>",
    to,
    subject,
    html,
  };

  const [err, info] = await transporter.sendMail(mailOptions);

  if (err) {
    return {
      success: false,
      message: err.message,
    };
  } else {
    return {
      success: true,
      message: info.messageId,
    };
  }
}

const EMAIL_TEMPLATES_DIRECTORY = join(
  __dirname,
  "../constants/email-templates"
);

const cachedTemplates: Record<string, string> = {};

function getTemplate(name: string): string {
  if (cachedTemplates[name]) {
    return cachedTemplates[name];
  }

  const template = fs.readFileSync(
    EMAIL_TEMPLATES_DIRECTORY + "/" + name,
    "utf-8"
  );

  const html = mjml2html(template, {
    minify: true,
  });

  cachedTemplates[name] = html;
  return template;
}

export function fillTemplate(type: EmailType, data: any[]): string {
  if (type === "verify") {
    return getTemplate("verification.html")
      .replace(/{{name}}/gim, data[0])
      .replace(/{{link}}/gim, data[1]);
  }
  return "Unknown email type";
}
