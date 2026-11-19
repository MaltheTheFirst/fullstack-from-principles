# Fullstack From Principles

A full-stack TypeScript learning project built to understand how frontend applications, HTTP APIs, authentication, authorization, and relational databases work together.

The application is a multi-user shore-fishing catch log. Users can create accounts, sign in, and manage their own catches, with data persisted in PostgreSQL rather than browser storage.

The purpose was not to build a feature-rich fishing application. It was to implement and understand the responsibilities that turn an interactive frontend into a persistent, authenticated full-stack system.

## Why I Built This

This project is the third stage of my *From Principles* software engineering learning sequence.

The preceding projects explored two sides of web development:

- **HTTP From Scratch** — HTTP requests, routing, validation, sessions, SQL, transactions, and server-side persistence using Node.js and TypeScript.
- **React From Principles** — component architecture, state, effects, forms, validation, routing, asynchronous operations, accessibility, and frontend testing.

Fullstack From Principles connects those two mental models.

The central question is:

**What changes when the browser is no longer the authority over application data?**

Moving persistence from `localStorage` into PostgreSQL introduced problems that the frontend-only application did not need to solve:

- Network requests can fail or complete out of order.
- The server must validate requests independently of the client.
- Users need persistent identities and authenticated sessions.
- Data must be isolated between users.
- UI state must reflect the outcome of server operations.
- Tests need to exercise database-backed behavior safely.

The application was developed incrementally to encounter and solve these problems rather than introducing a large collection of abstractions at the beginning.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Language | TypeScript |
| Frontend | React, Vite |
| Routing | React Router |
| Frontend validation | Zod |
| Backend | Node.js, Fastify |
| Database | PostgreSQL |
| Database access | `pg` with parameterized SQL |
| Password hashing | Argon2id |
| Sessions | Random session tokens, SHA-256 token hashes, HTTP-only cookies |
| Testing | Vitest, React Testing Library, Fastify injection |
| Styling | CSS Modules |
| Repository | npm workspaces |

The project intentionally uses native `fetch`, React primitives, and explicit SQL rather than introducing an ORM, dedicated server-state library, or full-stack application framework.

This keeps the boundaries between systems visible.

## Application Features

### Authentication

- User registration with server-side validation
- Login using username and password
- Password hashing with Argon2id
- Database-backed sessions
- HTTP-only session cookies
- Session restoration after page refresh
- Logout with server-side session invalidation
- Authentication checks before accessing catch data

Registration creates an account; login establishes the authenticated session.

### Catch Management

Authenticated users can:

- View their own catches
- Create catches
- Edit existing catches
- Delete catches
- Search catches by species
- Sort catches by length
- View individual catch details
- View catch statistics
- Change displayed measurement units

Catch records are persisted in PostgreSQL and associated with their owning user.

### Reliability

The frontend also handles:

- Initial loading states
- Failed network requests
- Retry after failed catch loading
- Expired or invalid sessions
- HTTP error responses
- Duplicate mutation prevention
- Stale or aborted catch-loading requests
- Updating local UI state after successful server mutations

These behaviors are part of the project's engineering scope rather than optional presentation details.

## System Architecture

The application consists of two npm workspaces:

```text
fullstack-from-principles/
├── client/
├── server/
├── package.json
└── README.md
```

The React frontend runs separately from the Fastify API during local development.

```text
Browser
  |
  | User interaction
  v
React components
  |
  | Feature hooks / Context
  v
fetch() with credentials
  |
  | HTTP request
  v
Fastify API
  |
  | Request validation
  | Authentication
  | Resource authorization
  v
PostgreSQL
  |
  | Query result
  v
Fastify response
  |
  | HTTP status + JSON
  v
React state update
  |
  v
Rendered UI
```

The responsibilities are deliberately separated.

**The browser** owns presentation, form state, user interactions, and temporary client-side representations of server data.

**The API** owns request validation, authentication enforcement, resource access rules, and database operations.

**PostgreSQL** owns persistent records, relationships, and database constraints.

