# Cloudflare Workers OpenAPI 3.1

This is a Cloudflare Worker with OpenAPI 3.1 using [chanfana](https://github.com/cloudflare/chanfana) and [Hono](https://github.com/honojs/hono).

This is an example project made to be used as a quick start into building OpenAPI compliant Workers that generates the `openapi.json` schema automatically from code and validates the incoming request to the defined parameters or request body.

## Get started

1. Sign up for [Cloudflare Workers](https://workers.dev). The free tier is more than enough for most use cases.
2. Clone this project and install dependencies with `npm install`
3. Run `wrangler login` to login to your Cloudflare account in wrangler
4. Run `wrangler deploy` to publish the API to Cloudflare Workers

## Project structure

1. Your main router is defined in `src/index.ts`.
2. Each endpoint has its own file in `src/endpoints/`.
3. For more information read the [chanfana documentation](https://chanfana.pages.dev/) and [Hono documentation](https://hono.dev/docs).

## Development

1. Run `wrangler dev` to start a local instance of the API.
2. Open `http://localhost:8787/` in your browser to see the Swagger interface where you can try the endpoints.
3. Changes made in the `src/` folder will automatically trigger the server to reload, you only need to refresh the Swagger interface.

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
