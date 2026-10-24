# React From Principles

A frontend engineering learning project built with React and TypeScript to understand the abstractions behind modern component-driven user interfaces.

Rather than starting with a large application framework or relying heavily on prebuilt state, form, data-fetching, or UI libraries, this project builds a small interactive application primarily with React's own primitives.

The goal was not simply to build a catch logger. The goal was to understand how React manages rendering, state, events, shared data, effects, routing, validation, asynchronous work, and component architecture by implementing those concerns directly.

## Why I Built This

After completing **HTTP From Scratch**, I had a much stronger understanding of what happens on the server side of a web application:

```text
request
↓
routing
↓
parsing
↓
validation
↓
application logic
↓
persistence
↓
response
```

The next step was to understand the frontend side with the same level of deliberate practice.

I had already worked with larger React and full-stack TypeScript applications, often with significant AI assistance, but wanted to become comfortable reading and writing the underlying code myself.

This project therefore focuses on the mechanics normally hidden behind higher-level frontend abstractions:

```text
user interaction
↓
event handler
↓
state transition
↓
React render
↓
derived UI
↓
browser DOM
```

The application gradually evolved from a single component into a small structured React application with routing, shared state, custom hooks, validation, asynchronous data, testing, accessibility, and error handling.

## Stack

- React
- TypeScript
- Vite
- React Router
- Zod
- Vitest
- React Testing Library
- CSS Modules
- Native browser `fetch`
- `localStorage`

Deliberately not introduced as primary abstractions:

- Redux
- Zustand
- TanStack Query
- React Hook Form
- Formik
- Next.js
- A component library
- A backend API
- A database

Those concerns are intentionally left for later projects so the React primitives remain visible.

## Application

The application is a small shore-fishing catch log.

Users can:

- View catches
- Add catches
- Edit catches
- Delete catches
- Search catches by species
- Sort catches by length
- Switch displayed measurement units
- Open individual catch detail routes
- View statistics
- Load species information asynchronously
- Persist catches between page reloads

The catch log became a useful domain because even a small collection of records naturally introduces state, forms, validation, lists, derived data, routing, shared state, and persistence.

## React State and Rendering

The project began with local component state using `useState`.

This introduced the core React flow:

```text
state
↓
render
↓
user interaction
↓
state update
↓
render again
```

Controlled form inputs make React state the source of truth:

```text
input value
↓
React state
↓
onChange
↓
state update
↓
new rendered value
```

Catch creation, editing, and deletion all use immutable state transitions rather than mutating existing arrays.

## Lists and Derived State

Catches are rendered from arrays using `.map()` and stable IDs as React keys.

Derived values include:

- Total catch count
- Longest catch
- Search results
- Sorted catch lists
- Display values converted between centimetres and inches

These values are calculated from existing state rather than stored independently where possible.

For example:

```text
catches
↓
search
↓
filtered catches
↓
sort order
↓
sorted catches
↓
render
```

This helped reinforce the distinction between source state and values that can be derived from it.

## Forms and Validation

The catch form began with manual validation and gradually evolved into schema-based validation using Zod.

Raw HTML form state remains string-based:

```text
fish: string
length: string
```

The validation boundary then performs:

```text
raw form input
↓
Zod schema
↓
validation
↓
type coercion
↓
trusted form data
```

The length field is coerced from a string into a number only after successful validation.

Field-specific errors are represented explicitly and connected to their corresponding inputs using accessible attributes.

Invalid submission also moves focus to the first invalid field.

## `useReducer`

As form behavior became more complex, multiple independent state updates were replaced with `useReducer`.

The reducer receives named actions such as:

```text
fishChanged
lengthChanged
startEditing
cancelEditing
validationFailed
reset
```

The flow becomes:

```text
UI event
↓
dispatch action
↓
reducer
↓
next form state
↓
render
```

This made state transitions explicit and demonstrated when a reducer can be easier to reason about than several unrelated state setters.

## Custom Hooks

Several custom hooks were introduced as responsibilities became clearer.

### `useLocalStorage`

A generic persistence hook encapsulates synchronization between React state and browser `localStorage`.

Conceptually:

```text
initial render
↓
read stored value
↓
React state
↓
state changes
↓
effect
↓
localStorage
```

### `useSpecies`

Species loading was extracted into its own asynchronous hook.

It owns:

- Loading state
- Data state
- Error state
- Fetching
- `response.ok` checking
- `AbortController`
- Cleanup when the consuming component unmounts

### `useCatchLog`

The main catch-log feature behavior was eventually extracted from the page.

It owns:

