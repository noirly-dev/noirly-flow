# Noirly Flow — Web Architecture

**Product:** Noirly Flow (web)  
**Audience:** Principal frontend / full-stack implementation  
**Status:** Architecture decision record for MVP → v2  
**Stack:** Next.js App Router · TypeScript strict · Tailwind · pnpm · React Query · Zustand · MongoDB / Mongoose  

---

## 1. Executive summary & goals

### 1.1 Purpose

Noirly Flow is a **dark-mode, production-grade task and project management web app** for:

- **Individuals** — personal to-dos, priorities, recurring work, list + Kanban
- **Teams / businesses** — workspaces, shared boards, assignments, comments, RBAC, live collaboration

One product surface; mode is determined by **workspace context**, not separate apps.

### 1.2 Goals

| Goal | Measure |
| --- | --- |
| Single Noirly account across products | Auth via **Noirly Identity** (OIDC), not a second password store |
| Fast local UX | Optimistic mutations, keyboard-first, Cmd+K |
| Team-safe collaboration | Workspace RBAC + realtime board sync |
| Swappable backend | `SyncProvider` interface; primary MVP backend locked below |
| Monorepo-ready | Domain logic in `src/core` / future `@noirly/flow-core`; UI stays framework-thin |
| Accessible | WCAG AA, full keyboard nav, proper focus traps |

### 1.3 Non-goals (MVP)

- Native mobile / Expo (future app consumes `flow-core`)
- Full offline-first CRDT sync
- Built-in chat / video
- Billing / multi-region tenancy automation
- Light theme

### 1.4 Locked decisions (architecture-critical)

| Decision | Choice | Justification |
| --- | --- | --- |
| **Auth** | **Auth.js (NextAuth v5) + Noirly Identity OIDC** | Identity already provides register/login/verify, OAuth2/OIDC, PKCE, sessions. Flow must not re-implement passwords. “Continue with Noirly” matches the ecosystem. Google can be added later **on Identity**, not as a parallel IdP in Flow. |
| **Primary data store** | **MongoDB + Mongoose** | Same MongoDB host as Identity, **separate database** (`noirly-flow`). Flow only stores Identity `sub` as `user.identitySub`. Collections stay normalized (memberships, columns, tasks as docs) so RBAC and DnD reorder stay explicit; embed only checklist items / recurrence on tasks. |
| **App API** | **Next.js Route Handlers** (`app/api/**`) | Same deployable as the UI for MVP; domain in `src/core` / `src/server`. |
| **Realtime** | **noirly-realtime** (self-hosted `ws` + Redis) | Replaces Ably. Channels + presence + sequenced replay. React Query remains source of truth; realtime invalidates/patches. See `noirly-realtime/docs/ARCHITECTURE.md`. |
| **Client server-state** | **TanStack Query v5** | Cache, optimistic DnD, keyed by workspace/board. |
| **Client UI state** | **Zustand** | Workspace switcher, view mode, command palette, selection — not server data. |
| **Forms** | **React Hook Form + Zod** | Aligns with Identity’s Zod culture; shared schemas in `src/core`. |
| **Package manager** | **pnpm** | Required; migrate off `package-lock.json`. |
| **DnD** | **@dnd-kit** | Accessible, React 19 friendly, better than deprecated `react-beautiful-dnd`. |

---

## 2. Project structure

### 2.1 Near-term repo layout (`noirly-flow`)

Treat the current repo as the **web app**. Structure so a future Turborepo can lift `src/core` → `packages/flow-core` and this app → `apps/web` with minimal churn.

