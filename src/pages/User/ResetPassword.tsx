import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/lib/toast-helpers";
import { PasswordStrengthMeter } from "@/components/registration/shared/PasswordStrengthMeter";
import { DEFAULT_PASSWORD_POLICY, evaluatePasswordStrength } from "@/lib/password-strength";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleReset = async () => {
    if (!password) {
      showError("Missing Password", "Please enter a new password.");
      return;
    }

    const strength = evaluatePasswordStrength(password, DEFAULT_PASSWORD_POLICY);
    if (!strength.isStrong) {
      showError("Weak Password", "Password does not meet all strength requirements.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      showError("Update Failed", error.message);
      return;
    }

    showSuccess("Password Updated!", "You can now sign in with your new password.");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-xl border border-border">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Reset Password
        </h1>

        <p className="text-muted-foreground mb-6">
          Enter your new password below.
        </p>

        <div className="mb-6">
          <PasswordStrengthMeter
            value={password}
            onChange={setPassword}
            label="New Password"
            placeholder="New Password"
            policy={DEFAULT_PASSWORD_POLICY}
            showGenerator={true}
            id="reset-password"
            required={true}
          />
        </div>

        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full rounded-xl bg-primary hover:bg-primary/90 text-foreground p-3 font-semibold"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;