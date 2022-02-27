import fetch from "node-fetch";
import "dotenv/config";

export async function verify(captcha) {
  if (process.env.MODE === "dev") return true;
  const response = await fetch(
    `https://www.google.com/recaptcha/api/siteverify`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${process.env.RECAPTCHA_SECRET}&response=${captcha}`,
    }
  );
  const responseJSON = await response.json();
  return responseJSON?.success;
}
