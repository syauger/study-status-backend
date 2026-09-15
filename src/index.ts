import { fromHono } from "chanfana";
import { Hono } from "hono";
import { reportsEndpoints } from "@/endpoints/reports";
import { auth } from "@/lib/auth";
import { authMiddleware } from "@/middleware/auth";

const app = new Hono<{
  Bindings: Cloudflare.Env;
}>();

app.all("/api/auth/*", (c) => auth(c.env).handler(c.req.raw));

const openapi = fromHono(app, {
  docs_url: "/",
});

openapi.get("/api/reports", reportsEndpoints.list);
openapi.post("/api/reports", reportsEndpoints.create).use(authMiddleware);
openapi.get("/api/reports/:reportId", reportsEndpoints.get);

export default app;
