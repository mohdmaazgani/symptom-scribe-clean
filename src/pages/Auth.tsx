import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { useToast } from "@/hooks/use-toast";

import {
  Activity,
  Loader2,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  HeartPulse,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { z } from "zod";

import { showSuccess, showError } from "@/lib/toast-helpers";

import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";

import {
  evaluatePasswordStrength,
  DEFAULT_PASSWORD_POLICY,
} from "@/lib/password-strength";

const emailSchema = z.string().email("Invalid email address");
const signinPasswordSchema = z.string().min(1, "Password is required");
const signupPasswordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters");

const Auth = () => {
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  const [fullName, setFullName] = useState("");

  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authTab, setAuthTab] = useState("signin");

  const navigate = useNavigate();
  const { toast } = useToast();

  const fieldIconClass =
    "pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-200/70 transition-colors duration-200";
  const fieldClass =
    "h-12 rounded-2xl border-white/10 bg-slate-950/45 pl-12 text-white shadow-inner shadow-slate-950/30 transition-all duration-200 placeholder:text-slate-400 hover:border-cyan-200/30 focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/30";
  const actionButtonClass =
    "h-12 w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 font-semibold text-slate-950 shadow-lg shadow-cyan-950/30 transition-all duration-300 hover:-translate-y-0.5 hover:from-cyan-300 hover:via-teal-300 hover:to-emerald-300 hover:shadow-cyan-500/20 active:translate-y-0 disabled:translate-y-0 disabled:opacity-75";

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    setShowPassword(false);
  }, [authTab]);

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
        throw new Error("Password does not meet strength requirements.");
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
      showSuccess(
        "Account Created!",
        "You can now sign in with your credentials."
      );
    }

    setLoading(false);
  };

  return (
    <div className="dark relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top_left,rgba(20,184,166,0.22),transparent_38%),linear-gradient(135deg,#07111f_0%,#0f2433_45%,#12362f_100%)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px] opacity-50" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(6,182,212,0.16),transparent_34%,rgba(16,185,129,0.12)_78%)]" />
      <div className="absolute -bottom-32 left-0 h-72 w-full bg-[linear-gradient(165deg,transparent_18%,rgba(45,212,191,0.16)_19%,rgba(45,212,191,0.06)_36%,transparent_37%),linear-gradient(18deg,transparent_42%,rgba(125,211,252,0.12)_43%,rgba(125,211,252,0.04)_60%,transparent_61%)] blur-sm" />
      <div className="absolute inset-0 bg-slate-950/35" />

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_460px]">
        <section className="hidden max-w-xl space-y-8 lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-white/8 px-4 py-2 text-sm font-medium text-cyan-100 shadow-lg shadow-slate-950/20 backdrop-blur-xl">
            <Sparkles className="h-4 w-4 text-emerald-300" />
            AI-powered healthcare dashboard
          </div>

          <div className="space-y-5">
            <h1 className="text-5xl font-bold leading-tight tracking-normal text-white">
              Care insights that feel calm, clear, and secure.
            </h1>
            <p className="max-w-lg text-lg leading-8 text-slate-300">
              Track symptoms, health patterns, and personalized guidance from a
              focused workspace built for everyday care decisions.
            </p>
          </div>

          <div className="grid max-w-lg grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
              <HeartPulse className="mb-4 h-7 w-7 text-rose-200" />
              <p className="text-sm font-semibold text-white">
                Smart symptom history
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Organized health records with trend-aware summaries.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
              <ShieldCheck className="mb-4 h-7 w-7 text-emerald-200" />
              <p className="text-sm font-semibold text-white">
                Private by design
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                A secure entry point with accessible contrast and focus states.
              </p>
            </div>
          </div>
        </section>

        <Card className="w-full border border-white/15 bg-slate-950/55 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-2xl">
          <CardHeader className="space-y-5 px-6 pb-4 pt-7 text-center sm:px-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-200/20 bg-cyan-300/10 shadow-inner shadow-cyan-200/10">
              <Activity className="h-8 w-8 text-cyan-200" />
            </div>

            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold tracking-normal text-white sm:text-3xl">
                Smart Health Tracker
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-slate-300">
                Manage your health with AI-powered insights
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-7 sm:px-8">
            <Tabs value={authTab} onValueChange={setAuthTab} className="w-full">
              <TabsList className="mb-6 grid h-12 w-full grid-cols-2 rounded-2xl border border-white/10 bg-slate-900/70 p-1">
                <TabsTrigger
                  value="signin"
                  className={`rounded-xl transition-all duration-200 ${
                    authTab === "signin"
                      ? "!bg-white !text-slate-950 shadow-md"
                      : "!bg-transparent text-slate-300 hover:text-white"
                  }`}
                >
                  Sign In
                </TabsTrigger>

                <TabsTrigger
                  value="signup"
                  className={`rounded-xl transition-all duration-200 ${
                    authTab === "signup"
                      ? "!bg-white !text-slate-950 shadow-md"
                      : "!bg-transparent text-slate-300 hover:text-white"
                  }`}
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="signin-email"
                      className="text-sm font-medium text-slate-100"
                    >
                      Email
                    </Label>

                    <div className="relative">
                      <Mail className={fieldIconClass} />

                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="your@email.com"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        required
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="signin-password"
                      className="text-sm font-medium text-slate-100"
                    >
                      Password
                    </Label>

                    <div className="relative">
                      <Lock className={fieldIconClass} />

                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        required
                        className={`${fieldClass} pr-12`}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-200 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || redirecting}
                    className={actionButtonClass}
                  >
                    {redirecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Redirecting...
                      </>
                    ) : loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-name"
                      className="text-sm font-medium text-slate-100"
                    >
                      Full Name
                    </Label>

                    <div className="relative">
                      <User className={fieldIconClass} />

                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-email"
                      className="text-sm font-medium text-slate-100"
                    >
                      Email
                    </Label>

                    <div className="relative">
                      <Mail className={fieldIconClass} />

                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        required
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <PasswordStrengthMeter
                    value={signUpPassword}
                    onChange={setSignUpPassword}
                    label="Password"
                    placeholder="Create a strong password"
                    policy={DEFAULT_PASSWORD_POLICY}
                    showGenerator={true}
                    id="signup-password"
                    showPasswordState={showPassword}
                    onShowPasswordChange={setShowPassword}
                  />

                  <Button
                    type="submit"
                    disabled={loading}
                    className={actionButtonClass}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Auth;
