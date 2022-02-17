import fetch from "node-fetch";
import "dotenv/config";

export async function verify(captcha) {
  if (process.env.MODE === "dev") return true;
  let response = await fetch(
    `https://www.google.com/recaptcha/api/siteverify`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${process.env.RECAPTCHA_SECRET}&response=${captcha}`,
    }
  );
  response = await response.json();
  return response?.success;
}