```text
noirly-flow/
├── app/                          # Next.js App Router (UI + route handlers)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── callback/page.tsx     # optional post-auth landing
│   │   └── layout.tsx
│   ├── (app)/
│   │   ├── layout.tsx            # shell: sidebar, workspace switcher, cmd-k
│   │   ├── page.tsx              # redirect → last workspace or personal
│   │   ├── inbox/page.tsx
│   │   ├── search/page.tsx
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   └── preferences/page.tsx
│   │   └── w/[workspaceId]/
│   │       ├── layout.tsx        # workspace guard + role context
│   │       ├── page.tsx          # workspace home / projects list
│   │       ├── projects/
│   │       │   ├── page.tsx
│   │       │   └── [projectId]/
│   │       │       ├── page.tsx          # default board/list
│   │       │       ├── board/page.tsx
│   │       │       ├── list/page.tsx
│   │       │       └── calendar/page.tsx # v1
│   │       ├── tasks/[taskId]/page.tsx  # deep-link task drawer/page
│   │       ├── members/page.tsx
│   │       └── settings/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── health/route.ts
│   │   ├── workspaces/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── comments/
│   │   ├── activity/
│   │   ├── search/
│   │   └── realtime/token/route.ts   # noirly-realtime JWT for client
│   ├── layout.tsx
│   ├── globals.css
│   └── not-found.tsx
├── src/
│   ├── core/                     # backend-agnostic domain (future package)
│   │   ├── models/               # TS types + zod schemas
│   │   ├── permissions/          # RBAC pure functions
│   │   ├── filters/              # task filter predicates
│   │   ├── recurrence/           # RRULE helpers
│   │   └── sync/
│   │       ├── types.ts          # SyncProvider contract
│   │       └── query-keys.ts
│   ├── server/                   # Next-only server adapters
│   │   ├── db/                   # Mongoose connection
│   │   ├── models/               # Mongoose schemas (Flow DB only)
│   │   ├── auth/                 # session helpers + first-login bootstrap
│   │   ├── providers/
│   │   │   └── mongo-sync-provider.ts
│   │   ├── realtime/             # noirly-realtime publisher
│   │   └── trpc-or-rest/         # route handler services
│   ├── features/                 # domain UI features
│   │   ├── auth/
│   │   ├── workspace/
│   │   ├── board/
│   │   ├── task/
│   │   ├── comments/
│   │   ├── command-palette/
│   │   └── presence/
│   ├── components/               # composed, reusable (non-primitive)
│   ├── ui/                       # design-system primitives
│   ├── stores/                   # Zustand
│   ├── hooks/
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── query-client.ts
│   │   └── cn.ts
│   └── styles/
│       └── tokens.css
├── docs/
│   └── ARCHITECTURE.md           # this file
├── public/
├── tests/
├── middleware.ts                 # or proxy.ts per Next 16 convention
├── tailwind.config.ts            # if needed; Tailwind v4 may use CSS-first
├── pnpm-workspace.yaml           # prepare for monorepo (optional single-package first)
├── package.json
└── tsconfig.json
```

### 2.2 Future Turborepo target

```text
noirly/
├── apps/
│   ├── identity/          # existing noirly-identity
│   ├── flow-web/          # this app
│   └── flow-mobile/       # future
├── packages/
│   ├── flow-core/         # lifted from src/core
│   ├── ui/                # optional shared primitives
│   └── config-eslint/
└── pnpm-workspace.yaml
```

### 2.3 Layering rules

1. **`src/ui`** — no data fetching, no Zustand of domain entities  
2. **`src/features/*`** — compose UI + hooks; call React Query  
3. **`src/core`** — pure TS: schemas, permissions, SyncProvider types  
4. **`src/server`** — Mongoose, Auth.js, noirly-realtime publisher, route handlers only
5. Features never import Mongoose models directly

---

## 3. Data models

IDs are **UUIDs** (`uuid` / `cuid2`). Timestamps are ISO UTC. Soft-delete via `deletedAt` where recovery matters (tasks/projects).

### 3.1 TypeScript interfaces (domain)