- Catch collection access
- Form reducer state
- Validation
- Form refs
- Add behavior
- Edit behavior
- Delete behavior
- Search state
- Sorting state
- Filtering
- Derived catch statistics
- Focus behavior

This allowed the page component to become primarily a composition and rendering layer.

The boundary is approximately:

```text
CatchLogPage
↓
semantic feature operations
↓
useCatchLog
↓
React primitives / context / validation
```

The page no longer needs to know the reducer's internal action names or mutation implementation.

## Context and Shared State

Catch data initially lived directly inside the catch-log page.

Routing created a requirement for multiple pages to access the same collection, so the state was lifted into React Context.

The context architecture is separated into:

```text
CatchContext
↓
shared value definition

CatchProvider
↓
owns and provides catch state

useCatches
↓
consumer API
```

This enables both the catch list and individual detail routes to access the same application state without prop drilling.

A separate unit context handles the user's display-unit preference.

## Routing

React Router introduces multiple application pages.

The application includes:

- Catch-log route
- Statistics route
- Dynamic catch-detail route
- Shared layout route
- Navigation
- Not-found handling for unknown catch IDs

Dynamic routes follow the flow:

```text
/catches/:id
↓
useParams()
↓
string route parameter
↓
number conversion
↓
find matching catch
↓
render catch or not-found state
```

A shared `AppLayout` uses an `Outlet` so navigation and common page structure do not need to be repeated.

## Asynchronous Data

The statistics page loads species data using the browser `fetch` API.

The hook explicitly models:

```text
loading
↓
success
```

or:

```text
loading
↓
failure
↓
error UI
```

Request cleanup uses `AbortController`:

```text
effect starts
↓
fetch begins
↓
component unmounts
↓
cleanup runs
↓
request aborted
```

This provided an introduction to asynchronous React behavior before introducing a dedicated server-state library.

## Memoization and Stable References

The project also explores:

- `useMemo`
- `useCallback`
- `React.memo`

These were introduced only after there was an actual relationship between derived values, callback identity, and memoized child components.

For example:

```text
catches/search/sort change
↓
useMemo recalculates visible catches
```

while stable callbacks prevent memoized children from receiving a new function identity unnecessarily.

The goal was to understand what memoization does rather than apply it automatically.

## Refs and Focus Management

`useRef` is used to retain direct references to form inputs without causing renders.

This supports flows such as:

```text
start editing
↓
populate form
↓
focus fish input
```

and:

```text
validation fails
↓
find first invalid field
↓
focus corresponding input
```

This demonstrates the distinction between React state and mutable values that do not affect rendering.

## Accessibility

Accessibility was treated as part of the application structure rather than a final visual pass.

The application includes:

- Semantic page landmarks
- Semantic navigation
- Lists using `ul` and `li`
- Explicit form labels
- `aria-invalid`
- `aria-describedby`
- Validation messages using `role="alert"`
- Focus movement after validation failures
- Accessible links and buttons
- Tests using semantic queries such as `getByRole()` and `getByLabelText()`

Using accessible Testing Library queries also helped expose weak markup during development.

## Styling

Component-specific styles use CSS Modules.

For example:

```text
CatchForm.module.css
CatchItem.module.css
CatchControls.module.css
```

Global styling remains in the application stylesheet.

Shared CSS design tokens define common values such as:

- Control height
- Border radius
- Spacing
- Content width

This keeps styling scoped while still allowing application-wide design decisions to remain centralized.

## Error Boundaries

The application includes a React Error Boundary around the routed application.

Expected application states such as validation errors, failed fetches, and missing catches are handled normally.

An Error Boundary handles a different category:

```text
unexpected descendant render error
↓
Error Boundary
↓
fallback application UI
```

The boundary also receives the captured error and component information through `componentDidCatch()`.

A dedicated test deliberately renders a component that throws and verifies that the fallback UI replaces the failed subtree.

## Testing

The project uses Vitest and React Testing Library.

Coverage includes several levels.

### Component Tests

Individual components are tested for:

- Rendering
- Props
- Callback execution
- Controlled input behavior
- Submission
- Edit mode
- Validation messages
- Accessibility state

### Integration Tests

Larger application flows cover:

- Adding a catch
- Editing a catch
- Deleting a catch
- Validation behavior
- Validation error clearing

These tests interact with the application through the rendered UI rather than calling internal implementation functions directly.

### Routing Tests

Routing tests use an in-memory router and cover:

- Navigation to catch details
- Valid dynamic routes
- Invalid catch IDs
- Shared navigation and page landmarks

### Schema Tests

The Zod schema is tested independently for:

