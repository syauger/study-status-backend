import { createMiddleware } from "hono/factory";
import { auth } from "@/lib/auth";
import type { AppVariables } from "@/lib/types";

export const authMiddleware = createMiddleware<{
  Bindings: Cloudflare.Env;
  Variables: AppVariables;
}>(async (c, next) => {
  const session = await auth(c.env).api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("session", session.session);
  c.set("user", session.user);

  return next();
});
