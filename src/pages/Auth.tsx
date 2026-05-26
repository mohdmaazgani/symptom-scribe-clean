import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  Loader2,
  Mail,
  Lock,
  Shield,
  Heart,
  Check,
  ArrowRight,
  ArrowLeft,
  User,
} from "lucide-react";
import { z } from "zod";
import { showSuccess, showError } from "@/lib/toast-helpers";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import { AnimatedThemeToggler } from "@/components/AnimatedThemeToggler";
import {
  evaluatePasswordStrength,
  DEFAULT_PASSWORD_POLICY,
} from "@/lib/password-strength";

const emailSchema = z.string().email("Invalid email address");
const signinPasswordSchema = z.string().min(1, "Password is required");
const signupPasswordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters");

const FEATURES = [
  "AI-powered symptom analysis & tracking",
  "Secure HIPAA-compliant patient records",
  "Real-time clinical insights & reporting",
];

const Auth = () => {
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/dashboard");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateSignIn = () => {
    try {
      emailSchema.parse(signInEmail);
      signinPasswordSchema.parse(signInPassword);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else if (error instanceof Error) {
        toast({
          title: "Validation Error",
          description: error.message,
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const validateSignUp = () => {
    try {
      emailSchema.parse(signUpEmail);
      signupPasswordSchema.parse(signUpPassword);
      const strength = evaluatePasswordStrength(
        signUpPassword,
        DEFAULT_PASSWORD_POLICY
      );
      if (!strength.isStrong) {
        throw new Error(
          "Password does not meet strength requirements. Please check all requirements."
        );
      }
      if (!fullName.trim()) {
        throw new Error("Full name is required");
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else if (error instanceof Error) {
        toast({
          title: "Validation Error",
          description: error.message,
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignIn()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: signInEmail,
      password: signInPassword,
    });
    if (error) {
      showError("Sign In Failed", error.message);
      setLoading(false);
    } else {
      setLoading(false);
      setRedirecting(true);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignUp()) return;
    setLoading(true);
    const redirectUrl = `${window.location.origin}/dashboard`;
    const { data, error } = await supabase.auth.signUp({
      email: signUpEmail,
      password: signUpPassword,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName },
      },
    });
    if (error) {
      showError("Sign Up Failed", error.message);
    } else {
      if (data.user) {
        await supabase.from("profiles").insert({
          user_id: data.user.id,
          full_name: fullName,
        });
      }
      showSuccess(
        "Account Created!",
        "You can now sign in with your credentials."
      );
    }
    setLoading(false);
  };

  return (
    <div className="auth-root">
      <div className="auth-floating-controls">
        <Link to="/" className="auth-back-btn">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <AnimatedThemeToggler />
      </div>

      {/* Animated ambient blobs */}
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />

      {/* Dot-grid texture */}
      <div className="auth-dot-grid" />

      <div className="auth-container">
        {/* ══════════════ LEFT PANEL ══════════════ */}
        <div className="auth-left">
          <div className="auth-left-inner">
            {/* Brand */}
            <div className="auth-brand">
              <div className="auth-brand-icon">
                <Activity className="w-5 h-5 text-teal-400" />
              </div>
              <span className="auth-brand-name">Symptom Scribe</span>
            </div>

            {/* Headline */}
            <h1 className="auth-headline">
              Your intelligent
              <br />
              <span className="auth-headline-accent">clinical companion</span>
            </h1>

            <p className="auth-subtext">
              Trusted by healthcare professionals worldwide to capture, analyze,
              and manage patient records with precision AI.
            </p>

            {/* Feature list */}
            <div className="auth-features">
              {FEATURES.map((feat, i) => (
                <div className="auth-feature-item" key={i}>
                  <div className="auth-feature-dot">
                    <Check className="w-4 h-4 text-teal-400" strokeWidth={3} />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Trust badges */}
            <div className="auth-trust">
              <div className="auth-trust-badge">
                <Shield className="w-3.5 h-3.5 text-teal-400" />
                <span>HIPAA Compliant</span>
              </div>
              <div className="auth-trust-badge">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>10k+ Clinicians</span>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════ RIGHT PANEL ══════════════ */}
        <div className="auth-right">
          <div className="auth-card">
            {/* Mobile brand header (visible only on small screens) */}
            <div className="flex items-center justify-center gap-2.5 mb-6 lg:hidden">
              <div className="auth-brand-icon">
                <Activity className="w-4 h-4 text-teal-400" />
              </div>
              <span className="auth-brand-name">Symptom Scribe</span>
            </div>

            {/* Tab switcher */}
            <div className="auth-tabs">
              <button
                className={`auth-tab${activeTab === "signin" ? " auth-tab-active" : ""}`}
                onClick={() => setActiveTab("signin")}
                type="button"
              >
                Sign In
              </button>
              <button
                className={`auth-tab${activeTab === "signup" ? " auth-tab-active" : ""}`}
                onClick={() => setActiveTab("signup")}
                type="button"
              >
                Sign Up
              </button>
            </div>

            {/* Dynamic heading */}
            <div className="auth-card-heading">
              <h2>
                {activeTab === "signin" ? "Welcome back" : "Create account"}
              </h2>
              <p>
                {activeTab === "signin"
                  ? "Sign in to access your clinical dashboard."
                  : "Join thousands of healthcare professionals today."}
              </p>
            </div>

            {/* ── SIGN IN FORM ── */}
            {activeTab === "signin" && (
              <form onSubmit={handleSignIn} className="auth-form">
                <div className="auth-field">
                  <Label htmlFor="si-email" className="auth-label">
                    Email address
                  </Label>
                  <div className="auth-input-wrap">
                    <Mail className="auth-input-icon" />
                    <Input
                      id="si-email"
                      type="email"
                      placeholder="doctor@clinic.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      className="auth-input"
                      required
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <Label htmlFor="si-password" className="auth-label">
                    Password
                  </Label>
                  <div className="auth-input-wrap">
                    <Lock className="auth-input-icon" />
                    <Input
                      id="si-password"
                      type="password"
                      placeholder="••••••••••••"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="auth-input"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading || redirecting}
                >
                  {redirecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Accessing portal...
                    </>
                  ) : loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <span>Sign In Securely</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <p className="auth-switch-text">
                  Don&apos;t have an account?
                  <button
                    type="button"
                    onClick={() => setActiveTab("signup")}
                    className="auth-switch-link"
                  >
                    Sign Up
                  </button>
                </p>
              </form>
            )}

            {/* ── SIGN UP FORM ── */}
            {activeTab === "signup" && (
              <form onSubmit={handleSignUp} className="auth-form">
                <div className="auth-field">
                  <Label htmlFor="su-name" className="auth-label">
                    Full name
                  </Label>
                  <div className="auth-input-wrap">
                    <User className="auth-input-icon" />
                    <Input
                      id="su-name"
                      type="text"
                      placeholder="Dr. Jane Smith"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="auth-input"
                      required
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <Label htmlFor="su-email" className="auth-label">
                    Email address
                  </Label>
                  <div className="auth-input-wrap">
                    <Mail className="auth-input-icon" />
                    <Input
                      id="su-email"
                      type="email"
                      placeholder="doctor@clinic.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      className="auth-input"
                      required
                    />
                  </div>
                </div>

                <PasswordStrengthMeter
                  value={signUpPassword}
                  onChange={setSignUpPassword}
                  label="Password"
                  placeholder="Create a strong password"
                  policy={DEFAULT_PASSWORD_POLICY}
                  showGenerator={false}
                  id="su-password"
                  containerClassName="auth-field"
                  labelClassName="auth-label"
                  inputClassName="auth-input"
                  iconClassName="auth-input-icon"
                />

                <Button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <p className="auth-switch-text">
                  Already registered?
                  <button
                    type="button"
                    onClick={() => setActiveTab("signin")}
                    className="auth-switch-link"
                  >
                    Sign In
                  </button>
                </p>
              </form>
            )}

            {/* Security footer */}
            <div className="auth-security">
              <Lock className="w-3 h-3" />
              <span>End-to-end encrypted · Clinical grade security</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