```ts
// src/core/models/types.ts

export type WorkspaceKind = "personal" | "team";
export type MemberRole = "owner" | "editor" | "viewer";
export type TaskStatus = "todo" | "in_progress" | "blocked" | "done" | "canceled";
export type TaskPriority = "none" | "low" | "medium" | "high" | "urgent";
export type ProjectView = "board" | "list";
export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "custom";

export interface User {
  id: string;
  identitySub: string;          // Noirly Identity `sub` — stable subject
  email: string;
  emailVerified: boolean;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  kind: WorkspaceKind;
  name: string;
  slug: string;
  ownerUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMembership {
  id: string;
  workspaceId: string;
  userId: string;
  role: MemberRole;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  color: string | null;         // accent chip, not theme
  defaultView: ProjectView;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Kanban column */
export interface BoardColumn {
  id: string;
  projectId: string;
  name: string;
  statusMapped: TaskStatus | null; // optional semantic mapping
  position: number;                // fractional index or dense rank
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  workspaceId: string;
  name: string;
  color: string | null;
}

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;               // every N days/weeks
  byWeekday?: number[];           // 0-6 if weekly
  until?: string | null;
  count?: number | null;
  rrule?: string | null;          // when frequency === "custom"
}

export interface Task {
  id: string;
  workspaceId: string;
  projectId: string | null;       // null = inbox / personal unfiled
  columnId: string | null;        // board placement
  title: string;
  description: string | null;     // markdown
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  startAt: string | null;
  completedAt: string | null;
  position: number;               // order within column or list
  assigneeIds: string[];
  tagIds: string[];
  parentTaskId: string | null;    // subtasks
  recurrence: RecurrenceRule | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ChecklistItem {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  position: number;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;                   // markdown
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type ActivityVerb =
  | "task.created"
  | "task.updated"
  | "task.moved"
  | "task.assigned"
  | "task.completed"
  | "comment.created"
  | "member.added"
  | "project.created";

export interface ActivityEvent {
  id: string;
  workspaceId: string;
  projectId: string | null;
  taskId: string | null;
  actorId: string;
  verb: ActivityVerb;
  metadata: Record<string, unknown>;
  createdAt: string;
}
```

### 3.2 Mongoose sketch (MongoDB collections)

Same MongoDB **host/cluster** as Identity; database name **`noirly-flow`** (never write into `noirly-identity`). Prefer separate collections over deep nesting for memberships, columns, and tasks so RBAC queries and board reorder stay simple. Embed checklist items and recurrence on the task document.

```ts
// users
{ identitySub, email, emailVerified, displayName, avatarUrl?, createdAt, updatedAt }

// workspaces
{ kind: "personal"|"team", name, slug, ownerUserId, createdAt, updatedAt }

// workspace_memberships
{ workspaceId, userId, role: "owner"|"admin"|"member"|"viewer", createdAt, updatedAt }
// unique(workspaceId, userId)

// projects
{ workspaceId, name, description?, color?, defaultView, archivedAt?, deletedAt?, createdAt, updatedAt }

// board_columns
{ projectId, name, statusMapped?, position: number, createdAt, updatedAt }

// tasks
{
  workspaceId, projectId?, columnId?, title, description?,
  status, priority, dueAt?, startAt?, completedAt?,
  position, assigneeIds[], tagIds[], parentTaskId?,
  recurrence?, checklist: [{ title, completed, position }],
  createdById, deletedAt?, createdAt, updatedAt
}

// tags, comments, activity_events — separate collections as needed
```

### 3.3 Personal vs team

- On first login, create a **personal** workspace (`kind: personal`) owned by the user; cannot be deleted; user is always `owner`.
- Team workspaces are created explicitly; invites create `WorkspaceMembership` rows.

---

## 4. API / data layer design

### 4.1 SyncProvider (backend-agnostic)