This distinction is fundamental: a user interface can hide an action, but only the server can enforce whether that action is permitted.

## Authentication and Sessions

Authentication uses server-managed sessions rather than storing credentials or authentication tokens in React state or browser `localStorage`.

### Registration

A registration request contains a username and password.

The server:

1. Validates the request body.
2. Hashes the password using Argon2id.
3. Inserts the new user into PostgreSQL.
4. Returns the created user's public identity.

The database enforces unique usernames.

### Login

A successful login follows this flow:

```text
Username + password
        |
        v
Find user in PostgreSQL
        |
        v
Verify Argon2id password hash
        |
        v
Generate random session token
        |
        v
Hash token using SHA-256
        |
        v
Store token hash and expiry in PostgreSQL
        |
        v
Send raw token in HTTP-only cookie
```

The raw session token is sent to the browser, while its hash is stored in the database.

Sessions have a seven-day expiry.

The cookie uses `HttpOnly` and `SameSite=Lax`. Its current `Secure` setting is disabled for local HTTP development and would need to change for HTTPS deployment.

### Authenticated Requests

Protected endpoints use a Fastify authentication pre-handler.

The server:

1. Reads the session cookie.
2. Hashes the supplied token.
3. Looks up an unexpired session.
4. Resolves the associated user.
5. Attaches the authenticated user to the request.

Requests without a valid session receive HTTP `401 Unauthorized`.

### Session Restoration and Logout

When the frontend starts, it requests `/auth/me` to determine whether an existing browser session is valid.

This allows authentication state to be restored after refreshing the page without persisting the user identity as an authentication authority in browser storage.

Logout removes the corresponding session from PostgreSQL and clears the cookie.

## Authorization and Data Ownership

Authentication answers:

**Who is making this request?**

Authorization answers:

**Is that user permitted to access this resource?**

These are separate responsibilities.

Each catch has a `user_id` referencing its owner.

Database queries enforce ownership directly:

```sql
SELECT id, fish, length
FROM catches
WHERE user_id = $1;
```

Updates and deletions include both the catch ID and authenticated user ID in their `WHERE` clauses.

Consequently, knowing another user's catch ID does not grant permission to modify or delete it.

An attempt to update or delete a catch that is not owned by the authenticated user returns `404 Not Found`, without exposing whether another user's record exists.

Ownership is enforced by the API and database queries, not by trusting a user ID supplied by the frontend.

## Database and Persistence

PostgreSQL is the persistent source of truth for:

- Users
- Sessions
- Catches
- Catch ownership

The database schema evolved through three SQL migrations:

| Migration | Purpose |
| --- | --- |
| `001_create_catches.sql` | Initial catch table |
| `002_create_auth_tables.sql` | Users and sessions |
| `003_add_catch_ownership.sql` | Associate catches with users |

The third migration also contains a backfill for existing catches using user ID `1`. This reflects the project's incremental migration from a single-user application.

It is not a general-purpose migration strategy for arbitrary existing datasets.

The application uses the `pg` connection pool and parameterized SQL queries. There is no ORM or automated migration framework.

Database constraints provide an additional validation boundary, including positive catch lengths, unique usernames, foreign keys, and non-null ownership.

## API Endpoints

### Authentication

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/auth/register` | Register a user |
| `POST` | `/auth/login` | Create a session |
| `POST` | `/auth/logout` | Invalidate a session |
| `GET` | `/auth/me` | Resolve the current user |

### Catches

All catch endpoints require authentication.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/catches` | List the current user's catches |
| `POST` | `/catches` | Create a catch |
| `PATCH` | `/catches/:id` | Update an owned catch |
| `DELETE` | `/catches/:id` | Delete an owned catch |

The API also exposes `GET /health`.

Request bodies and route parameters are validated on the server using Fastify schemas.

The frontend separately validates catch form inputs using Zod for immediate user feedback.

Client-side validation improves usability; server-side validation establishes the API's input boundary.

## Frontend Architecture

The frontend builds on the completed React From Principles application.

Rather than rebuilding its components, the project changes how application data is obtained, updated, and trusted.

