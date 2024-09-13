import { Response, Router } from "express";

const router = Router();

const root = __dirname + "../../../static";

router.use("/internal", (req, res) => {
  setCsp(res);
  res.sendFile("api/internal.html", { root });
});

router.use("/internal.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.sendFile("api/openapi.json", { root });
});

router.use(["/public", "/"], (req, res) => {
  setCsp(res);
  res.sendFile("api/public.html", { root });
});

router.use("/public.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.sendFile("api/public.json", { root });
});

export default router;

function setCsp(res: Response): void {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self';base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' monkeytype.com cdn.redoc.ly data:;object-src 'none';script-src 'self' cdn.redoc.ly 'unsafe-inline'; worker-src blob: data;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"
  );
}