```ts
// src/core/sync/types.ts

export interface ListTasksQuery {
  workspaceId: string;
  projectId?: string | null;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  tagIds?: string[];
  assigneeId?: string;
  dueBefore?: string;
  dueAfter?: string;
  search?: string;
  includeDeleted?: boolean;
}

export interface ReorderTasksInput {
  projectId: string;
  moves: Array<{
    taskId: string;
    columnId: string | null;
    position: number;
    status?: TaskStatus;
  }>;
}

export interface SyncProvider {
  // Workspace
  listWorkspaces(): Promise<Workspace[]>;
  getWorkspace(id: string): Promise<Workspace>;
  createWorkspace(input: { name: string; kind: "team" }): Promise<Workspace>;

  // Projects / columns
  listProjects(workspaceId: string): Promise<Project[]>;
  getProject(projectId: string): Promise<Project & { columns: BoardColumn[] }>;
  createProject(input: Omit<Project, "id" | "createdAt" | "updatedAt" | "deletedAt" | "archivedAt">): Promise<Project>;

  // Tasks
  listTasks(query: ListTasksQuery): Promise<Task[]>;
  getTask(taskId: string): Promise<Task>;
  createTask(input: CreateTaskInput): Promise<Task>;
  updateTask(taskId: string, patch: Partial<Task>): Promise<Task>;
  deleteTask(taskId: string): Promise<void>;
  reorderTasks(input: ReorderTasksInput): Promise<Task[]>;

  // Comments / activity
  listComments(taskId: string): Promise<Comment[]>;
  createComment(input: { taskId: string; body: string }): Promise<Comment>;
  listActivity(query: { workspaceId: string; taskId?: string; cursor?: string }): Promise<{
    items: ActivityEvent[];
    nextCursor?: string;
  }>;
}
```

**MVP implementation:** `MongoSyncProvider` in `src/server/providers/mongo-sync-provider.ts`, invoked from Route Handlers.  
**Client:** never imports Mongoose; uses `api-client` → REST → provider.

### 4.2 REST shape (Route Handlers)

All under `/api`, JSON, Zod-validated. Auth via Auth.js session cookie.

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/workspaces` | Memberships for current user |
| `POST` | `/api/workspaces` | Create team workspace |
| `GET` | `/api/workspaces/:id` | + role |
| `GET` | `/api/workspaces/:id/projects` | |
| `POST` | `/api/workspaces/:id/projects` | |
| `GET` | `/api/projects/:id` | includes columns |
| `GET` | `/api/workspaces/:id/tasks` | filter querystring |
| `POST` | `/api/workspaces/:id/tasks` | |
| `PATCH` | `/api/tasks/:id` | |
| `DELETE` | `/api/tasks/:id` | soft delete |
| `POST` | `/api/projects/:id/reorder` | batch DnD |
| `GET/POST` | `/api/tasks/:id/comments` | |
| `GET` | `/api/workspaces/:id/activity` | cursor pagination |
| `GET` | `/api/realtime/token` | noirly-realtime JWT (scoped channel caps) |
| `GET` | `/api/search?q=` | workspace-scoped |

Errors follow Identity-style envelopes:

```json
{ "error": "forbidden", "message": "Insufficient permissions" }
```

### 4.3 Why not Firebase / Supabase Auth as primary?

| Option | Verdict |
| --- | --- |
| Firebase | Rejected for MVP — couples auth+data; conflicts with Noirly Identity SSO story |
| Supabase (full) | Rejected — dual auth vs Noirly Identity is worse than Identity OIDC + Flow Mongo + Ably |
| **MongoDB + Mongoose + noirly-realtime** | Chosen — Identity owns authN (Mongo `noirly-identity`); Flow owns authZ + data (Mongo `noirly-flow`) + realtime |

---

## 5. State management architecture

### 5.1 Zustand (client UI state)

Stores are **UI-only**. Never mirror full task lists here.

```ts
// src/stores/workspace-store.ts
interface WorkspaceUIState {
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string) => void;
}

// src/stores/view-store.ts
interface ViewState {
  projectViewById: Record<string, "board" | "list">;
  filters: TaskFilters;
  setFilters: (patch: Partial<TaskFilters>) => void;
}

