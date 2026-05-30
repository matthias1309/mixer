#!/usr/bin/env bash
# Hook: PreToolUse
# Receives tool name and input via stdin as JSON.
# Exit code 0 = allow, non-zero = block the tool call.

LOG_DIR="$(dirname "$0")/../logs"
mkdir -p "$LOG_DIR"

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | grep -o '"tool_name":"[^"]*"' | head -1 | cut -d'"' -f4)
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] $TOOL_NAME" >> "$LOG_DIR/tool-use.log"

exit 0
