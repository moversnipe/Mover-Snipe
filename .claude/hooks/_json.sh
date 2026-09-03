#!/usr/bin/env bash
# Shared helper: read one field from the hook's JSON stdin payload.
# Usage: value=$(json_field "$input" "tool_input.file_path")
json_field() {
  printf '%s' "$1" | node -e '
    let raw = ""
    process.stdin.on("data", (c) => (raw += c)).on("end", () => {
      try {
        const value = process.argv[1]
          .split(".")
          .reduce((acc, key) => (acc == null ? acc : acc[key]), JSON.parse(raw))
        process.stdout.write(value == null ? "" : String(value))
      } catch {
        process.stdout.write("")
      }
    })
  ' "$2"
}