// src/stores/ui-store.ts
interface UIState {
  commandPaletteOpen: boolean;
  taskDrawerId: string | null;
  selectedTaskIds: string[];
}
```

Persist: `activeWorkspaceId` + default view preferences via `zustand/middleware` → `localStorage`.

### 5.2 React Query keys

```ts
export const qk = {
  workspaces: ["workspaces"] as const,
  workspace: (id: string) => ["workspaces", id] as const,
  projects: (workspaceId: string) => ["projects", workspaceId] as const,
  project: (projectId: string) => ["project", projectId] as const,
  tasks: (workspaceId: string, filters: TaskFilters) =>
    ["tasks", workspaceId, filters] as const,
  task: (taskId: string) => ["task", taskId] as const,
  comments: (taskId: string) => ["comments", taskId] as const,
  activity: (workspaceId: string, taskId?: string) =>
    ["activity", workspaceId, taskId ?? "all"] as const,
  members: (workspaceId: string) => ["members", workspaceId] as const,
};
```

### 5.3 Optimistic updates

| Mutation | Strategy |
| --- | --- |
| Create task | Insert placeholder in cache; reconcile with server id |
| Edit title/priority | Patch cache immediately; rollback on error |
| DnD reorder | Reorder cache + send batch `reorder`; on fail invalidate project tasks |
| Complete task | Toggle status + `completedAt`; animation via Framer Motion |
| Comment | Optimistic append with temp id |

Use `onMutate` / `onError` / `onSettled` consistently in `src/features/**/mutations.ts`.

---

## 6. Real-time sync strategy & conflict handling

### 6.1 Model

```text
User A mutates → API persists → server publishes noirly-realtime event
                                      ↓
User B / A other tabs ← WebSocket event ← invalidate or patch React Query
```

- **Source of truth:** MongoDB (`noirly-flow`)  
- **Ephemeral collab:** noirly-realtime presence + events  
- **Client cache:** React Query  

### 6.2 Channels

| Channel | Purpose |
| --- | --- |
| `workspace:{workspaceId}` | project/member-level events |
| `project:{projectId}` | task CRUD, reorder, column changes |
| `task:{taskId}` | comments, detailed edits when drawer open |
| Presence on `project:{projectId}` | who is viewing the board |

Client obtains a **capability-scoped token** from `/api/realtime/token` (server checks membership).

### 6.3 Event payload (example)

```ts
type RealtimeEvent =
  | { type: "task.upsert"; task: Task; version: number }
  | { type: "task.delete"; taskId: string }
  | { type: "tasks.reordered"; projectId: string; moves: ReorderTasksInput["moves"] }
  | { type: "comment.created"; comment: Comment };
```

`version` = monotonic `updatedAt` millis or integer `rowVersion` column for conflict detection.

### 6.4 Conflict handling

1. **Last-write-wins** on scalar fields (`title`, `priority`) using `updatedAt` / `version`.  
2. **DnD:** server applies authoritative positions; clients always accept server reorder events.  
3. If patch version &lt; cached version, ignore event and optionally refetch.  
4. No CRDTs in MVP. Document merge conflicts only on long description edits (v2: Yjs optional).

### 6.5 MVP fallback

If realtime is delayed: **polling** `refetchInterval: 5_000` on active board query. Same Query keys — live events later only remove polling.

---

## 7. Routing structure

### 7.1 Route groups

| Group | Path prefix | Layout |
| --- | --- | --- |
| `(auth)` | `/login` | Minimal, centered, no app chrome |
| `(app)` | `/`, `/inbox`, `/w/...`, `/settings` | App shell |

### 7.2 Route table

| Route | Auth | Description |
| --- | --- | --- |
| `/login` | public | Continue with Noirly |
| `/api/auth/*` | Auth.js | OIDC callbacks |
| `/` | required | Redirect to last workspace or personal |
| `/inbox` | required | Personal unfiled tasks (active personal workspace) |
| `/w/[workspaceId]` | member | Workspace home |
| `/w/[workspaceId]/projects` | member | Project list |
| `/w/[workspaceId]/projects/[projectId]/board` | member | Kanban |
| `/w/[workspaceId]/projects/[projectId]/list` | member | List |
| `/w/[workspaceId]/tasks/[taskId]` | member | Task focus / deep link |
| `/w/[workspaceId]/members` | editor+ for invite UI | Members |
| `/w/[workspaceId]/settings` | owner | Workspace settings |
| `/settings/*` | required | User preferences |

### 7.3 Middleware / proxy (Next 16)

Use Next 16 **`proxy.ts`** (middleware rename) to:

1. Protect `(app)` routes — redirect unauthenticated users to `/login`  
2. Attach request id / security headers  
3. **Not** do heavy RBAC (workspace role checks happen in layouts + API)

```ts
// proxy.ts (conceptual)
export function proxy(req: NextRequest) {
  const session = /* Auth.js edge session helper */;
  if (isAppRoute(req) && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}
