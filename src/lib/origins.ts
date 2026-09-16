export const webOrigins = (env: Cloudflare.Env): string[] => [
  new URL(env.BETTER_AUTH_URL).origin,
  ...env.WEB_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];
