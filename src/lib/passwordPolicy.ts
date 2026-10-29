export const PASSWORD_POLICY = {
  MIN_LENGTH: 12,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: true,
  SPECIAL_CHARS: "!@#$%^&*()_+-=[]{}|;:,.<>?",
} as const;

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < PASSWORD_POLICY.MIN_LENGTH) {
    errors.push(
      `Password must be at least ${PASSWORD_POLICY.MIN_LENGTH} characters long`,
    );
  }

  if (PASSWORD_POLICY.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (PASSWORD_POLICY.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (PASSWORD_POLICY.REQUIRE_NUMBER && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (PASSWORD_POLICY.REQUIRE_SPECIAL) {
    const specialCharsRegex = new RegExp(
      `[${PASSWORD_POLICY.SPECIAL_CHARS.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      )}]`,
    );

    if (!specialCharsRegex.test(password)) {
      errors.push("Password must contain at least one special character");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/** Generate a policy-compliant temporary password using browser cryptography. */
export function generatePassword(length = 16): string {
  const groups = ["abcdefghijkmnpqrstuvwxyz", "ABCDEFGHJKLMNPQRSTUVWXYZ", "23456789", "!@#$%"];
  const randomIndex = (max: number) => {
    const values = new Uint32Array(1);
    const ceiling = Math.floor(0x100000000 / max) * max;
    do { globalThis.crypto.getRandomValues(values); } while (values[0] >= ceiling);
    return values[0] % max;
  };
  const all = groups.join("");
  const chars = groups.map((group) => group[randomIndex(group.length)]);
  while (chars.length < Math.max(length, PASSWORD_POLICY.MIN_LENGTH)) chars.push(all[randomIndex(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