```

### 7.4 Workspace layout guard

`app/(app)/w/[workspaceId]/layout.tsx`:

- Fetch membership  
- If 404/403 → not-found or forbidden page  
- Provide `WorkspaceRoleProvider` (React context) for UI gating  

---

## 8. Component inventory

### 8.1 `src/ui` — primitives

| Component | Role |
| --- | --- |
| `Button` | primary (cyan), ghost, danger (amber) |
| `IconButton` | toolbar |
| `Input`, `Textarea`, `Select`, `Checkbox` | forms |
| `Badge`, `PriorityDot`, `TagChip` | status/meta |
| `Avatar`, `AvatarGroup` | people |
| `Dialog`, `Drawer`, `Popover`, `DropdownMenu` | overlays (focus trap) |
| `Tooltip` | shortcuts hints |
| `Skeleton` | loading |
| `ScrollArea` | boards/lists |
| `Separator` | `#2A2A2A` |
| `Kbd` | shortcut glyphs |
| `Toast` | feedback |

Primitives use CSS variables / Tailwind tokens only — no feature imports.

### 8.2 `src/components` — composed

| Component | Role |
| --- | --- |
| `AppShell` | nav + main |
| `Sidebar` | workspace nav |
| `WorkspaceSwitcher` | top-level persistent switcher |
| `TopBar` | search, cmd-k, user menu |
| `EmptyState` | |
| `ConfirmDialog` | destructive actions |
| `DateTimeDisplay` | JetBrains Mono numerals |
| `UserPicker` | assignees |
| `FilterBar` | tag/priority/due filters |

### 8.3 `src/features` — domain

| Feature | Key components |
| --- | --- |
| `auth` | `LoginScreen`, `ContinueWithNoirlyButton` |
| `workspace` | `CreateWorkspaceDialog`, `MembersTable`, `RoleBadge` |
| `board` | `KanbanBoard`, `KanbanColumn`, `TaskCard`, `BoardDndContext` |
| `task` | `TaskList`, `TaskRow`, `TaskDrawer`, `SubtaskList`, `ChecklistEditor`, `RecurrenceEditor` |
| `comments` | `CommentThread`, `CommentComposer` |
| `command-palette` | `CommandPalette` (cmdk) |
| `presence` | `PresenceAvatars`, `RemoteCursor` (v1) |
| `activity` | `ActivityFeed` |

### 8.4 Motion (Framer Motion — sparse)

- Task complete: check + fade/strike  
- Modal/drawer: opacity + translateY  
- Column drop: layout animation via `LayoutGroup` sparingly  
Avoid continuous ambient animation.

---

## 9. Authentication & authorization

### 9.1 AuthN — Noirly Identity via Auth.js

```text
User → Flow /login → Auth.js → Identity /authorize (PKCE)
     → callback → Auth.js session (HTTP-only cookie)
     → upsert local User by identitySub
     → ensure personal Workspace
```

**Scopes:** `openid profile email offline_access`  
**Client:** confidential server client `noirly-flow` registered in Identity  
**Redirect URI:** `{FLOW_URL}/api/auth/callback/noirly` (Auth.js provider id)

Session strategy: **JWT session (Auth.js)** or database session — prefer JWT for edge `proxy` reads; store `identitySub` + `userId` in token claims.

Email/password & verification: **only on Identity**. Flow never stores password hashes.

Google OAuth: **out of MVP** unless Identity adds it; do not bolt Google onto Flow independently.

### 9.2 AuthZ — workspace RBAC

