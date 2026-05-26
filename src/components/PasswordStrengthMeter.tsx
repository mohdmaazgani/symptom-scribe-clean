import { useState } from "react";
import { Eye, EyeOff, Copy, Check, Zap, Lock } from "lucide-react";
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
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  iconClassName?: string;
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
  containerClassName,
  labelClassName,
  inputClassName,
  iconClassName,
}: PasswordStrengthMeterProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedGenerator, setCopiedGenerator] = useState(false);

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
    <div className={containerClassName || "space-y-3"}>
      {/* Label */}
      <Label htmlFor={id} className={labelClassName || "text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider"}>
        {label} {required && <span className="text-teal-500">*</span>}
      </Label>

      {/* Password Input */}
      <div className="relative">
        <Lock className={iconClassName || "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"} />
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${inputClassName || "pl-11 bg-slate-900/60 dark:bg-slate-950/60 text-slate-200 border-slate-800 focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/80 placeholder:text-slate-550 rounded-xl h-11 transition-all"} pr-11`}
          required={required}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* Strength Meter */}
      {value && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Strength</span>
            <span className={`text-xs font-bold ${
              strength.score >= 4 ? "text-teal-400" : "text-amber-500"
            }`}>
              {getStrengthLabel(strength.score)}
            </span>
          </div>
          <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                strength.score >= 4 
                  ? "bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]" 
                  : strength.score >= 2 
                  ? "bg-amber-500" 
                  : "bg-rose-500"
              }`}
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
        <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/80 border border-slate-900">
          <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Requirements</p>
          <ul className="space-y-2" role="list">
            {requirements.map((req) => {
              const isMet = req.test(value);
              return (
                <li
                  key={req.id}
                  className={`flex items-center gap-2 text-xs transition-all ${
                    isMet ? "text-teal-400 font-medium" : "text-slate-500"
                  }`}
                  role="listitem"
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${
                      isMet ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "bg-slate-900 border border-slate-800 text-slate-600"
                    }`}
                    aria-label={isMet ? "Requirement met" : "Requirement unmet"}
                    role="img"
                  >
                    {isMet && <Check size={8} className="text-teal-400 font-extrabold" aria-hidden="true" />}
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
        <p className="text-xs text-rose-500 font-medium" role="alert">
          Password does not meet all requirements
        </p>
      )}

      {/* Generator Button */}
      {showGenerator && (
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGeneratePassword}
            className="flex-1 gap-2 rounded-xl border-slate-800 bg-slate-900/40 text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-xs font-semibold h-9"
          >
            <Zap size={12} className="text-teal-400 animate-pulse" />
            Generate Password
          </Button>
          {value && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyGenerated}
              className="w-10 rounded-xl border-slate-800 bg-slate-900/40 text-slate-300 hover:bg-slate-800 hover:text-white transition-all h-9 flex items-center justify-center p-0"
              aria-label="Copy generated password"
            >
              {copiedGenerator ? (
                <Check size={12} className="text-teal-400 font-bold" />
              ) : (
                <Copy size={12} />
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
