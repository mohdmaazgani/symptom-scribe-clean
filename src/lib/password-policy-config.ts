/**
 * Password policy configuration
 * Centralized configuration for password strength requirements
 */

export const PASSWORD_POLICY_CONFIG = {
  // Minimum password length
  minLength: 12,

  // Require uppercase letters
  requireUppercase: true,

  // Require lowercase letters
  requireLowercase: true,

  // Require digits
  requireDigit: true,

  // Require special characters
  requireSpecialChar: true,

  // Special characters allowed
  specialChars: "!@#$%^&*()_+-=[]{}|;:,.<>?",

  // Error messages
  messages: {
    minLength: "Password must be at least 12 characters long",
    hasUppercase: "Password must contain at least one uppercase letter",
    hasLowercase: "Password must contain at least one lowercase letter",
    hasDigit: "Password must contain at least one digit",
    hasSpecialChar: "Password must contain at least one special character",
    notStrong: "Password does not meet strength requirements",
  },
};

export type PasswordPolicyConfig = typeof PASSWORD_POLICY_CONFIG;
