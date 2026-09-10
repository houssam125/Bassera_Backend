# Bassera Backend — API Spec

Status: **draft / contract only** (no implementation yet).
Scope: authentication + account approval, the projects/portfolio resource, the
dashboard (admin) API, media upload, and rate limiting.

Base URL: `/api`
Content type: `application/json` unless stated (`multipart/form-data` for uploads).
Auth: `Authorization: Bearer <accessToken>` on every non-public route.

---

## 0. Conventions

### Success envelopes

List:

```json
{ "data": [ /* items */ ], "meta": { "page": 1, "pageSize": 20, "total": 12, "totalPages": 1 } }
```

Single: the bare object (no envelope).

### Error body (already implemented in `src/middleware/errorHandler.ts`)

```json
{ "status": "error", "message": "Validation failed", "details": [ { "path": "email", "message": "invalid" } ] }
```

| Code | When |
| ---- | ---- |
| `400` | validation failure — `details` is an array of `{ path, message }` |
| `401` | missing / invalid / expired access token |
| `403` | authenticated but not allowed (wrong role, or account not `active`) |
| `404` | resource not found |
| `409` | conflict (duplicate email, duplicate slug) |
| `413` | upload too large |
| `429` | rate limited — includes `Retry-After` header |

### Roles

| role | can |
| ---- | -- |
| `owner` | everything, incl. delete users, change any role |
| `admin` | approve/suspend users, all project + media operations |
| `editor` | create / edit / delete / publish projects, upload media |
| `viewer` | read-only dashboard |

### Account status

`pending` → `active` → `suspended`; `rejected` is terminal.
Login is allowed only when `status = active`. A `pending` login returns `403` with
`message: "Account awaiting approval"`.

---

## 1. Auth & account approval

### Flow

1. `POST /api/auth/register` — creates a `User` with `status = pending`,
   `role = <requestedRole>` (not yet effective). No token issued.
2. An `admin`/`owner` sees it under `GET /api/admin/users?status=pending` and calls
   `POST /api/admin/users/:id/approve { role }` → `status = active`.
3. User calls `POST /api/auth/login` → receives an access token + refresh cookie.
4. `POST /api/auth/logout` revokes the refresh session.

**Bootstrap:** the email in `BOOTSTRAP_ADMIN_EMAIL` is created as
`role = owner`, `status = active` on registration (skips approval). Everyone else is `pending`.

### `POST /api/auth/register` — public

Form data:

```
name          required, 2–80
email         required, valid email, unique (stored lowercased)
password      required, 10–128, rejected if in the common-password list
requestedRole optional, "editor" | "viewer", default "editor"
```

`201`:

```json
{ "status": "pending", "message": "Account created. An administrator must approve it before you can sign in." }
```

Errors: `409` email exists, `400` validation, `429` (see §5).

### `POST /api/auth/login` — public

```
email     required
password  required
```

`200`:

```json
{
  "user": { "id": "…", "name": "…", "email": "…", "role": "editor", "status": "active" },
  "accessToken": "<jwt>",
  "accessTokenExpiresIn": 900
}
```

Plus `Set-Cookie: bassera_rt=<opaque>; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=2592000`.

Errors: `401` bad credentials, `403` `pending` / `suspended` / `rejected`,
`429` + per-email lockout after 5 consecutive failures (15 min).

### `POST /api/auth/refresh` — cookie only

Reads the `bassera_rt` cookie, rotates it (old session row deleted, new one written),
returns a fresh `accessToken`. `401` if missing/expired/revoked.

### `POST /api/auth/logout`

Deletes the current refresh session and clears the cookie. `204`. Idempotent.

### `GET /api/auth/me`

Returns the current `user` object (same shape as in login). `401` if not authed.

### Optional (later)

`POST /api/auth/forgot-password { email }` → always `202`.
`POST /api/auth/reset-password { token, password }` → `200`.

### Tokens

| token | type | TTL | transport | storage |
| ----- | ---- | --- | --------- | ------- |
| access | JWT (`HS256`), claims `sub`, `role`, `status` | 15 min (`JWT_ACCESS_TTL`) | `Authorization` header | none |
| refresh | opaque random 256-bit | 30 days (`REFRESH_TOKEN_TTL`) | httpOnly cookie | `Session` row, **hashed** |

