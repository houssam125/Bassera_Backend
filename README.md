# Bassera Backend

Express + TypeScript API for the Bassera Agency site.

## Requirements

- Node.js 20+ (developed on 22.x)

## Setup

```bash
npm install
cp .env.example .env      # then set DATABASE_URL and other values
npm run prisma:migrate    # create the database schema
npm run dev
```

## Scripts

| Script                   | Description                                              |
| ------------------------ | ------------------------------------------------------- |
| `npm run dev`            | Start with **nodemon** + ts-node, auto-restart on change (frees `PORT` first) |
| `npm run free-port`      | Kill whatever is listening on `PORT` (fixes `EADDRINUSE`) |
| `npm run build`          | `prisma generate` + compile TypeScript to `dist/`       |
| `npm start`              | Run the compiled server from `dist/`                    |
| `npm run typecheck`      | Type-check without emitting                             |
| `npm run clean`          | Remove `dist/`                                          |
| `npm run prisma:generate`| Regenerate the Prisma client                            |
| `npm run prisma:migrate` | Create & apply a dev migration (`prisma migrate dev`)   |
| `npm run prisma:deploy`  | Apply pending migrations in prod (`prisma migrate deploy`) |
| `npm run prisma:studio`  | Open Prisma Studio                                      |
| `npm run db:seed`        | Insert sample portfolio projects (`-- --reset` to wipe first) |
| `npm run create-admin`   | Create / reset a full-access `owner` account (`-- --email … --password … --name …`) |

## Environment

| Variable                | Default                  | Description                          |
| ----------------------- | ------------------------ | ----------------------------------- |
| `PORT`                  | `4000`                   | HTTP port                           |
| `NODE_ENV`              | `development`            | `development` \| `production` \| `test` |
| `CORS_ORIGIN`           | `http://localhost:5173`  | Comma-separated allowed origins     |
| `DATABASE_URL`          | —                        | PostgreSQL connection string (Prisma). Local dev against Render: use the **External** Database URL with `?sslmode=require`. |
| `JWT_ACCESS_SECRET`     | —                        | HS256 signing secret for access tokens (32+ random bytes) |
| `JWT_ACCESS_TTL`        | `900`                    | Access-token lifetime, seconds     |
| `REFRESH_TOKEN_TTL`     | `2592000`                | Refresh-session lifetime, seconds (30d) |
| `REFRESH_COOKIE_NAME`   | `bassera_rt`             | Name of the httpOnly refresh cookie |
| `BCRYPT_COST`           | `12`                     | bcrypt work factor for password hashing |
| `BOOTSTRAP_ADMIN_EMAIL` | —                        | First account registered with this email becomes `owner` / `active` (skips approval) |
| `RATE_LIMIT_WINDOW_MS`  | `900000`                 | Window for the global `/api/*` limiter |
| `RATE_LIMIT_MAX`        | `300`                    | Requests per window per IP for `/api/*` |
| `REDIS_URL`             | —                        | Optional — shared rate-limit store when running >1 instance |
| `MEDIA_DRIVER`          | `local`                  | `local` \| `s3` \| `cloudinary` (only `local` implemented) |
| `MEDIA_MAX_BYTES`       | `5242880`                | Max upload size (5 MB)             |
| `MEDIA_PUBLIC_BASE_URL` | `http://localhost:4000/uploads` | Public base URL for stored media |

## Structure

Feature-based: each feature lives in its own folder under `src/modules/` and owns
its route, controller and service. Cross-cutting code sits alongside.

```
prisma/
  schema.prisma          # data model + datasource
  migrations/            # generated SQL migrations (committed)
src/
  index.ts               # entry point — connects the DB, starts the HTTP server
  app.ts                 # Express assembly (helmet, cors, cookies, static, limiter)
  config/env.ts          # typed environment config (dotenv)
  db/prisma.ts           # shared PrismaClient singleton
  middleware/            # notFound, errorHandler
  shared/ApiError.ts     # operational error with HTTP status
  types/express.d.ts     # Request.user augmentation
  modules/
    index.ts             # mounts every feature router under /api
    admin.routes.ts      # /api/admin/* — requireAuth + requireActive + limiter
    _shared/             # asyncHandler, auth.middleware, rateLimiters, audit,
                         #   validate (zod -> 400), pagination, slug
    auth/                # register, login, refresh, logout, me, tokens
    users/               # admin user management (approve/reject/suspend/...)
    projects/            # projects.routes.ts (public) + projects.admin.routes.ts
    dashboard/           # GET /api/admin/overview
    media/               # POST /api/admin/media + drivers/ (local | s3 | cloudinary)
    audit/               # GET /api/admin/audit
    health/              # GET /api/health
```