| Action | owner | editor | viewer |
| --- | --- | --- | --- |
| View projects/tasks | ✓ | ✓ | ✓ |
| Create/edit tasks | ✓ | ✓ | |
| Reorder / DnD | ✓ | ✓ | |
| Comment | ✓ | ✓ | ✓ (read); write: editor+ |
| Manage members | ✓ | | |
| Delete workspace | ✓ | | |
| Archive project | ✓ | ✓ | |

Pure functions in `src/core/permissions`:

```ts
can(role: MemberRole, action: PermissionAction): boolean
assertCan(role, action): void // throws ForbiddenError
```

Personal workspace: single member, always `owner`.

### 9.3 API enforcement

Every mutating route:

1. Resolve session → `userId`  
2. Resolve membership for `workspaceId`  
3. `assertCan`  
4. Proceed  

Never trust client-sent `role`.

---

## 10. Design system tokens

### 10.1 Color

| Token | Value | Usage |
| --- | --- | --- |
| `--nf-bg` | `#121212` | App background |
| `--nf-surface` | `#1E1E1E` | Cards, drawers, elevated panels |
| `--nf-surface-hover` | `#242424` | Hover |
| `--nf-border` | `#2A2A2A` | Borders, dividers |
| `--nf-accent` | `#52D3FE` | Primary CTA, focus ring, links, active nav |
| `--nf-accent-muted` | `#52D3FE33` | Selection wash |
| `--nf-warning` | `#D9A759` | Warnings / destructive emphasis |
| `--nf-danger` | `#D9A759` | Align semantic warning (or `#E07A5F` if stronger danger needed later) |
| `--nf-text` | `#F5F5F5` | Primary text |
| `--nf-text-muted` | `#A3A3A3` | Secondary |
| `--nf-success` | `#3DDC97` | Optional completed (keep muted; accent stays cyan) |

Dark-only: `color-scheme: dark;` on `html`.

### 10.2 Typography

| Role | Family | Notes |
| --- | --- | --- |
| UI / body | **Inter** | 14/16 body, 600 semibold headings |
| Numerals / IDs / timestamps | **JetBrains Mono** | due dates, counters, task short ids |

### 10.3 Spacing, radius, elevation

```text
spacing scale: 4, 8, 12, 16, 24, 32, 48, 64
radius: sm 6px, md 10px, lg 14px (cards), full pills sparingly
shadow: prefer border + surface lift over heavy shadows; optional 0 1px 0 #0006
focus: 2px solid var(--nf-accent) offset 2px
```

### 10.4 Tailwind v4 mapping (`globals.css`)

```css
@theme {
  --color-nf-bg: #121212;
  --color-nf-surface: #1e1e1e;
  --color-nf-border: #2a2a2a;
  --color-nf-accent: #52d3fe;
  --color-nf-warning: #d9a759;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
```

Contrast: cyan on `#121212` / `#1E1E1E` must meet AA for text ≥ 14px; use accent mainly on buttons with dark text `#0A0A0A` for primary filled buttons if needed for AA.

---

## 11. Key interaction specs

### 11.1 Kanban drag-and-drop

- Library: **@dnd-kit/core + sortable**  
- Drag handle on task card (keyboard: Space/Enter to pick up, arrows to move, Space to drop)  
- On drop: optimistic reorder → `POST /api/projects/:id/reorder` → noirly-realtime `tasks.reordered`  
- Cross-column drop may map `status` via column `statusMapped`  
- Collision detection: `closestCorners`  
- Autoscroll near column edges  

### 11.2 Command palette (Cmd+K / Ctrl+K)

- Library: **cmdk**  
- Actions: Create task, Go to project, Switch workspace, Search tasks, Toggle theme N/A, Open settings  
- Query debounced → `/api/search`  
- Esc closes; focus restored to invoker  

### 11.3 Presence

- Presence on `project:{id}` (noirly-realtime)  
- Show up to 5 avatars + `+N`  
- Soft highlight on task when another user has task drawer open (event `presence.taskFocus`) — v1  

