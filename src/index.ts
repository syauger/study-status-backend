import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { locationsEndpoints } from "@/endpoints/locations";
import { reportsEndpoints } from "@/endpoints/reports";
import { auth } from "@/lib/auth";
import { webOrigins } from "@/lib/origins";
import { authMiddleware } from "@/middleware/auth";

const app = new Hono<{
  Bindings: Cloudflare.Env;
}>();

const sessionCors = cors({
  origin: (origin, c) => (webOrigins(c.env).includes(origin) ? origin : ""),
  credentials: true,
  allowHeaders: ["Content-Type"],
  allowMethods: ["GET", "POST", "OPTIONS"],
});
app.use("/api/auth/*", sessionCors);
app.use("/api/reports", sessionCors);
app.use("/api/reports/*", sessionCors);

app.all("/api/auth/*", (c) => auth(c.env).handler(c.req.raw));

const openapi = fromHono(app, {
  docs_url: "/",
});

// Location and report reads are public.
app.use(
  "/api/locations",
  cors({ origin: "*", allowMethods: ["GET", "OPTIONS"] })
);
app.use(
  "/api/locations/*",
  cors({ origin: "*", allowMethods: ["GET", "OPTIONS"] })
);
openapi.get("/api/locations", locationsEndpoints.list);
openapi.get("/api/locations/:locationId", locationsEndpoints.get);

openapi.get("/api/reports", reportsEndpoints.list);
app.post(
  "/api/reports",
  (c, next) => {
    const origin = c.req.header("Origin");
    if (origin && !webOrigins(c.env).includes(origin)) {
      return c.json({ success: false, error: "Origin not allowed" }, 403);
    }
    return next();
  },
  authMiddleware
);
openapi.post("/api/reports", reportsEndpoints.create);
openapi.get("/api/reports/:reportId", reportsEndpoints.get);

export default app;
