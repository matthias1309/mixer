// Recipe endpoints are publicly readable, so a creator's email address must
// never leave the API verbatim (PII). Only the local part (before "@") is
// exposed as the display name.

export function displayNameFromEmail(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex === -1) {
    return email;
  }
  return email.slice(0, atIndex);
}

// SQL fragment mirroring displayNameFromEmail for list queries that resolve
// the creator via JOIN. Falls back to the raw value when it contains no "@".
export const CREATOR_NAME_SQL = `CASE
  WHEN instr(users.email, '@') > 0 THEN substr(users.email, 1, instr(users.email, '@') - 1)
  ELSE users.email
END as creatorName`;
