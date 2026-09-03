#!/usr/bin/env bash
# Shared helper: read one field from the hook's JSON stdin payload.
# Usage: value=$(json_field "$input" "tool_input.file_path")
#
# Fails closed: if node is missing or the payload is not valid JSON, a
# sentinel is returned and callers must deny (see hook_input_error).
HOOK_JSON_ERROR="__HOOK_JSON_ERROR__"

json_field() {
  if ! command -v node >/dev/null 2>&1; then
    printf '%s' "$HOOK_JSON_ERROR"
    return
  fi
  printf '%s' "$1" | node -e '
    let raw = ""
    process.stdin.on("data", (c) => (raw += c)).on("end", () => {
      try {
        const value = process.argv[1]
          .split(".")
          .reduce((acc, key) => (acc == null ? acc : acc[key]), JSON.parse(raw))
        process.stdout.write(value == null ? "" : String(value))
      } catch {
        process.stdout.write("__HOOK_JSON_ERROR__")
      }
    })
  ' "$2"
}

# Returns 0 when the extracted value signals a parse/runtime failure.
hook_input_error() {
  [ "$1" = "$HOOK_JSON_ERROR" ]
}
