import { secureRandomIndex, secureShuffleArray } from "@/lib/utils";

export interface PasswordRequirement {
  id: keyof PasswordStrengthResult;
  label: string;
  test: (password: string) => boolean;
}

export interface PasswordStrengthResult {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
  hasSpecialChar: boolean;
  isStrong: boolean;
  score: number; // 0-5 scale
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigit: boolean;
  requireSpecialChar: boolean;
}

// Default password policy
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecialChar: true,
};

// Special characters allowed in passwords
const SPECIAL_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

/**
 * Evaluate password against policy
 */
export function evaluatePasswordStrength(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): PasswordStrengthResult {
  const minLength = password.length >= policy.minLength;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecialChar = new RegExp(`[${SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}]`).test(password);

  // Calculate score (0-5)
  let score = 0;
  if (minLength) score += 1;
  if (hasUppercase) score += 1;
  if (hasLowercase) score += 1;
  if (hasDigit) score += 1;
  if (hasSpecialChar) score += 1;

  const isStrong =
    minLength &&
    (!policy.requireUppercase || hasUppercase) &&
    (!policy.requireLowercase || hasLowercase) &&
    (!policy.requireDigit || hasDigit) &&
    (!policy.requireSpecialChar || hasSpecialChar);

  return {
    minLength,
    hasUppercase,
    hasLowercase,
    hasDigit,
    hasSpecialChar,
    isStrong,
    score,
  };
}

/**
 * Get password requirements based on policy
 */
export function getPasswordRequirements(
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): PasswordRequirement[] {
  const requirements: PasswordRequirement[] = [
    {
      id: "minLength",
      label: `At least ${policy.minLength} characters`,
      test: (password) => password.length >= policy.minLength,
    },
  ];

  if (policy.requireUppercase) {
    requirements.push({
      id: "hasUppercase",
      label: "At least one uppercase letter (A-Z)",
      test: (password) => /[A-Z]/.test(password),
    });
  }

  if (policy.requireLowercase) {
    requirements.push({
      id: "hasLowercase",
      label: "At least one lowercase letter (a-z)",
      test: (password) => /[a-z]/.test(password),
    });
  }

  if (policy.requireDigit) {
    requirements.push({
      id: "hasDigit",
      label: "At least one digit (0-9)",
      test: (password) => /[0-9]/.test(password),
    });
  }

  if (policy.requireSpecialChar) {
    requirements.push({
      id: "hasSpecialChar",
      label: `At least one special character (${SPECIAL_CHARS})`,
      test: (password) => 
        new RegExp(`[${SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}]`).test(password),
    });
  }

  return requirements;
}

/**
 * Generate a strong password meeting the policy
 */
export function generateStrongPassword(
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const specials = SPECIAL_CHARS;

  let password = "";

  // Add one of each required character type, using cryptographically secure indices
  if (policy.requireUppercase) {
    password += uppercase[secureRandomIndex(uppercase.length)];
  }
  if (policy.requireLowercase) {
    password += lowercase[secureRandomIndex(lowercase.length)];
  }
  if (policy.requireDigit) {
    password += digits[secureRandomIndex(digits.length)];
  }
  if (policy.requireSpecialChar) {
    password += specials[secureRandomIndex(specials.length)];
  }

  // Fill remaining length with random characters from all character sets
  let allChars = lowercase;
  if (policy.requireUppercase) allChars += uppercase;
  if (policy.requireDigit) allChars += digits;
  if (policy.requireSpecialChar) allChars += specials;

  while (password.length < policy.minLength) {
    password += allChars[secureRandomIndex(allChars.length)];
  }

  // Shuffle password characters securely using a Fisher-Yates shuffle with secure randomness
  return secureShuffleArray(password.split("")).join("");
}

/**
 * Get strength label for display
 */
export function getStrengthLabel(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return "Very Weak";
    case 2:
      return "Weak";
    case 3:
      return "Fair";
    case 4:
      return "Good";
    case 5:
      return "Strong";
    default:
      return "Unknown";
  }
}

/**
 * Get strength color for visual feedback
 */
export function getStrengthColor(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return "bg-red-500";
    case 2:
      return "bg-orange-500";
    case 3:
      return "bg-yellow-500";
    case 4:
      return "bg-lime-500";
    case 5:
      return "bg-green-500";
    default:
      return "bg-gray-300";
  }
}
