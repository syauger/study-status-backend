# StudyStatus API

StudyStatus's backend serves study locations, current weather, community reports, and email/password authentication. It uses Cloudflare Workers, Hono, Chanfana/OpenAPI, Drizzle, D1, and Better Auth. The Expo frontend lives in the companion `mobile` repo (see [its README](../mobile/README.md) when checked out alongside this repo).

## Run locally

Use Node.js 22 LTS or newer and npm. Run the following commands from the API repo root. Local development uses Wrangler's local D1 database; Cloudflare login and deployment are not part of this setup.

### 1. Install dependencies

```sh
npm ci
```

### 2. Configure authentication

Create `.dev.vars` in the API root with:

```dotenv
BETTER_AUTH_URL=http://localhost:8787
BETTER_AUTH_SECRET=replace-with-a-generated-secret
```

Generate a random secret and paste the output in place of the placeholder:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Keep the secret stable between local runs. `.dev.vars` is ignored by Git. Wrangler also supports `.env`, but if `.dev.vars` exists it takes precedence and `.env` values are not loaded into the Worker. Keep all local Worker secrets in one file. See [Cloudflare's environment documentation](https://developers.cloudflare.com/workers/local-development/environment-variables/).

`WEB_ORIGINS` is already configured in `wrangler.jsonc` for `localhost` and `127.0.0.1` on ports 8081 and 8088. To use another frontend origin, add an override to `.dev.vars`, retaining any origins you still use:

```dotenv
WEB_ORIGINS=http://localhost:8081,http://127.0.0.1:8081,http://localhost:8088,http://127.0.0.1:8088,http://192.168.1.100:8081
```

Replace the example LAN address with your computer's address. Origins include the scheme and port, with no path or trailing slash.

### 3. Initialize and seed the local database

```sh
npm run migrate:dev
npm run seed:dev
```

`migrate:dev` generates migrations from the Drizzle schema, then applies them locally. On an unchanged checkout it should find no schema changes to generate. `seed:dev` adds the five study locations described below. Rerun migrations after pulling schema changes and rerun the seed when seed data changes.

Wrangler persists local data under `.wrangler/state`; this is separate from production. No D1 connection string or database credentials belong in `.dev.vars`. The `DB` binding is supplied by `wrangler.jsonc`. The configured `R2` binding is not currently used by the routes. See [D1 local development](https://developers.cloudflare.com/d1/best-practices/local-development/).

### 4. Start the API

```sh
npm run dev
```

Open [the API documentation](http://localhost:8787/) and [the locations endpoint](http://localhost:8787/api/locations). The latter should return `success: true` and seeded locations. Keep this terminal running; Wrangler reloads source changes.

For a phone or Android emulator, expose the server on your network instead:

```sh
npm start
```

This runs `wrangler dev --ip 0.0.0.0`. Set `BETTER_AUTH_URL` to the same reachable API URL you will use in the frontend, then restart Wrangler:

| Client                                   | API URL                         |
| ---------------------------------------- | ------------------------------- |
| Browser on this computer / iOS simulator | `http://localhost:8787`         |
| Android Studio emulator                  | `http://10.0.2.2:8787`          |
| Physical phone                           | `http://<computer-LAN-IP>:8787` |

For a phone, use the same network and allow incoming connections to port 8787. `0.0.0.0` is a listening address, not a client URL.

### 5. Connect the frontend

In the companion `mobile` repo, install dependencies with `bun install --frozen-lockfile`, copy `.env.example` to `.env.local`, and **edit** it to set:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:8787
```

Use the appropriate API URL from the table, without `/api` at the end. The checked-in frontend example currently contains a specific LAN address, so copying it alone is not sufficient. Start the frontend with `bun run web --port 8081` for desktop web, or follow the [mobile setup](../mobile/README.md) for native platforms. Restart Expo and reload the app after changing its environment file.

Open a study location, register an account, and create a report to verify the complete flow. Browsing locations and reports does not require an account.

## Troubleshooting

- **No locations / database errors:** apply local migrations, then run `npm run seed:dev` from this repo. Ensure the server and migrations use the same persistence directory.
- **Network request failed:** open `/api/locations` using the configured API URL on the client device. Check the hostname, firewall, API process, and port. A phone's `localhost` points to the phone.
- **Sign-in or report creation fails:** check `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and the exact browser origin in `WEB_ORIGINS`. For desktop web, use `localhost` consistently for both frontend and API (or `127.0.0.1` consistently). Restart Wrangler after environment changes.
- **Weather unavailable:** the API needs outbound internet access to Open-Meteo; this route requires no weather API key.

## Project structure and checks

- `src/index.ts`: routes, CORS, and OpenAPI documentation at `/`.
- `src/endpoints/`: location, weather, and report handlers.
- `src/db/` and `drizzle/`: database schemas and SQL migrations.
- `src/lib/auth.ts`: runtime Better Auth configuration.
- `scripts/seed-locations.sql`: study location seed data.
- `tests/reports.integration.test.mjs`: local HTTP integration tests.

```sh
npm run check
npm run cf-typegen
```

`check` runs Ultracite (Oxlint/Oxfmt). Run `cf-typegen` after changing Wrangler bindings. Integration test instructions are below.

## Deploy to Cloudflare

Deployment is separate from local setup. You need access to the Cloudflare account and the D1/R2 resources in `wrangler.jsonc`, or must replace them with your own resources. Configure the deployed `BETTER_AUTH_URL` and `WEB_ORIGINS` in Wrangler's `vars`, and provision a separate production secret:

```sh
npx wrangler login
npx wrangler secret put BETTER_AUTH_SECRET
npm run migrate:prod
npm run seed:prod
npm run deploy
```

The `:prod` commands modify the remote database. Local `.dev.vars` / `.env` values are not deployment configuration. Set the frontend's `EXPO_PUBLIC_API_URL` to the deployed HTTPS origin before bundling it.

## Seed study locations

Apply migrations and seed the local D1 database from the API directory:

```sh
npm run migrate:dev
npm run seed:dev
```

To seed the deployed database instead, apply its migrations with `npm run migrate:prod`, then run `npm run seed:prod`. This writes to the remote `DB` database configured in `wrangler.jsonc`.

The seed file, `scripts/seed-locations.sql`, adds Clough Undergraduate Learning Commons, Price Gilbert Memorial Library, Crosland Tower, John Lewis Student Center, and Kendeda Building. These study spaces are described in Georgia Tech's [campus guide](https://news.gatech.edu/features/2024/08/first-year-survival-tips) and [SGA study guide](https://www.sga.gatech.edu/studyhive-a-guide-to-study-spots-on-and-off-campus/). Coordinates are approximate building locations, not precise entrances or study rooms.

Rerunning the seed matches exact names and refreshes their descriptions, amenities, hours, and expected noise levels, preserving existing coordinates, IDs, timestamps, and associated check-ins. Renaming a seeded location means the next run will insert its original name again. The seed supplies creation timestamps in Unix seconds to match the location schema and lets the database assign IDs.

Locations include `description` and `amenities`, both non-null text fields defaulting to an empty string for existing records. `amenities` stores lowercase comma-separated features, for example `wifi,coffee,outdoor,seating`. Apply the new migration before rerunning the seed to populate these fields on previously seeded rows. The location list API returns both fields.

Seed feature references: [Clough Commons](https://library.gatech.edu/clough), [library study spaces](https://library.gatech.edu/study-spaces), [library printing](https://library.gatech.edu/computing), [Student Center coffee](https://dining.gatech.edu/node/7), and [Kendeda outdoor learning areas](https://livingbuilding.gatech.edu/about). `wifi` refers to [campus wireless access](https://www.studentcenter.gatech.edu/connecting-to-campus-wifi), not guaranteed coverage at every outdoor seat. Building access and room availability depend on campus policies and operating hours.

### Hours and expected noise

The location API also returns:

- `hours`: a JSON object with all seven lowercase weekday keys (`monday` through `sunday`), `timezone`, and `notes`. Daily values are display strings: `24 hours`, `closed`, or a local 24-hour range such as `07:00-22:00`. The timezone is `America/New_York` for these seeds. `null` means hours have not been supplied; it does not mean closed.
- `noiseLevel`: `unknown`, `quiet`, `conversational`, `lively`, or `mixed`. The database column is `noise_level`. Existing unseeded locations default to `unknown`.

Apply migrations, then rerun the seed to populate both fields. Hours describe student building access during the regular semester, including BuzzCard access, rather than service-desk or coffee-shop hours. Read the access notes alongside the daily schedule; breaks, holidays, and individual outdoor spaces may have different hours.

Sources checked September 15, 2026: [Library hours](https://library.gatech.edu/about/hours), [regular-semester library access](https://sites.gatech.edu/bfhandbook/georgia-techs-library-and-information-center/), [Student Center hours and after-hours BuzzCard access](https://studentcenter.gatech.edu/hours), and [Kendeda hours](https://livingbuilding.gatech.edu/visit). Kendeda's published schedule is still labeled spring/fall 2025; its seed notes explicitly flag that it has not been confirmed for 2026.

Noise categories are editorial expectations, not measured sound levels or building-wide rules. Clough is `conversational`, the Student Center `lively`, and Kendeda `quiet` (study-area estimate; classes and events can be louder). Price Gilbert and Crosland are `mixed` because they contain both [collaborative and quiet spaces](https://library.gatech.edu/study-spaces); Crosland's upper floors include designated quiet study areas.

### Public location endpoints

- `GET /api/locations?page=0` returns `{ success, locations, nextPage }` with up to 10 locations ordered by ID. Follow `nextPage` until it is `null`.
- `GET /api/locations/:locationId` returns `{ success, location }`; missing IDs return HTTP 404. Invalid IDs/pages return HTTP 400 and database failures return HTTP 500 instead of an empty successful list.

These read-only endpoints are public and allow cross-origin GET requests for the Expo web client. They are registered before report authentication middleware.

## Reports and authentication

Report reads are public. `GET /api/reports?locationId=1` returns up to 10 reports, newest first, plus `nextCursor`. Fetch older reports by passing `before=<nextCursor>` with the same location filter. `GET /api/reports/:reportId` returns one report. Public responses include the author's display name, not email or session data.

`POST /api/reports` requires a Better Auth session and accepts `locationId`, `crowdLevel` (`empty`, `moderate`, or `busy`), and an optional `comment` (up to 1,000 characters). The author is taken from the session. Success returns HTTP 201; invalid input, missing sessions, and missing locations return 400, 401, and 404.

Email/password registration, sign-in, and sign-out use `/api/auth/*`. Set `BETTER_AUTH_URL` to the API URL reachable by your clients, and configure `WEB_ORIGINS` in `wrangler.jsonc` (or an environment override) with the exact comma-separated web frontend origins. Local Expo web ports 8081 and 8088 are included by default; add your LAN web origin if testing web from another device. The `studystatus://` native app scheme is trusted through the Better Auth Expo plugin. Browser requests use cookies; native requests forward the cookie stored by the Expo auth client. Production web/API hosts should use a compatible same-site cookie setup and an explicit production origin list.

### Local report integration tests

These tests create disposable accounts and reports. Use a separate local DB:

```sh
npx wrangler d1 migrations apply DB --local --persist-to /tmp/study-status-report-tests
npx wrangler d1 execute DB --local --persist-to /tmp/study-status-report-tests --file scripts/seed-locations.sql
npx wrangler dev --port 8790 --persist-to /tmp/study-status-report-tests --var BETTER_AUTH_URL:http://localhost:8790
# In another terminal:
node --test tests/reports.integration.test.mjs
```

The suite covers guest access, registration, sign-in/sign-out, native cookie requests, author attribution, pagination during new inserts, validation, and CORS.