### Authentication State

`AuthProvider` manages the current user's frontend authentication state.

It checks the existing session on startup and exposes login, logout, and session invalidation operations.

Unauthenticated users see the authentication screen instead of the catch-management interface.

### Catch State

`CatchProvider` owns the client-side catch collection and its loading and error states.

It loads catch records from the API rather than initializing them from `localStorage`.

The provider also supports retrying failed loads and cancelling active requests.

### Feature Behavior

`useCatchLog` coordinates catch-management behavior:

- Form state and validation
- Creating, editing, and deleting catches
- Search and sorting
- Derived statistics
- Loading and mutation feedback
- Focus management

This keeps feature behavior separate from the components responsible for rendering it.

### Server State Versus UI State

The frontend maintains a local representation of server data so React can render it.

However, that representation is not the persistent source of truth.

For example, a successful catch creation follows this flow:

```text
Form submission
       |
       v
Zod validation
       |
       v
POST /catches
       |
       v
Fastify validation + authentication
       |
       v
PostgreSQL INSERT
       |
       v
201 Created + saved catch
       |
       v
Update React catch state
       |
       v
Render new catch
```

A failed request must not be presented as a successful persistent operation.

This is one of the main differences between local React state management and full-stack application state management.

## Asynchronous Operations and Failure Handling

HTTP introduces uncertainty that does not exist when directly updating an in-memory array.

Requests can fail, be delayed, or complete after a newer request.

The application handles several of these cases explicitly.

### Loading and Retry

Catch loading distinguishes between:

- Data still loading
- Data successfully loaded
- A genuinely empty catch collection
- A failed request

This prevents a backend outage from being mistaken for an empty database.

A failed load can be retried after connectivity is restored.

### Request Cancellation

Catch-loading requests use `AbortController`.

Starting a new load aborts the previous active request. The provider also checks whether a response belongs to the current request before applying its result.

This prevents stale catch-loading responses from overwriting newer state.

### Mutation Guards

Creating, updating, and deleting catches use guards to prevent overlapping duplicate operations.

These guards address repeated frontend interactions; they are not a substitute for server-side idempotency guarantees.

### HTTP Errors

The frontend checks response status codes rather than treating every completed `fetch` as success.

A non-success HTTP response is distinct from a network-level failure.

Unauthorized responses can invalidate the frontend's authenticated state, while other failures are surfaced to the user.

## Testing

The repository contains frontend and backend tests.

### Frontend

Vitest and React Testing Library exercise rendered application behavior, including forms, routing, validation, and catch-management interactions.

The full-stack work also adds regression coverage for authentication invalidation and stale-request behavior.

### Backend

Fastify's injection interface allows tests to exercise HTTP routes without starting a separately listening network server.

Backend tests cover authentication and catch authorization, including user ownership boundaries.

### Database Safety

Backend tests use a separate database configuration from `server/.env.test`.

Before the test suite runs, its global setup checks for a specific marker in the database:

```text
fullstack-from-principles-test
```

The marker is created by `server/test/setup-test-database.sql`.

The test suite refuses to proceed if the expected database identity is missing or incorrect.

This is a deliberate safeguard against running database-mutating tests against the wrong database.

## Running Locally

### Prerequisites

- Node.js with npm
- PostgreSQL
- A PostgreSQL user with permission to create and modify the project databases

The project uses npm workspaces, so dependencies can be installed from the repository root.

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure PostgreSQL

Create a development database and a separate test database.

For example:

```sql
CREATE DATABASE fullstack_dev;
CREATE DATABASE fullstack_test;
```

These are example database names; the application uses the connection string rather than relying on a particular database name.

### 3. Configure Environment Variables

Copy:

```text
server/.env.example
```

to:

```text
server/.env
```

