import { useState } from "react";
import { Eye, EyeOff, Copy, Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  evaluatePasswordStrength,
  generateStrongPassword,
  getPasswordRequirements,
  getStrengthColor,
  getStrengthLabel,
  type PasswordPolicy,
} from "@/lib/password-strength";

interface PasswordStrengthMeterProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  policy?: PasswordPolicy;
  showGenerator?: boolean;
  id?: string;
  required?: boolean;
  showPasswordState?: boolean;
  onShowPasswordChange?: (value: boolean) => void;
}

export function PasswordStrengthMeter({
  value,
  onChange,
  label = "Password",
  placeholder = "Enter a strong password",
  policy,
  showGenerator = true,
  id = "password",
  required = true,
  showPasswordState,
  onShowPasswordChange,
}: PasswordStrengthMeterProps) {
  const [localShowPassword, setLocalShowPassword] = useState(false);
  const [copiedGenerator, setCopiedGenerator] = useState(false);

  const isControlled = showPasswordState !== undefined;
  const showPassword = isControlled ? showPasswordState : localShowPassword;
  const setShowPassword = isControlled && onShowPasswordChange ? onShowPasswordChange : setLocalShowPassword;

  const strength = evaluatePasswordStrength(value, policy);
  const requirements = getPasswordRequirements(policy);

  const handleGeneratePassword = () => {
    const newPassword = generateStrongPassword(policy);
    onChange(newPassword);
  };

  const handleCopyGenerated = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedGenerator(true);
      setTimeout(() => setCopiedGenerator(false), 2000);
    } catch {
      console.error("Failed to copy password");
    }
  };

  return (
    <div className="space-y-3">
      {/* Label */}
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
      </Label>

      {/* Password Input */}
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-12 rounded-2xl pr-20 transition-all duration-200 placeholder:text-muted-foreground hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/30"
          required={required}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* Strength Meter */}
      {value && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Strength</span>
            <span className={`text-xs font-semibold ${
              strength.score >= 4 ? "text-green-600" : "text-orange-600"
            }`}>
              {getStrengthLabel(strength.score)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all duration-300 ${getStrengthColor(strength.score)}`}
              style={{ width: `${(strength.score / 5) * 100}%` }}
              role="progressbar"
              aria-valuenow={strength.score}
              aria-valuemin={0}
              aria-valuemax={5}
              aria-label={`Password strength: ${getStrengthLabel(strength.score)}`}
            />
          </div>
        </div>
      )}

      {/* Requirements Checklist */}
      {value && requirements.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Requirements:</p>
          <ul className="space-y-1" role="list">
            {requirements.map((req) => {
              const isMet = req.test(value);
              return (
                <li
                  key={req.id}
                  className={`flex items-center gap-2 text-xs ${
                    isMet ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                  }`}
                  role="listitem"
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      isMet ? "bg-green-600 dark:bg-green-500" : "bg-muted"
                    }`}
                    aria-label={isMet ? "Requirement met" : "Requirement unmet"}
                    role="img"
                  >
                    {isMet && <Check size={12} className="text-white" aria-hidden="true" />}
                  </span>
                  <span>{req.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Error Message */}
      {value && !strength.isStrong && (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          Password does not meet all requirements
        </p>
      )}

      {/* Generator Button */}
      {showGenerator && (
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGeneratePassword}
            className="flex-1 gap-2 rounded-xl border-border/70 bg-background/70 transition-all duration-200 hover:border-primary/50 hover:bg-primary/10"
          >
            <Zap size={16} />
            Generate Strong Password
          </Button>
          {value && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyGenerated}
              className="w-auto rounded-xl border-border/70 bg-background/70 transition-all duration-200 hover:border-primary/50 hover:bg-primary/10"
              aria-label="Copy generated password"
            >
              {copiedGenerator ? (
                <Check size={16} className="text-green-600" />
              ) : (
                <Copy size={16} />
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