Passwords hashed with bcrypt cost `12` (or argon2id). Rotation on every refresh;
logout / suspend / role change revokes all of a user's sessions.

---

## 2. Projects (portfolio) — public reads

One resource, discriminated by `kind`: `social` (Division 01) or `software` (Division 02).
`kind` is set at creation and immutable.

### Enums — `GET /api/projects/meta` (public)

```json
{
  "kinds": ["social", "software"],
  "socialPlatforms": ["instagram", "tiktok", "linkedin", "youtube", "x", "facebook"],
  "deliveryStatuses": ["shipped", "in_progress", "private_beta"],
  "visibilities": ["draft", "published"],
  "metricTrends": ["up", "down", "flat"]
}
```

### Common attributes

| field | type | notes |
| ----- | ---- | ----- |
| `id` | string | server (cuid) |
| `kind` | `social` \| `software` | discriminator, immutable |
| `slug` | string | unique, kebab-case; auto from `title` if omitted. Shown in the software card chrome as `bassera / <slug>` |
| `title` | string | "Nomad Collective" / "Luxe Realty Platform" |
| `client` | string | brand / client name |
| `summary` | string | one-line card text |
| `coverImageUrl` | string (URL) | card image (from §4 media upload) |
| `year` | int | delivery year |
| `tags` | string[] | free-form |
| `featured` | boolean | pin to top |
| `visibility` | `draft` \| `published` | only `published` returned on public routes |
| `sortOrder` | int | manual ordering (ascending) |
| `createdAt` / `updatedAt` | ISO datetime | server |

### `kind = "social"` — extra

| field | type | notes |
| ----- | ---- | ----- |
| `platform` | SocialPlatform | platform chip + icon |
| `handle` | string | `@nomad.collective` |
| `campaignType` | string | "Grid & Content Design" |
| `metrics` | `Metric[]` (1–6; card renders first 3) | stat strip |
| `campaignUrl` | string (URL) \| null | "View campaign" link |

`Metric = { label: string, value: string, trend?: "up" | "down" | "flat" }` —
`value` is a **string** (`"2.4M"`, `"7.8%"`, `"+38K"`), formatting is editorial.

### `kind = "software"` — extra

| field | type | notes |
| ----- | ---- | ----- |
| `projectType` | string | "Real Estate Marketplace", "FinTech · Mobile" |
| `description` | string | card body (longer than `summary`) |
| `stack` | string[] (1–12) | mono chips |
| `deliveryStatus` | `shipped` \| `in_progress` \| `private_beta` | status dot |
| `liveUrl` | string (URL) \| null | "Live ↗". **null ⇒ card shows "Private beta"** |
| `caseStudyUrl` | string (URL) \| null | "Case study →" |
| `repoUrl` | string (URL) \| null | optional |

### `GET /api/projects` — public list

Query params:

| param | values | default |
| ----- | ------ | ------- |
| `kind` | `social` \| `software` | all |
| `featured` | `true` | — |
| `tag` | string | — |
| `q` | search title / client / summary | — |
| `page` | int ≥ 1 | 1 |
| `pageSize` | int 1–100 | 20 |
| `sort` | `sortOrder` \| `-year` \| `-createdAt` | `sortOrder` |

Public callers always get `visibility = published`.
The website calls e.g. `GET /api/projects?kind=software&pageSize=6&sort=sortOrder`.

### `GET /api/projects/:idOrSlug` — public

Full discriminated object, or `404`.

---

## 3. Dashboard (admin) API

Prefix: `/api/admin`. Requires a valid access token **and** `status = active`.
Role gate noted per group.

### 3.1 Overview — `GET /api/admin/overview` (viewer+)

```json
{
  "projects": {
    "total": 12, "published": 9, "draft": 3,
    "social": 6, "software": 6, "featured": 4
  },
  "users": { "total": 5, "pending": 1, "active": 3, "suspended": 1 },
  "recent": [
    { "id": "…", "title": "Luxe Realty Platform", "kind": "software", "visibility": "published", "updatedAt": "…" }
  ],
  "generatedAt": "…"
}
```

