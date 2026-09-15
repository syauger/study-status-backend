import { fromHono } from "chanfana";
import { Hono } from "hono";
import { TaskCreate } from "./endpoints/taskCreate";
import { TaskDelete } from "./endpoints/taskDelete";
import { TaskFetch } from "./endpoints/taskFetch";
import { TaskList } from "./endpoints/taskList";
import { auth } from "./lib/auth";

// Start a Hono app
const app = new Hono<{
  Bindings: Cloudflare.Env;
}>();

app.all("/api/auth/*", (c) => auth(c.env).handler(c.req.raw));

app.get("/api/test", (c) => c.text("Hello from Hono!"));

// // Setup OpenAPI registry
// const openapi = fromHono(app, {
//   docs_url: "/",
// });
//
// // Register OpenAPI endpoints
// openapi.get("/api/tasks", TaskList);
// openapi.post("/api/tasks", TaskCreate);
// openapi.get("/api/tasks/:taskSlug", TaskFetch);
// openapi.delete("/api/tasks/:taskSlug", TaskDelete);

// You may also register routes for non OpenAPI directly on Hono
// app.get('/test', (c) => c.text('Hono!'))

// Export the Hono app
export default app;
