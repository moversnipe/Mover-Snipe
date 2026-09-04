---
paths:
  - "src/features/**"
  - "src/app/api/**"
  - "src/app/**/route.ts"
  - "src/lib/**"
  - "supabase/migrations/**"
  - "supabase/functions/**"
---

# Agent-ready design rules

Later stages add an in-app AI chat and an MCP server that expose this product's
capabilities to non-human callers. **Neither exists yet, and nothing here asks
you to build them now.** These rules keep the door open: every process,
endpoint, and table written before then must be callable, and its data legible,
without a rewrite.

Read this as design pressure on new work, not as a description of the code that
is already here. When you touch existing code that breaks a rule, bring it in
line if the change is small; otherwise leave it and say so.

## 1. One capability, one named function

Domain work lives in a named, exported, typed function in
`src/features/<domain>/` — reads in `queries.ts`, writes in `actions.ts` or a
helper module beside it. Everything else is a **transport adapter**: a form
action parses `FormData`, a Route Handler parses a request, a chat tool will
parse a model's arguments, and all three call the same function. Logic that
exists only inside a component, an event handler, or a `route.ts` has exactly
one caller forever.

When an action grows past _parse → authenticate → do the work → map the result_,
move the work into its own function and let the action call it.

Keep modules readable in one pass. When a feature's `queries.ts` or `actions.ts`
grows past a handful of capabilities, split by concept into named modules beside
it (`search.ts`, `imports.ts`) and import the concrete module — never a barrel.
A file that has to be read whole to understand one function costs every reader
that comes after it.

## 2. Plain typed input, plain serialisable output

A capability takes one validated object and returns JSON-serialisable data:
strings, numbers, booleans, arrays, plain objects, ISO strings for time, integer
minor units for money. `FormData`, `Request`, `Response`, and class instances
belong to the adapter, never below it.

## 3. Rows explain themselves

What a capability returns should be understandable without opening another file.
Full words instead of abbreviations, database enum values instead of display
strings, timestamps in UTC, amounts in minor units with their currency beside
them, and `null` for absent — never a sentinel such as `0`, `""`, or `"none"`.
Formatting for humans happens at render time. Return the row's id and whatever a
follow-up write will need, so a caller can act on what it just read without a
second lookup.

## 4. The Zod schema is the contract

Every input has a schema in the feature's `schemas.ts`, exported and shared by
client validation, the Server Action, and any future tool definition. Prefer
narrow types (enums over free strings, `.max()` on text, coercion at the edge)
and add `.describe()` to any field whose meaning is not obvious from its name —
that sentence is what a model will read. One schema per capability; never hand a
caller `z.any()` or an open record.

## 5. Say what it does in one line

Every exported query, action, and handler opens with a doc comment naming what
it does, who may call it, what it returns, and whether it changes anything.
Write it for a caller that cannot read the body. Those sentences become tool
descriptions later; a capability that cannot be described in one line is doing
too much.

## 6. One word per concept, everywhere

The database column, the TypeScript field, the Zod key, the API field, and the
label a user sees for one thing all use the same word — allowing only for this
repo's mechanical `snake_case` in SQL and `camelCase` in TypeScript. A concept
that is `owner_id` in the database, `agentId` in TypeScript, and "rep" in the UI
forces every reader to carry a translation table, and a model will guess wrong.
Rename across every layer in one commit, or not at all.

## 7. Stable, enumerable contracts

Paths come from `ROUTES`, failures from `ErrorCode`, results from `ActionResult`
or the `{ data } | { error }` envelope. Never invent a response shape, and never
put information in a message string that a caller has to parse in order to
branch. Exported names, route paths, error codes, and schema fields are public
API: renaming one is a breaking change, so do it deliberately.

## 8. Authorisation belongs to the data, not the caller

Every entry point authenticates on its own (`getUser` / `getUserOrThrow`) and
does its work under RLS as that user, so a new caller inherits exactly the
user's permissions. An agent acting for a user must never be able to do more
than that user can do in the UI. Never add a "trusted", "internal", or "service"
path that skips the check, and never reach for the admin client to make a
capability easier to call.

## 9. Writes are retry-safe and honest about consequences

Agents retry. Every write must be safe to run twice: a natural unique
constraint, an upsert, or `runOnce` for events. Anything that spends money,
sends mail, or contacts a third party gets its own narrowly named function
(`sendCampaignEmail`, not `save`) so a confirmation step can be put in front of
it later, and it never hides inside something that reads as a query.

## 10. Reads are bounded and ordered

Every list read takes a `limit` with a hard maximum, a deterministic order, and
explicit columns, and pages with a cursor rather than a bigger limit. HTTP
responses and context windows are both finite; a read that can return the whole
table is not safe to expose.

## 11. A process is a sequence of callable steps

Multi-step flows keep their state in the database, not in a component or a
wizard's memory. Each step is its own capability with its own validated input,
its own result, and enough returned state to start the next one. A step that
only works because the previous screen is still open cannot be driven by
anything but that screen.

## 12. The schema is documentation

Use `comment on table` / `comment on column` for anything a caller must
interpret, enums instead of free-text status columns, and domain words instead
of abbreviations. An agent answers questions by reading the schema, and
`status text` with five undocumented values answers nothing.

## 13. Log the fact, not the payload

Every capability with a side effect logs one `logger` line with a stable event
name and the ids involved — never payloads or secrets — so an agent-triggered
write is as auditable as a human one.

## When the AI features arrive

They land as ordinary features under `src/features/`: chat UI and tool
definitions in their own module, tools that wrap the existing feature functions
instead of re-implementing them, and an MCP surface exposing those same
functions behind the same authentication and RLS. Nothing above changes when
they do — that is the point. Until that stage is scheduled, do not add AI SDKs,
chat tables, or placeholder routes.