### 3.2 Projects management (editor+)

| method | path | body | notes |
| ------ | ---- | ---- | ----- |
| `GET` | `/api/admin/projects` | — | same params as public list **plus** `visibility` filter; drafts included |
| `GET` | `/api/admin/projects/:id` | — | full object |
| `POST` | `/api/admin/projects` | **create payload** (§3.4) | `201` |
| `PATCH` | `/api/admin/projects/:id` | partial of the payload | `kind` may not change |
| `DELETE` | `/api/admin/projects/:id` | — | `204` |
| `POST` | `/api/admin/projects/:id/publish` | — | sets `visibility=published` |
| `POST` | `/api/admin/projects/:id/unpublish` | — | sets `visibility=draft` |
| `PATCH` | `/api/admin/projects/reorder` | `{ "items": [ { "id": "…", "sortOrder": 0 }, … ] }` | bulk order update |

### 3.3 User management (admin/owner)

| method | path | body | notes |
| ------ | ---- | ---- | ----- |
| `GET` | `/api/admin/users` | — | `?status=pending\|active\|suspended\|rejected`, `?role=`, `?q=` |
| `GET` | `/api/admin/users/:id` | — | |
| `POST` | `/api/admin/users/:id/approve` | `{ "role": "editor" \| "viewer" \| "admin" }` | `pending → active`; issues nothing, user must log in |
| `POST` | `/api/admin/users/:id/reject` | `{ "reason"?: string }` | `pending → rejected` |
| `POST` | `/api/admin/users/:id/suspend` | `{ "reason"?: string }` | revokes all sessions |
| `POST` | `/api/admin/users/:id/reactivate` | — | `suspended → active` |
| `PATCH` | `/api/admin/users/:id` | `{ "role"?, "name"? }` | `owner` only for `role` changes to/from `admin`/`owner` |
| `DELETE` | `/api/admin/users/:id` | — | `owner` only; cannot delete self / last owner |

### 3.4 Project create / update payloads (form data)

**Common (both kinds)**

```
kind           required on create, "social" | "software", immutable
title          required, 2–120
client         required, 1–120
summary        required, 1–200
coverImageUrl  required, valid URL (upload first via §4)
year           required, int, 2000 … currentYear + 1
tags           optional, string[], each 1–24, max 12 items
featured       optional, bool, default false
visibility     optional, "draft" | "published", default "draft"
sortOrder      optional, int, default 0
slug           optional, unique, kebab-case (auto from title if omitted)
```

**`kind = "social"` — plus**

```
platform       required, SocialPlatform
handle         required, 1–60
campaignType   required, 1–60
metrics        required, array of 1–6:
                 label  required, 1–24
                 value  required, 1–12
                 trend  optional, "up" | "down" | "flat", default "up"
campaignUrl    optional, valid URL
```

```json
{
  "kind": "social",
  "title": "Nomad Collective",
  "client": "Nomad Collective",
  "summary": "A cohesive feed system that tripled saves per post in one quarter.",
  "coverImageUrl": "https://cdn.bassera.agency/social/nomad.jpg",
  "year": 2025,
  "tags": ["Instagram", "Content Design"],
  "visibility": "published",
  "platform": "instagram",
  "handle": "@nomad.collective",
  "campaignType": "Grid & Content Design",
  "metrics": [
    { "label": "Reach / mo", "value": "2.4M" },
    { "label": "Engagement", "value": "7.8%" },
    { "label": "Followers",  "value": "+38K" }
  ],
  "campaignUrl": "https://instagram.com/nomad.collective"
}
```

**`kind = "software"` — plus**

```
projectType    required, 1–60
description    required, 1–400
stack          required, string[] 1–12, each 1–24
deliveryStatus required, "shipped" | "in_progress" | "private_beta"
liveUrl        optional, valid URL   (null ⇒ card shows "Private beta")
caseStudyUrl   optional, valid URL
repoUrl        optional, valid URL
```

