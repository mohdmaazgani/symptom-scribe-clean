import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Activity, Loader2 } from "lucide-react";
import { z } from "zod";
import { showSuccess, showError } from "@/lib/toast-helpers";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import {
  evaluatePasswordStrength,
  DEFAULT_PASSWORD_POLICY,
} from "@/lib/password-strength";

const emailSchema = z.string().email("Invalid email address");
const signinPasswordSchema = z.string().min(1, "Password is required");
const signupPasswordSchema = z.string().min(12, "Password must be at least 12 characters");

const Auth = () => {
  // Separate state per tab — prevents field bleed when switching tabs
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // onAuthStateChange fires immediately with the current session on mount (INITIAL_SESSION event).
    // No separate getSession() call needed — that caused double setState → auth page flutter.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
        toast({ title: "Validation Error", description: error.errors[0].message, variant: "destructive" });
      } else if (error instanceof Error) {
        toast({ title: "Validation Error", description: error.message, variant: "destructive" });
      }
      return false;
    }
  };

  const validateSignUp = () => {
    try {
      emailSchema.parse(signUpEmail);
      signupPasswordSchema.parse(signUpPassword);

      const strength = evaluatePasswordStrength(signUpPassword, DEFAULT_PASSWORD_POLICY);
      if (!strength.isStrong) {
        throw new Error("Password does not meet strength requirements. Please check all requirements.");
      }

      if (!fullName.trim()) {
        throw new Error("Full name is required");
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: "Validation Error", description: error.errors[0].message, variant: "destructive" });
      } else if (error instanceof Error) {
        toast({ title: "Validation Error", description: error.message, variant: "destructive" });
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
      setLoading(false); // only reset on failure
    } else {
      setLoading(false);
      setRedirecting(true); // hold UI — onAuthStateChange will navigate
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
      // Use data.user from signUp response — avoids race condition when
      // email confirmation is enabled (getUser() returns null before confirmation)
      if (data.user) {
        await supabase.from("profiles").insert({
          user_id: data.user.id,
          full_name: fullName,
        });
      }
      showSuccess("Account Created!", "You can now sign in with your credentials.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-glow to-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity className="w-8 h-8 text-primary" />
            <CardTitle className="text-2xl">Smart Health Tracker</CardTitle>
          </div>
          <CardDescription>
            Manage your health with AI-powered insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || redirecting}>
                  {redirecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting to Dashboard...
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
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                  />
                </div>
                <PasswordStrengthMeter
                  value={signUpPassword}
                  onChange={setSignUpPassword}
                  label="Password"
                  placeholder="Create a strong password"
                  policy={DEFAULT_PASSWORD_POLICY}
                  showGenerator={true}
                  id="signup-password"
                />
                <Button type="submit" className="w-full" disabled={loading}>
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
    </div>
  );
};

export default Auth;
