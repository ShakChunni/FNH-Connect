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
