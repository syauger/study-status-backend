import { auth } from "@/lib/auth";
import { AppVariables } from "@/lib/types";
import { createMiddleware } from "hono/factory";

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
