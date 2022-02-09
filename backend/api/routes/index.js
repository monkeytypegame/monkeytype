import user from "./user";
import config from "./config";
import result from "./result";
import preset from "./preset";
import psa from "./psa";
import leaderboards from "./leaderboards";
import quotes from "./quotes";

const pathOverride = process.env.API_PATH_OVERRIDE;
const BASE_ROUTE = pathOverride ? `/${pathOverride}` : "";

const API_ROUTE_MAP = {
  "/user": user,
  "/config": config,
  "/results": result,
  "/presets": preset,
  "/psa": psa,
  "/leaderboard": leaderboards,
  "/quotes": quotes,
};

function addApiRoutes(app) {
  app.get("/", (req, res) => {
    res.status(200).json({ message: "OK" });
  });

  Object.keys(API_ROUTE_MAP).forEach((route) => {
    const apiRoute = `${BASE_ROUTE}${route}`;
    const router = API_ROUTE_MAP[route];
    app.use(apiRoute, router);
  });
}

export default addApiRoutes;