- Successful input
- Type coercion
- Invalid fish names
- Invalid lengths

### Error Boundary Test

A deliberately broken child component verifies that unexpected rendering failures produce fallback UI.

Before release, the project is validated through:

```bash
npm run test -- --run
npm run lint
npm run build
```

## Project Structure

The application is organized by responsibility:

```text
src/
├── components/
│   ├── CatchControls.tsx
│   ├── CatchForm.tsx
│   ├── CatchItem.tsx
│   ├── CatchList.tsx
│   └── ErrorBoundary.tsx
│
├── context/
│   ├── CatchContext.ts
│   ├── CatchProvider.tsx
│   ├── UnitContext.ts
│   └── useCatches.ts
│
├── hooks/
│   ├── useCatchLog.ts
│   ├── useLocalStorage.ts
│   └── useSpecies.ts
│
├── layouts/
│   └── AppLayout.tsx
│
├── pages/
│   ├── CatchDetailPage.tsx
│   ├── CatchLogPage.tsx
│   └── StatsPage.tsx
│
├── schemas/
│   └── catchFormSchema.ts
│
├── types/
│   └── Catch.ts
│
├── integration/
│   ├── CatchLogPage.test.tsx
│   └── Routing.test.tsx
│
├── test/
│   └── setup.ts
│
├── App.tsx
└── main.tsx
```

Test files for individual components and schemas are colocated with the code they exercise.

## Running Locally

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Run the test suite:

```bash
npm run test -- --run
```

Run ESLint:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

## What the Project Explores

A useful way to view the project is as an exploration of responsibilities that higher-level frontend libraries can later abstract.

| Implemented here | Common higher-level abstraction |
| --- | --- |
| Controlled form state | Form library |
| Manual validation flow | Form/schema integration |
| Context provider | Application state library |
| `useLocalStorage` | Persistence abstraction |
| `useSpecies` | Server-state library |
| Manual loading/error state | Query library |
| Reducer actions | State-management abstraction |
| `useMemo` / `useCallback` | Performance abstraction |
| React Router routes | Framework routing |
| CSS Modules | Styling system |
| Error Boundary | Application error handling |

The purpose was not to argue against those abstractions.

It was to understand the responsibilities they take over well enough to use them deliberately later.

## Key Takeaways

The largest lesson from the project was that React is primarily a system for describing how UI should follow application state.

```text
state
↓
render
↓
interaction
↓
state transition
↓
render
```

As the application became larger, another pattern became increasingly important:

```text
data ownership
≠
feature behavior
≠
derived data
≠
presentation
```

For example:

```text
CatchProvider
↓
owns shared catch data

useCatchLog
↓
owns catch-log feature behavior

CatchLogPage
↓
composes and renders the feature
```

The project also reinforced that abstractions become easier to understand when introduced after encountering the problem they solve.

`useReducer`, Context, custom hooks, memoization, schema validation, and error boundaries were therefore added incrementally rather than at the beginning.

## Limitations

This is a frontend learning project rather than a production application.

Some intentional limitations include:

- Catch data is stored in browser `localStorage`
- There is no backend API
- There is no database
- There are no user accounts
- There is no authentication
- There is no authorization
- Data synchronization between devices is not supported
- Species data is loaded from a static JSON resource
- Server-state management is handled manually rather than through a query library
- The application does not attempt to demonstrate every React API or ecosystem library

These limitations are deliberate because they define the boundary between this project and the next stage of the learning sequence.

## Scope

**React From Principles** is not intended to be a complete production frontend architecture.

It deliberately builds on mature primitives:

- React
- React Router
- Vite
- TypeScript
- Browser APIs
- Zod
- Vitest
- React Testing Library

The "from principles" approach refers to learning the important React abstractions directly before introducing more powerful framework and ecosystem layers.

## Outcome

The finished application can now be traced across the frontend:

```text
user interaction
↓
event handler
↓
feature hook
↓
validation / state transition
↓
shared or local React state
↓
derived data
↓
component render
↓
browser UI
```

It also represents a progression from the previous project.

**HTTP From Scratch** explored what happens behind the server-side abstractions of a web application.

**React From Principles** explores what happens behind the frontend abstractions.

The next stage is to join those two mental models together in a full-stack application:

```text
React UI
↓
HTTP request
↓
server
↓
authentication / authorization
↓
application logic
↓
database
↓
HTTP response
↓
client state
↓
React render
```

That project will replace browser-local persistence with real server-side persistence and introduce database-backed CRUD, authentication, authorization, client/server validation, server state, and production-oriented full-stack architecture.

## License

MIT