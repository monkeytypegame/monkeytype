import { Router } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import {
  LocalLoginSchema,
  LocalRegisterSchema,
  LocalReauthSchema,
} from "@monkeytype/contracts/local-auth";
import * as LocalAuth from "../../services/local-auth";
import { isLocalAuth } from "../../utils/auth-provider";
import MonkeyError from "../../utils/error";
import { ExpressRequestWithContext } from "../types";

const router = Router();
router.use((req, res, next) => {
  if (!isLocalAuth()) {
    throw new MonkeyError(404, "Local authentication is disabled");
  }
  LocalAuth.verifyCsrf(req);
  res.setHeader("Cache-Control", "no-store");
  next();
});

const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? "127.0.0.1"),
  handler: () => {
    throw new MonkeyError(
      429,
      "Too many authentication attempts. Please try again later.",
    );
  },
});

router.post(
  "/register",
  passwordLimiter,
  async (req: ExpressRequestWithContext, res) => {
    if (!req.ctx.configuration.users.signUp) {
      throw new MonkeyError(503, "Registration is disabled");
    }
    const body = LocalRegisterSchema.safeParse(req.body);
    if (!body.success) {
      throw new MonkeyError(
        422,
        body.error.issues[0]?.message ?? "Invalid registration",
      );
    }
    const { name, email, password, rememberMe } = body.data;
    const uid = await LocalAuth.register(name, email, password);
    await LocalAuth.createSession(uid, rememberMe, req, res);
    res.json({ user: await LocalAuth.getUser(uid) });
  },
);
router.post("/login", passwordLimiter, async (req, res) => {
  const body = LocalLoginSchema.safeParse(req.body);
  if (!body.success) throw new MonkeyError(422, "Invalid login");
  const { uid, version } = await LocalAuth.login(
    body.data.email,
    body.data.password,
  );
  await LocalAuth.createSession(uid, body.data.rememberMe, req, res, version);
  res.json({ user: await LocalAuth.getUser(uid) });
});
router.get("/session", async (req, res) => {
  const session = await LocalAuth.getSession(req);
  res.json({ user: await LocalAuth.getUser(session.uid) });
});
router.post("/logout", async (req, res) => {
  await LocalAuth.logout(req, res);
  res.json({ message: "Logged out" });
});
router.post("/reauthenticate", passwordLimiter, async (req, res) => {
  const body = LocalReauthSchema.safeParse(req.body);
  if (!body.success) throw new MonkeyError(422, "Invalid password");
  await LocalAuth.reauthenticate(req, body.data.password);
  res.json({ message: "Password confirmed" });
});

export default router;
