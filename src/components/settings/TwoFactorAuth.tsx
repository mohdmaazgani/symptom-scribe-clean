import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, ShieldCheck, ShieldOff, Smartphone } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast-helpers";

type Factor = {
  id: string;
  factor_type: string;
  status: string;
};

const TwoFactorAuth = () => {
  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const verifiedFactor = factors.find((f) => f.status === "verified");

  const loadFactors = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      showError("Error", "Could not load 2FA status");
    } else {
      setFactors(data?.totp ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFactors();
  }, []);

  const startEnrollment = async () => {
    setSubmitting(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (error) {
      showError("Enrollment Failed", error.message);
    } else if (data) {
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setEnrolling(true);
    }
    setSubmitting(false);
  };

  const confirmEnrollment = async () => {
    if (verifyCode.length !== 6) {
      showError("Invalid Code", "Enter the 6-digit code from your authenticator app");
      return;
    }
    setSubmitting(true);
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });
    if (challengeError) {
      showError("Verification Failed", challengeError.message);
      setSubmitting(false);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: verifyCode,
    });
    if (verifyError) {
      showError("Incorrect Code", "The code you entered is incorrect or expired");
    } else {
      showSuccess("2FA Enabled", "Two-factor authentication is now active on your account");
      setEnrolling(false);
      setVerifyCode("");
      await loadFactors();
    }
    setSubmitting(false);
  };

  const disable2FA = async () => {
    if (!verifiedFactor) return;
    setSubmitting(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: verifiedFactor.id });
    if (error) {
      showError("Error", "Could not disable 2FA");
    } else {
      showSuccess("2FA Disabled", "Two-factor authentication has been turned off");
      await loadFactors();
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Add an extra layer of security by requiring a code from an authenticator app when you sign in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {verifiedFactor ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-medium">2FA is enabled on your account</span>
            </div>
            <Button variant="destructive" onClick={disable2FA} disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldOff className="mr-2 h-4 w-4" />
              )}
              Disable 2FA
            </Button>
          </div>
        ) : enrolling ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <Smartphone className="w-8 h-8 text-teal-600" />
              <p className="text-sm text-muted-foreground">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              {qrCode && (
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 border rounded-lg" />
              )}
              <p className="text-xs text-muted-foreground">
                Or enter this code manually: <code className="font-mono">{secret}</code>
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-center">Enter the 6-digit code to confirm</p>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={verifyCode} onChange={setVerifyCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEnrolling(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={confirmEnrollment} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify & Enable
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={startEnrollment} disabled={submitting}>
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-4 w-4" />
            )}
            Enable 2FA
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default TwoFactorAuth;