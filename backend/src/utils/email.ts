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

  //the response here is this, not sure how to handle..
  // {
  //   accepted: [ 'themiodec@gmail.com' ],
  //   rejected: [],
  //   ehlo: [ 'AUTH LOGIN PLAIN', 'SIZE 53477376' ],
  //   envelopeTime: 174,
  //   messageTime: 200,
  //   messageSize: 13090,
  //   response: '250 Message received',
  //   envelope: { from: 'noreply@monkeytype.com', to: [ 'themiodec@gmail.com' ] },
  //   messageId: '<075d5d61-7e1e-88fd-39be-9803826196d9@monkeytype.com>'
  // }

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

function getTemplate(name: string): string {
  if (cachedTemplates[name]) {
    return cachedTemplates[name];
  }

  const template = fs.readFileSync(
    EMAIL_TEMPLATES_DIRECTORY + "/" + name,
    "utf-8"
  );

  const html = mjml2html(template).html;

  cachedTemplates[name] = html;
  return html;
}

export function fillTemplate(type: EmailType, data: any[]): string {
  if (type === "verify") {
    return getTemplate("verification.html")
      .replace(/{{name}}/gim, data[0])
      .replace(/{{link}}/gim, data[1]);
  }
  return "Unknown email type";
}
