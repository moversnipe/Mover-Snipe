---
paths:
  - "src/features/**/actions.ts"
  - "src/app/**/actions.ts"
---

# Server Action rules

Every Server Action follows the same contract so forms and buttons can be
wired identically.

- File starts with `"use server"`. Only async functions are exported. Types are `export type`.
- Signature for form actions: `async (_prev: ActionResult<T> | undefined, formData: FormData): Promise<ActionResult<T>>`. Signature for button actions: `async (): Promise<ActionResult<T>>`.
- Exception: a redirect-only action that takes no input and always ends in `redirect()` (for example `signOut`) may be typed `Promise<void>` and bound directly to `<form action={...}>`. Say so in its doc comment.
- Return values only ever come from `src/lib/actions/result.ts`: `ok(data)`, `fail(code, message)`, `failValidation(zodError)`, `failFromError(error)`. Never throw to the client and never return raw strings.
- Validate every input with a Zod schema from the feature's `schemas.ts` (or a local schema for single fields). Read fields explicitly (`formData.get("email")`), not `Object.fromEntries` on the whole form.
- Authenticate inside the action with `getUser()`; return `fail(ErrorCode.UNAUTHENTICATED, ...)` when null. The proxy and layout checks are not sufficient on their own.
- Authorise against the database with the user's client so RLS applies. Re-check any id the client sent (price ids, record ids) against the database before acting on it.
- `redirect()` throws a special error. Call it outside `try/catch`, after all validation, or it will be swallowed.
- After a mutation, call `revalidatePath`/`revalidateTag` for the affected routes.
- Log failures with `logger.error` including ids, never secrets or full payloads. Expected auth outcomes (bad credentials, a password the provider rejects) are `logger.warn`, since they are user error rather than a fault.
- Client side: bind with `useActionState(action, undefined)`; show `fieldError(state, "field")` under inputs and `formError(state)` for the error or confirmation that belongs to the form as a whole; use `useFormStatus()` in a child submit button when pending state is needed there. (`useActionState` replaced React's old `useFormState`; `useFormStatus` is current and correct.)