To add a feature, create `src/modules/<name>/` with `<name>.routes.ts`,
`<name>.controller.ts`, `<name>.service.ts` (+ `<name>.schemas.ts` for zod), then
register it in `src/modules/index.ts` (public) or `src/modules/admin.routes.ts`.

## Endpoints

All non-public routes need `Authorization: Bearer <accessToken>`. Full contract in
`API_SPEC` / the project spec. Summary:

| Method | Path | Auth | Notes |
| ------ | ---- | ---- | ----- |
| `GET` | `/` | — | service info |
| `GET` | `/api/health` | — | liveness + DB readiness (`200` / `503`) |
| `GET` | `/api/monitor` | — | ops report: status, uptime, node, memory, DB latency (`200` / `503`) |
| `POST` | `/api/auth/register` | — | creates a `pending` user (or `owner` for the bootstrap email) |
| `POST` | `/api/auth/login` | — | → access token + `bassera_rt` refresh cookie |
| `POST` | `/api/auth/refresh` | cookie | rotates the refresh session |
| `POST` | `/api/auth/logout` | cookie | `204`, idempotent |
| `GET` | `/api/auth/me` | bearer | current user + full profile |
| `PATCH` | `/api/auth/me` | bearer (active) | edit own profile: `name`, `title`, `bio`, `avatarUrl`, `profileTags[]`, `showOnTeam` |
| `GET` | `/api/team` | — | public roster — `id`, `name`, `role`, `title`, `bio`, `avatarUrl`, `profileTags` (active + `showOnTeam`); `?role=` filter |
| `GET` | `/api/team/:id` | — | one team member |
| `GET` | `/api/projects` | — | published only; `kind`,`featured`,`tag`,`q`,`page`,`pageSize`,`sort` |
| `GET` | `/api/projects/meta` | — | enum values |
| `GET` | `/api/projects/:idOrSlug` | — | published only |
| `GET` | `/api/admin/overview` | viewer+ | counts + recent |
| `GET/POST` | `/api/admin/projects` | editor+ | list (drafts incl.) / create |
| `GET/PATCH/DELETE` | `/api/admin/projects/:id` | editor+ | |
| `POST` | `/api/admin/projects/:id/publish` · `/unpublish` | editor+ | |
| `PATCH` | `/api/admin/projects/reorder` | editor+ | `{ items: [{ id, sortOrder }] }` |
| `GET` | `/api/admin/users` | admin+ | `status`,`role`,`q` |
| `POST` | `/api/admin/users/:id/approve` · `/reject` · `/suspend` · `/reactivate` | admin+ | |
| `PATCH` | `/api/admin/users/:id` | admin+ (owner for admin/owner role changes) | `role`, `name` + profile: `title`, `bio`, `avatarUrl`, `profileTags[]`, `showOnTeam`, `teamOrder` |
| `DELETE` | `/api/admin/users/:id` | owner | not self / last owner |
| `POST` | `/api/admin/media` | editor+ | `multipart/form-data`, field `file` |
| `GET` | `/api/admin/audit` | admin+ | `actorId`,`action`,`from`,`to`,`page` |

## Deploy (Render)

The repo ships a `render.yaml` Blueprint.

1. Push this repo to GitHub.
2. Render → **New +** → **Blueprint** → pick the repo. It creates the
   `bassera-backend` web service from `render.yaml`.
3. Fill the env vars marked `sync: false`:
   - `DATABASE_URL` — the **Internal** Database URL of your Render Postgres
     (host `dpg-…-a`, no `?sslmode`).
   - `BOOTSTRAP_ADMIN_EMAIL` — first account to register with this email becomes
     owner/active.
   - `MEDIA_PUBLIC_BASE_URL` — `https://<service>.onrender.com/uploads`.
   - `CORS_ORIGIN` defaults to `https://bassera.agency`; add more origins
     comma-separated if needed.
4. Build runs `npm run build`; start runs `npm run start:prod`
   (`prisma migrate deploy` then `node dist/index.js`), so migrations apply on
   every deploy. Health check: `/api/health`.

Frontend (`Bassera_FrontEnd` on Vercel) needs **`VITE_API_URL`** set to
`https://<service>.onrender.com/api`.

**Free-plan caveats:** the service sleeps after ~15 min idle (first request ~50s);
the filesystem is ephemeral, so `MEDIA_DRIVER=local` loses uploaded images on
redeploy — switch to S3/Cloudinary for production media.