### 11.4 Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Cmd/Ctrl+K` | Command palette |
| `C` | Create task (in project context) |
| `N` | New project |
| `/` | Focus filter/search |
| `1` / `2` | Board / List view |
| `Esc` | Close drawer/dialog |
| `Cmd/Ctrl+Enter` | Save task in drawer |

Ignore shortcuts when focus is in inputs (except palette).

### 11.5 Task drawer

- Route-synced optional: `?task=` or `/tasks/[taskId]`  
- Focus trap; return focus on close  
- Sections: title, properties, checklist, subtasks, comments, activity  

---

## 12. Phased build roadmap

### Phase 0 — Foundations (week 1)

- pnpm migrate  
- Design tokens + `ui` primitives  
- Auth.js + Noirly Identity client registration  
- Mongoose models + personal workspace bootstrap  
- App shell + workspace switcher  
- `SyncProvider` interface + Mongo adapter stub  

### Phase 1 — MVP Personal (weeks 2–4)

- CRUD tasks (inbox + one default personal project)  
- List view + Kanban + @dnd-kit reorder  
- Due dates, priority, tags, subtasks/checklists  
- Filters + search  
- Command palette (create + navigate)  
- Basic recurrence (daily/weekly)  
- Responsive layouts  

**Exit criteria:** Solo user can run personal work fully without team features.

### Phase 2 — MVP Team (weeks 5–7)

- Team workspaces + invites (email link or copy invite)  
- RBAC enforcement UI + API  
- Assignment + comments + activity log  
- noirly-realtime for board + presence avatars  
- Optimistic multiplayer DnD validation  

**Exit criteria:** Two browsers on one board see live updates; viewer cannot mutate.

### Phase 3 — v1 (weeks 8–11)

- Calendar view  
- Custom recurrence (RRULE)  
- Notifications (email via Identity email service or Flow SMTP)  
- Workspace audit log export  
- Performance: virtualized lists, board windowing  
- E2E Playwright suite (auth, DnD, permissions)  

### Phase 4 — v2

- Extract `packages/flow-core` into Turborepo  
- Mobile app against same API  
- Optional CRDT descriptions  
- Advanced automation / rules  
- Google IdP via Identity federation  

---

## Appendix A — Environment variables

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3002
# Same Mongo host as Identity; different database name
MONGODB_URI=mongodb://127.0.0.1:27017/noirly-flow

# Noirly Identity / Auth.js
AUTH_SECRET=...
AUTH_NOIRLY_ISSUER=http://localhost:3000
AUTH_NOIRLY_CLIENT_ID=noirly-flow
AUTH_NOIRLY_CLIENT_SECRET=...

# noirly-realtime
REALTIME_JWT_SECRET=...
NEXT_PUBLIC_REALTIME_WS_URL=ws://127.0.0.1:4001/ws
REDIS_URL=...              # publisher + optional shared Redis
```

## Appendix B — Testing strategy

| Layer | Tool |
| --- | --- |
| Unit (permissions, recurrence, filters) | Vitest |
| Component a11y | Testing Library + axe |
| API | Vitest + test DB |
| E2E | Playwright |

## Appendix C — Risk register

| Risk | Mitigation |
| --- | --- |
| Dual-DB risk (Identity + Flow both Mongo) | Separate DBs (`noirly-identity` / `noirly-flow`); only couple on `identitySub`; no cross-DB joins |
| Realtime fanout cost | Scope channels per project; short-lived JWT caps |
| DnD races | Server authoritative positions; version checks |
| Scope creep (mobile parity) | Keep logic in `core`; ship web-first |

---

## Appendix D — Implementation order checklist (first PRs)

1. `pnpm` + tokens + Inter/JetBrains fonts  
2. Auth.js Noirly provider + session  
3. Mongoose models + personal workspace bootstrap  
4. Shell + switcher  
5. Tasks list CRUD  
6. Board + DnD  
7. Filters / Cmd+K  
8. Team workspace + RBAC  
9. Comments / activity  
10. noirly-realtime wiring  

---

*End of architecture document. Ready for implementation without further structural decisions unless product chooses to replace noirly-realtime or Postgres.*
