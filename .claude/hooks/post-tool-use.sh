#!/usr/bin/env bash
# Hook: PostToolUse
# Runs after a tool completes. Exit code is ignored — notification-only.

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | grep -o '"tool_name":"[^"]*"' | head -1 | cut -d'"' -f4)

if [[ "$TOOL_NAME" == "Write" || "$TOOL_NAME" == "Edit" ]]; then
  FILE_PATH=$(echo "$INPUT" | grep -o '"file_path":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [[ "$FILE_PATH" =~ \.(ts|tsx|js|jsx)$ ]]; then
    echo "Hint: run 'npm run lint -- $FILE_PATH' to check for style issues." >&2
  fi
fi

exit 0
