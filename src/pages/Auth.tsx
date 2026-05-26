import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Scoped .auth-root CSS ensures homepage styles remain unaffected
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
  Shield,
  Heart,
  Check,
  ArrowRight,
  ArrowLeft,
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
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 flex items-center justify-center px-4 py-10">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl" />

      <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <Card className="relative z-10 w-full max-w-md border border-white/10 bg-white/10 backdrop-blur-2xl shadow-2xl rounded-3xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-400/20">
              <Activity className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-white tracking-wide">
                Symptom Scribe
              </CardTitle>
            </div>
          </div>
          <CardDescription className="text-slate-300 text-sm">
            Manage your health with AI-powered insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid grid-cols-2 w-full bg-slate-800/60 p-1 rounded-xl mb-6">
              <TabsTrigger
                value="signin"
                className="rounded-lg data-[state=active]:bg-cyan-500 data-[state=active]:text-white"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="rounded-lg data-[state=active]:bg-cyan-500 data-[state=active]:text-white"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* SIGN IN */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-slate-200">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      required
                      className="pl-12 h-12 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-400 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-slate-200">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      required
                      className="pl-12 pr-12 h-12 bg-slate-900/50 border-slate-700 text-white focus:border-cyan-400 focus:ring-cyan-400 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3 text-slate-400 hover:text-cyan-400 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || redirecting}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold shadow-lg transition-all duration-300"
                >
                  {redirecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                  Don't have an account?
                  <button
                    type="button"
                    onClick={() => setActiveTab("signup")}
                    className="auth-switch-link"
                  >
                    Sign Up
                  </button>
                </p>
              </form>
            </TabsContent>

            {/* SIGN UP */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-slate-200">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="pl-12 h-12 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-400 rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-slate-200">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                      className="pl-12 h-12 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-400 rounded-xl"
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
                  id="signup-password"
                  containerClassName="auth-field"
                  labelClassName="auth-label"
                  inputClassName="auth-input"
                  iconClassName="auth-input-icon"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold shadow-lg transition-all duration-300"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