```json
{
  "kind": "software",
  "title": "Luxe Realty Platform",
  "client": "Luxe Realty",
  "summary": "Full-stack property marketplace with 3D tours and an agent CRM.",
  "coverImageUrl": "https://cdn.bassera.agency/software/luxe.jpg",
  "year": 2025,
  "tags": ["Web", "Marketplace"],
  "visibility": "published",
  "projectType": "Real Estate Marketplace",
  "description": "Immersive 3D tours, map search, and an agent CRM.",
  "stack": ["React", "Node", "PostgreSQL", "Three.js"],
  "deliveryStatus": "shipped",
  "liveUrl": "https://luxerealty.example.com",
  "caseStudyUrl": "https://bassera.agency/work/luxe-realty"
}
```

Validation is done with `zod` schemas; a Zod error maps to the `400` body above.

### 3.5 Audit log (admin/owner) — optional

`GET /api/admin/audit?actorId=&action=&from=&to=&page=` →

```json
{ "data": [ { "id": "…", "actorId": "…", "action": "project.publish", "targetType": "project", "targetId": "…", "meta": {}, "createdAt": "…" } ], "meta": { … } }
```

Actions written: `user.register`, `user.approve`, `user.reject`, `user.suspend`,
`user.role_change`, `project.create`, `project.update`, `project.delete`,
`project.publish`, `project.unpublish`, `media.upload`.

---

## 4. Media upload — `POST /api/admin/media` (editor+)

`multipart/form-data`, single field `file`.

```
file   required, image/jpeg | image/png | image/webp, ≤ MEDIA_MAX_BYTES (5 MB)
alt    optional, 0–160  (stored for accessibility)
```

`201`:

```json
{ "url": "https://cdn.bassera.agency/uploads/2026/ab12cd.webp", "width": 1600, "height": 1200, "bytes": 284114, "mime": "image/webp" }
```

Then pass `url` as `coverImageUrl` in a project payload.
Driver is pluggable via `MEDIA_DRIVER` (`local` for dev, `s3` / `cloudinary` for prod).
`413` if too large, `415` if the mime is not allowed.

---

## 5. Rate limiting

`express-rate-limit`, keyed by IP for public routes and by user id for authed routes.
Memory store for a single instance; `rate-limit-redis` + `ioredis` when scaled out.

| scope | limit | window | key |
| ----- | ----- | ------ | --- |
| all `/api/*` | `RATE_LIMIT_MAX` (300) | `RATE_LIMIT_WINDOW_MS` (15 min) | IP |
| `POST /api/auth/login`, `/register` | 10 | 15 min | IP |
| failed logins per email | 5 → 15 min lock | rolling | email |
| `POST /api/auth/refresh` | 60 | 15 min | IP |
| `POST /api/admin/media` | 30 | 10 min | user |
| mutations `POST/PATCH/DELETE /api/admin/*` | 120 | 5 min | user |

Every limited response carries the IETF **draft-7** headers —
`RateLimit: limit=300, remaining=266, reset=845` plus `RateLimit-Policy: 300;w=900`
(seconds). A `429` also sets `Retry-After` and returns:

```json
{ "status": "error", "message": "Too many requests, retry in 42s" }
```

> Implemented status: `apiLimiter` (all `/api/*`), `authLimiter` (login/register),
> `refreshLimiter`, `mediaLimiter` (by user), and `adminMutationLimiter`
> (write verbs under `/api/admin/*`, by user) are all live in
> `src/modules/_shared/rateLimiters.ts`. The per-email 5-strike lockout is in
> `auth.service.ts` (`LOCK_THRESHOLD` / `LOCK_MS`).

---

## 6. Data model additions (Prisma)

