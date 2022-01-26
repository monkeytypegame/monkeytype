const pathOverride = process.env.API_PATH_OVERRIDE;
const BASE_ROUTE = pathOverride ? `/${pathOverride}` : "";

const API_ROUTE_MAP = {
  "/user": require("./user"),
  "/config": require("./config"),
  "/results": require("./result"),
  "/presets": require("./preset"),
  "/quote-ratings": require("./quote-ratings"),
  "/psa": require("./psa"),
  "/leaderboard": require("./leaderboards"),
  "/new-quotes": require("./new-quotes"),
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

module.exports = addApiRoutes;
