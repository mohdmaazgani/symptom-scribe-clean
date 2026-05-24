import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { z } from "zod";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { showError, showSuccess } from "@/lib/toast-helpers";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import {
  DEFAULT_PASSWORD_POLICY,
  evaluatePasswordStrength,
} from "@/lib/password-strength";

const STEPS = ["Account", "Personal", "Health", "Emergency", "Review"] as const;

const emailSchema = z.string().email("Invalid email address");
const signupPasswordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters");

interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  blood_type: string;
  allergies: string;
  chronic_conditions: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

const INITIAL_DATA: RegistrationData = {
  email: "",
  password: "",
  confirmPassword: "",
  full_name: "",
  date_of_birth: "",
  gender: "",
  blood_type: "",
  allergies: "",
  chronic_conditions: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
};

const toArray = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const MultiStepSignUp = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RegistrationData>(INITIAL_DATA);

  const update = (fields: Partial<RegistrationData>) =>
    setData((prev) => ({ ...prev, ...fields }));

  // Per-step validation. Returns true (and shows a toast on failure) when the
  // current step is allowed to advance.
  const validateStep = (): boolean => {
    if (step === 0) {
      try {
        emailSchema.parse(data.email);
        signupPasswordSchema.parse(data.password);
      } catch (error) {
        if (error instanceof z.ZodError) {
          showError("Validation Error", error.errors[0].message);
        }
        return false;
      }
      if (!evaluatePasswordStrength(data.password, DEFAULT_PASSWORD_POLICY).isStrong) {
        showError(
          "Weak Password",
          "Password does not meet all strength requirements."
        );
        return false;
      }
      if (data.password !== data.confirmPassword) {
        showError("Passwords Do Not Match", "Please re-enter your password.");
        return false;
      }
      return true;
    }

    if (step === 1) {
      if (!data.full_name.trim()) {
        showError("Validation Error", "Full name is required");
        return false;
      }
      if (data.date_of_birth) {
        const age =
          new Date().getFullYear() - new Date(data.date_of_birth).getFullYear();
        if (age < 0 || age > 120) {
          showError("Invalid Date of Birth", "Please enter a valid date of birth");
          return false;
        }
      }
      return true;
    }

    if (step === 3 && data.emergency_contact_phone) {
      if (!/^[\d\s+()-]+$/.test(data.emergency_contact_phone)) {
        showError("Invalid Phone Number", "Please enter a valid phone number");
        return false;
      }
    }

    return true;
  };

  const goNext = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const skip = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));

  const handleComplete = async () => {
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: data.full_name || null,
            date_of_birth: data.date_of_birth || null,
            gender: data.gender || null,
            blood_type: data.blood_type || null,
            allergies: toArray(data.allergies),
            chronic_conditions: toArray(data.chronic_conditions),
            emergency_contact_name: data.emergency_contact_name || null,
            emergency_contact_phone: data.emergency_contact_phone || null,
          },
        },
      });

      if (signUpError) {
        showError("Sign Up Failed", signUpError.message);
        // Send the user back to the credentials step with their data intact.
        setStep(0);
        return;
      }

      showSuccess(
        "Welcome to Smart Health Tracker!",
        "Your account and health profile are ready."
      );
    } catch (error) {
      console.error("Error during registration:", error);
      showError("Sign Up Failed", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Stepper currentStep={step} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
        >
          {step === 0 && <AccountStep data={data} update={update} />}
          {step === 1 && <PersonalStep data={data} update={update} />}
          {step === 2 && <HealthStep data={data} update={update} />}
          {step === 3 && <EmergencyStep data={data} update={update} />}
          {step === 4 && <ReviewStep data={data} />}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={goBack}
          disabled={step === 0 || loading}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          {(step === 2 || step === 3) && (
            <Button type="button" variant="outline" onClick={skip} disabled={loading}>
              Skip
            </Button>
          )}

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext} disabled={loading}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={handleComplete} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Complete"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const Stepper = ({ currentStep }: { currentStep: number }) => (
  <div className="flex items-center justify-between">
    {STEPS.map((label, index) => {
      const isComplete = index < currentStep;
      const isActive = index === currentStep;
      return (
        <div key={label} className="flex flex-1 items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium transition-colors",
                isComplete && "border-primary bg-primary text-primary-foreground",
                isActive && "border-primary text-primary",
                !isComplete && !isActive && "border-muted text-muted-foreground"
              )}
            >
              {isComplete ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            <span
              className={cn(
                "text-[10px]",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div
              className={cn(
                "mx-1 h-0.5 flex-1",
                index < currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </div>
      );
    })}
  </div>
);

interface StepProps {
  data: RegistrationData;
  update: (fields: Partial<RegistrationData>) => void;
}

const AccountStep = ({ data, update }: StepProps) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="signup-email">Email</Label>
      <Input
        id="signup-email"
        type="email"
        placeholder="your@email.com"
        value={data.email}
        onChange={(e) => update({ email: e.target.value })}
        required
      />
    </div>
    <PasswordStrengthMeter
      value={data.password}
      onChange={(value) => update({ password: value })}
      label="Password"
      placeholder="Create a strong password"
      policy={DEFAULT_PASSWORD_POLICY}
      showGenerator
      id="signup-password"
    />
    <div className="space-y-2">
      <Label htmlFor="signup-confirm-password">Confirm Password</Label>
      <Input
        id="signup-confirm-password"
        type="password"
        placeholder="Re-enter your password"
        value={data.confirmPassword}
        onChange={(e) => update({ confirmPassword: e.target.value })}
        required
      />
    </div>
  </div>
);

const PersonalStep = ({ data, update }: StepProps) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div className="space-y-2 sm:col-span-2">
      <Label htmlFor="signup-full-name">Full Name</Label>
      <Input
        id="signup-full-name"
        placeholder="John Doe"
        value={data.full_name}
        onChange={(e) => update({ full_name: e.target.value })}
        required
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="signup-dob">Date of Birth</Label>
      <Input
        id="signup-dob"
        type="date"
        value={data.date_of_birth}
        onChange={(e) => update({ date_of_birth: e.target.value })}
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="signup-gender">Gender</Label>
      <Select value={data.gender} onValueChange={(value) => update({ gender: value })}>
        <SelectTrigger id="signup-gender">
          <SelectValue placeholder="Select gender" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="male">Male</SelectItem>
          <SelectItem value="female">Female</SelectItem>
          <SelectItem value="other">Other</SelectItem>
          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label htmlFor="signup-blood-type">Blood Type</Label>
      <Select
        value={data.blood_type}
        onValueChange={(value) => update({ blood_type: value })}
      >
        <SelectTrigger id="signup-blood-type">
          <SelectValue placeholder="Select blood type" />
        </SelectTrigger>
        <SelectContent>
          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
);

const HealthStep = ({ data, update }: StepProps) => (
  <div className="space-y-4">
    <p className="text-sm text-muted-foreground">
      Optional, but it helps the AI give safer recommendations.
    </p>
    <div className="space-y-2">
      <Label htmlFor="signup-allergies">Allergies (comma-separated)</Label>
      <Input
        id="signup-allergies"
        value={data.allergies}
        onChange={(e) => update({ allergies: e.target.value })}
        placeholder="Peanuts, Penicillin, Latex"
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="signup-conditions">Chronic Conditions (comma-separated)</Label>
      <Input
        id="signup-conditions"
        value={data.chronic_conditions}
        onChange={(e) => update({ chronic_conditions: e.target.value })}
        placeholder="Diabetes, Hypertension"
      />
    </div>
  </div>
);

const EmergencyStep = ({ data, update }: StepProps) => (
  <div className="space-y-4">
    <p className="text-sm text-muted-foreground">
      Optional. Recommended for safety.
    </p>
    <div className="space-y-2">
      <Label htmlFor="signup-emergency-name">Contact Name</Label>
      <Input
        id="signup-emergency-name"
        value={data.emergency_contact_name}
        onChange={(e) => update({ emergency_contact_name: e.target.value })}
        placeholder="Jane Doe"
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="signup-emergency-phone">Contact Phone</Label>
      <Input
        id="signup-emergency-phone"
        type="tel"
        value={data.emergency_contact_phone}
        onChange={(e) => update({ emergency_contact_phone: e.target.value })}
        placeholder="+1 (555) 123-4567"
      />
      <p className="text-xs text-muted-foreground">
        Include country code for international numbers
      </p>
    </div>
  </div>
);

const ReviewStep = ({ data }: { data: RegistrationData }) => {
  const rows: Array<[string, string]> = [
    ["Email", data.email],
    ["Full Name", data.full_name],
    ["Date of Birth", data.date_of_birth],
    ["Gender", data.gender],
    ["Blood Type", data.blood_type],
    ["Allergies", toArray(data.allergies).join(", ")],
    ["Chronic Conditions", toArray(data.chronic_conditions).join(", ")],
    ["Emergency Contact", data.emergency_contact_name],
    ["Emergency Phone", data.emergency_contact_phone],
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Review your details, then complete your registration.
      </p>
      <dl className="divide-y rounded-md border">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-3 py-2 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium">
              {value || <span className="text-muted-foreground">—</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

export default MultiStepSignUp;
