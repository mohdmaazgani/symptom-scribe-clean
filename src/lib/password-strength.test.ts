/**
 * Unit tests for password strength utilities
 */

import {
  evaluatePasswordStrength,
  generateStrongPassword,
  getPasswordRequirements,
  getStrengthLabel,
  getStrengthColor,
  DEFAULT_PASSWORD_POLICY,
  type PasswordPolicy,
} from "@/lib/password-strength";

describe("Password Strength Utilities", () => {
  describe("evaluatePasswordStrength", () => {
    it("should return all false for empty password", () => {
      const result = evaluatePasswordStrength("");
      expect(result.minLength).toBe(false);
      expect(result.hasUppercase).toBe(false);
      expect(result.hasLowercase).toBe(false);
      expect(result.hasDigit).toBe(false);
      expect(result.hasSpecialChar).toBe(false);
      expect(result.isStrong).toBe(false);
      expect(result.score).toBe(0);
    });

    it("should correctly evaluate minimum length requirement", () => {
      const short = evaluatePasswordStrength("Short");
      expect(short.minLength).toBe(false);

      const long = evaluatePasswordStrength("VeryLongPassword");
      expect(long.minLength).toBe(true);
    });

    it("should correctly identify uppercase letters", () => {
      const withoutUpper = evaluatePasswordStrength("password123");
      expect(withoutUpper.hasUppercase).toBe(false);

      const withUpper = evaluatePasswordStrength("Password123");
      expect(withUpper.hasUppercase).toBe(true);
    });

    it("should correctly identify lowercase letters", () => {
      const withoutLower = evaluatePasswordStrength("PASSWORD123");
      expect(withoutLower.hasLowercase).toBe(false);

      const withLower = evaluatePasswordStrength("Password123");
      expect(withLower.hasLowercase).toBe(true);
    });

    it("should correctly identify digits", () => {
      const withoutDigit = evaluatePasswordStrength("Password");
      expect(withoutDigit.hasDigit).toBe(false);

      const withDigit = evaluatePasswordStrength("Password1");
      expect(withDigit.hasDigit).toBe(true);
    });

    it("should correctly identify special characters", () => {
      const withoutSpecial = evaluatePasswordStrength("Password123");
      expect(withoutSpecial.hasSpecialChar).toBe(false);

      const withSpecial = evaluatePasswordStrength("Password123!");
      expect(withSpecial.hasSpecialChar).toBe(true);
    });

    it("should calculate correct strength score", () => {
      expect(evaluatePasswordStrength("").score).toBe(0);
      expect(evaluatePasswordStrength("password").score).toBe(1);
      expect(evaluatePasswordStrength("password1").score).toBe(2);
      expect(evaluatePasswordStrength("password1A").score).toBe(3);
      expect(evaluatePasswordStrength("password1A!").score).toBe(4);
      expect(evaluatePasswordStrength("VeryStrongPassword123!").score).toBe(5);
    });

    it("should correctly identify strong passwords", () => {
      const weak = evaluatePasswordStrength("weak");
      expect(weak.isStrong).toBe(false);

      const strong = evaluatePasswordStrength("VeryStrongPassword123!");
      expect(strong.isStrong).toBe(true);
    });

    it("should respect custom policy", () => {
      const customPolicy: PasswordPolicy = {
        minLength: 6,
        requireUppercase: false,
        requireLowercase: true,
        requireDigit: false,
        requireSpecialChar: false,
      };

      const password = "password";
      const result = evaluatePasswordStrength(password, customPolicy);
      expect(result.isStrong).toBe(true);
    });
  });

  describe("generateStrongPassword", () => {
    it("should generate a password", () => {
      const password = generateStrongPassword();
      expect(password).toBeTruthy();
      expect(typeof password).toBe("string");
    });

    it("should generate password meeting default policy", () => {
      const password = generateStrongPassword();
      const result = evaluatePasswordStrength(password, DEFAULT_PASSWORD_POLICY);
      expect(result.isStrong).toBe(true);
    });

    it("should generate password with minimum length", () => {
      const password = generateStrongPassword();
      expect(password.length).toBeGreaterThanOrEqual(DEFAULT_PASSWORD_POLICY.minLength);
    });

    it("should generate different passwords", () => {
      const password1 = generateStrongPassword();
      const password2 = generateStrongPassword();
      // Very unlikely to be the same
      expect(password1).not.toBe(password2);
    });

    it("should respect custom policy", () => {
      const customPolicy: PasswordPolicy = {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireDigit: true,
        requireSpecialChar: false,
      };

      const password = generateStrongPassword(customPolicy);
      const result = evaluatePasswordStrength(password, customPolicy);
      expect(result.isStrong).toBe(true);
    });
  });

  describe("getPasswordRequirements", () => {
    it("should return requirements array", () => {
      const requirements = getPasswordRequirements();
      expect(Array.isArray(requirements)).toBe(true);
      expect(requirements.length).toBeGreaterThan(0);
    });

    it("should include minLength requirement", () => {
      const requirements = getPasswordRequirements();
      const minLengthReq = requirements.find((r) => r.id === "minLength");
      expect(minLengthReq).toBeTruthy();
    });

    it("should respect custom policy", () => {
      const customPolicy: PasswordPolicy = {
        minLength: 8,
        requireUppercase: false,
        requireLowercase: true,
        requireDigit: false,
        requireSpecialChar: false,
      };

      const requirements = getPasswordRequirements(customPolicy);
      const hasUppercase = requirements.find((r) => r.id === "hasUppercase");
      const hasDigit = requirements.find((r) => r.id === "hasDigit");

      expect(hasUppercase).toBeUndefined();
      expect(hasDigit).toBeUndefined();
    });

    it("should test requirements correctly", () => {
      const requirements = getPasswordRequirements();
      const password = "VeryStrongPassword123!";

      requirements.forEach((req) => {
        const result = evaluatePasswordStrength(password);
        const isMet = req.test(password);
        expect(isMet).toBe(result[req.id]);
      });
    });
  });

  describe("getStrengthLabel", () => {
    it("should return correct labels for scores", () => {
      expect(getStrengthLabel(0)).toBe("Very Weak");
      expect(getStrengthLabel(1)).toBe("Very Weak");
      expect(getStrengthLabel(2)).toBe("Weak");
      expect(getStrengthLabel(3)).toBe("Fair");
      expect(getStrengthLabel(4)).toBe("Good");
      expect(getStrengthLabel(5)).toBe("Strong");
    });
  });

  describe("getStrengthColor", () => {
    it("should return correct color classes for scores", () => {
      expect(getStrengthColor(0)).toBe("bg-red-500");
      expect(getStrengthColor(1)).toBe("bg-red-500");
      expect(getStrengthColor(2)).toBe("bg-orange-500");
      expect(getStrengthColor(3)).toBe("bg-yellow-500");
      expect(getStrengthColor(4)).toBe("bg-lime-500");
      expect(getStrengthColor(5)).toBe("bg-green-500");
    });
  });

  describe("Integration tests", () => {
    it("should generate and validate passwords consistently", () => {
      for (let i = 0; i < 10; i++) {
        const password = generateStrongPassword();
        const result = evaluatePasswordStrength(password);
        expect(result.isStrong).toBe(true);
      }
    });

    it("should have matching requirements and evaluation", () => {
      const password = "WeakPass123";
      const result = evaluatePasswordStrength(password);
      const requirements = getPasswordRequirements();

      requirements.forEach((req) => {
        const isMet = req.test(password);
        expect(isMet).toBe(result[req.id]);
      });
    });
  });
});