Set the development database connection string:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/fullstack_dev
```

Replace the placeholders with your local PostgreSQL credentials.

The server requires `DATABASE_URL`.

### 4. Apply Database Migrations

Migrations are applied manually in filename order.

From the repository root:

```bash
psql -d fullstack_dev -v ON_ERROR_STOP=1 -f server/migrations/001_create_catches.sql
psql -d fullstack_dev -v ON_ERROR_STOP=1 -f server/migrations/002_create_auth_tables.sql
psql -d fullstack_dev -v ON_ERROR_STOP=1 -f server/migrations/003_add_catch_ownership.sql
```

These examples assume your PostgreSQL command-line connection is already configured for the intended local database.

For a fresh empty database, the migrations establish the required tables and ownership relationship.

For an existing database containing catches, migration `003` requires an appropriate user with ID `1` before its backfill can succeed.

### 5. Start the Backend

From the repository root:

```bash
npm run dev:server
```

The Fastify API listens on:

```text
http://127.0.0.1:3001
```

### 6. Start the Frontend

In another terminal:

```bash
npm run dev:client
```

Open:

```text
http://localhost:5173
```

The development frontend is configured to communicate with the API on port `3001`.

The current CORS configuration permits the local Vite development origin.

### 7. Configure the Test Database

Create `server/.env.test` with a `DATABASE_URL` pointing to the separate test database.

Apply the three migrations to that database, then apply:

```bash
psql -d fullstack_test -v ON_ERROR_STOP=1 -f server/test/setup-test-database.sql
```

**Do not point `.env.test` at your development or production database.**

The test suite performs a database identity check, but the test database should still be isolated and disposable.

### 8. Run Verification

From the repository root:

```bash
npm run lint
npm run build
npm run test:client
npm run test:server
```

The server tests require the configured test database.

## Engineering Lessons

### The Server Must Be the Authority

In a frontend-only application, updating state can immediately change the application data.

In a full-stack application, updating React state does not mean the database operation succeeded.

The server's response becomes part of the state transition.

### Authentication and Authorization Are Different

An authenticated user is not automatically authorized to access every record.

Authorization must be enforced for each protected operation using trusted server-side identity.

### HTTP Success and Network Success Are Different

A completed HTTP request may return an error status.

A network failure may prevent any HTTP response from arriving.

Both cases need explicit handling.

### Asynchronous State Requires Ownership

An asynchronous response should only update application state if it is still relevant.

Request cancellation, stale-response checks, and mutation guards make that relationship explicit.

### Database Design Is Part of Application Behavior

Foreign keys, constraints, uniqueness, and ownership relationships are not merely storage details.

They help enforce the assumptions on which application logic depends.

### Tests Need Their Own Safety Boundaries

A test suite that mutates a real database must establish which database it is allowed to use.

The explicit test-database identity check is an example of treating test infrastructure as engineering work rather than an afterthought.

## Limitations and Scope

This is a local full-stack engineering learning project, not a production-ready application.

Current limitations include:

- Local development URLs and ports are hardcoded.
- The session cookie is configured for local HTTP rather than HTTPS deployment.
- Database migrations are applied manually.
- The third migration contains a project-specific ownership backfill.
- There is no password reset or email verification.
- There is no rate-limiting implementation for authentication endpoints.
- There is no dedicated CSRF-token protection mechanism.
- There is no deployment pipeline or production infrastructure configuration.
- Client-side server state is managed manually rather than through a query library.
- The project does not implement a complete production security, observability, or operations model.

These limitations are documented to distinguish the implemented learning objectives from additional work required for a production service.

## Outcome

The completed project connects the two earlier learning projects into one end-to-end application.

**HTTP From Scratch** explored server-side request processing and persistence.

**React From Principles** explored frontend rendering, state, interactions, and component architecture.

**Fullstack From Principles** explores the boundary between them:

```text
User interaction
      |
      v
React state and validation
      |
      v
HTTP request
      |
      v
Server validation
      |
      v
Authentication and authorization
      |
      v
PostgreSQL
      |
      v
HTTP response
      |
      v
Client state reconciliation
      |
      v
Updated interface
```

The most important outcome is a clearer understanding of where data lives, which layer is responsible for each decision, and how to maintain correct application behavior when requests, sessions, and persistence can fail.

## License

MIT