```prisma
enum ProjectKind    { social software }
enum SocialPlatform { instagram tiktok linkedin youtube x facebook }
enum DeliveryStatus { shipped in_progress private_beta }
enum Visibility     { draft published }
enum UserRole       { owner admin editor viewer }
enum UserStatus     { pending active suspended rejected }

model User {
  id            String     @id @default(cuid())
  name          String
  email         String     @unique
  passwordHash  String
  role          UserRole   @default(editor)
  status        UserStatus @default(pending)
  requestedRole UserRole   @default(editor)
  approvedById  String?
  approvedBy    User?      @relation("UserApprovals", fields: [approvedById], references: [id])
  approvals     User[]     @relation("UserApprovals")
  failedLogins  Int        @default(0)
  lockedUntil   DateTime?
  lastLoginAt   DateTime?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  sessions      Session[]
}

model Session {
  id               String   @id @default(cuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  refreshTokenHash String   @unique
  userAgent        String?
  ip               String?
  expiresAt        DateTime
  createdAt        DateTime @default(now())
  @@index([userId])
}

model Project {
  id             String          @id @default(cuid())
  kind           ProjectKind
  slug           String          @unique
  title          String
  client         String
  summary        String
  coverImageUrl  String
  year           Int
  tags           String[]
  featured       Boolean         @default(false)
  visibility     Visibility      @default(draft)
  sortOrder      Int             @default(0)

  // social
  platform       SocialPlatform?
  handle         String?
  campaignType   String?
  metrics        Json?           // [{ label, value, trend }]
  campaignUrl    String?

  // software
  projectType    String?
  description    String?
  stack          String[]
  deliveryStatus DeliveryStatus?
  liveUrl        String?
  caseStudyUrl   String?
  repoUrl        String?

  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  @@index([kind, visibility, sortOrder])
}

model AuditLog {
  id         String   @id @default(cuid())
  actorId    String?
  action     String
  targetType String?
  targetId   String?
  meta       Json?
  createdAt  DateTime @default(now())
  @@index([actorId, createdAt])
}
```

A DB `CHECK` or a service-layer guard enforces "required fields for the `kind` are
present" (social needs `platform/handle/campaignType/metrics`; software needs
`projectType/description/stack/deliveryStatus`).

---

## 7. Environment additions

```
# Auth
JWT_ACCESS_SECRET=<32+ random bytes>
JWT_ACCESS_TTL=900
REFRESH_TOKEN_TTL=2592000
REFRESH_COOKIE_NAME=bassera_rt
BCRYPT_COST=12
BOOTSTRAP_ADMIN_EMAIL=you@bassera.agency

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
# REDIS_URL=redis://…            # only when running >1 instance

# Media
MEDIA_DRIVER=local              # local | s3 | cloudinary
MEDIA_MAX_BYTES=5242880
MEDIA_PUBLIC_BASE_URL=http://localhost:4000/uploads
```

---

## 8. Suggested module layout (feature-based, matches current repo)

```
src/modules/
  auth/        auth.routes.ts  auth.controller.ts  auth.service.ts  auth.schemas.ts
  users/       users.routes.ts users.controller.ts users.service.ts        (admin user mgmt)
  projects/    projects.routes.ts (public)  projects.admin.routes.ts (admin)
               projects.controller.ts  projects.service.ts  projects.schemas.ts
  dashboard/   dashboard.routes.ts  dashboard.controller.ts  dashboard.service.ts   (overview)
  media/       media.routes.ts  media.controller.ts  media.service.ts  drivers/
  _shared/     auth.middleware.ts (requireAuth, requireRole)  rateLimiters.ts  audit.ts
```

Public router mounts `projects` (+ `projects/meta`) and `auth`.
`/api/admin/*` router mounts `dashboard`, `projects.admin`, `users`, `media`
behind `requireAuth` + `requireRole`.

---

## 9. New dependencies (not yet installed)

```
jsonwebtoken  @types/jsonwebtoken
bcrypt        @types/bcrypt          # or: argon2
cookie-parser @types/cookie-parser
multer        @types/multer
zod
express-rate-limit
# optional (multi-instance): rate-limit-redis  ioredis
```

---

## 10. Open decisions

| # | question | current assumption in this spec |
| - | -------- | ------------------------------- |
| 1 | Software card field name — frontend `Projects.tsx` uses `name` | API uses `title`; frontend renames `name → title`, **or** API also emits `name` as an alias |
| 2 | Public list pagination | kept; site passes `?pageSize=6`. Switch to unpaginated `?kind=` only if you prefer |
| 3 | `viewer` role needed at launch? | included but optional — drop if only `editor`/`admin` matter |
| 4 | Media storage for production | `MEDIA_DRIVER` left pluggable; pick `s3` or `cloudinary` before deploy |
| 5 | Password reset endpoints | listed as "later", not in v1 |
