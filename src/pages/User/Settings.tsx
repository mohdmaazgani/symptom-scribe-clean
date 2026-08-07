import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Lock, Trash2, Loader2, AlertTriangle, Languages, ShieldCheck, Accessibility, Eye, EyeOff } from "lucide-react";
import LanguageSwitcher from "@/components/settings/LanguageSwitcher";
import AccessibilitySettings from "@/components/settings/AccessibilitySettings";
import { PasswordStrengthMeter } from "@/components/registration/shared/PasswordStrengthMeter";
import { DEFAULT_PASSWORD_POLICY, evaluatePasswordStrength } from "@/lib/password-strength";
import { showSuccess, showError } from "@/lib/toast-helpers";
import { clearSafeStorage } from "@/lib/storage";
import {
  getKey,
  getSearchKey,
  setupKeysFromPassword,
  triggerKeyRotation,
} from "@/lib/encryption";
import TwoFactorAuth from "@/components/settings/TwoFactorAuth";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  // Delete Account State
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!currentPassword) {
      toast({
        title: t("settings.toasts.validationErrorTitle"),
        description: t("settings.toasts.enterCurrentPassword"),
        variant: "destructive",
      });
      return;
    }

    if (!newPassword) {
      toast({
        title: t("settings.toasts.validationErrorTitle"),
        description: t("settings.toasts.enterNewPassword"),
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: t("settings.toasts.validationErrorTitle"),
        description: t("settings.toasts.passwordsDoNotMatch"),
        variant: "destructive",
      });
      return;
    }

    const strength = evaluatePasswordStrength(newPassword, DEFAULT_PASSWORD_POLICY);
    if (!strength.isStrong) {
      toast({
        title: t("settings.toasts.weakPasswordTitle"),
        description: t("settings.toasts.weakPasswordDesc"),
        variant: "destructive",
      });
      return;
    }

    setChangePasswordLoading(true);

    try {
      // First, verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || "",
        password: currentPassword,
      });

      if (signInError) {
        showError(
          t("settings.toasts.invalidPasswordTitle"),
          t("settings.toasts.currentPasswordIncorrect")
        );
        setChangePasswordLoading(false);
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        showError(t("settings.toasts.updateFailedTitle"), error.message);
      } else {
        try {
          const userRes = await supabase.auth.getUser();
          const user = userRes.data.user;
          if (user && user.email) {
            const oldKey = getKey();
            const oldSearchKey = getSearchKey();

            await setupKeysFromPassword(newPassword, user.email, user.id);

            const newKey = getKey();
            const newSearchKey = getSearchKey();

            if (oldKey && newKey && oldSearchKey && newSearchKey) {
              await triggerKeyRotation(oldKey, newKey, oldSearchKey, newSearchKey);
            }
          }
        } catch (rotateErr) {
          console.error("Failed to rotate keys after password update:", rotateErr);
        }

        showSuccess(
          t("settings.toasts.passwordUpdatedTitle"),
          t("settings.toasts.passwordUpdatedDesc")
        );
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      showError(
        t("settings.toasts.unexpectedErrorTitle"),
        t("settings.toasts.unexpectedErrorDesc")
      );
    } finally {
      setChangePasswordLoading(false);
    }
  };

  // Handle Delete Account
  const handleDeleteAccount = async () => {
    setDeleteLoading(true);

    try {
      if (!deletePassword) {
        toast({
          title: t("settings.toasts.validationErrorTitle"),
          description: t("settings.toasts.enterPasswordToConfirm"),
          variant: "destructive",
        });
        setDeleteLoading(false);
        return;
      }

      // Verify password
      const user = (await supabase.auth.getUser()).data.user;
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: deletePassword,
      });

      if (signInError) {
        showError(
          t("settings.toasts.invalidPasswordTitle"),
          t("settings.toasts.passwordIncorrect")
        );
        setDeleteLoading(false);
        return;
      }

      // Call Edge Function to perform deletion via Admin API
      const { error: deleteFuncError } = await supabase.functions.invoke("delete-user-account");

      if (deleteFuncError) {
        showError(t("settings.toasts.deletionFailedTitle"), deleteFuncError.message);
      } else {
        // Log out locally (clear session)
        await supabase.auth.signOut();
        showSuccess(
          t("settings.toasts.accountDeletedTitle"),
          t("settings.toasts.accountDeletedDesc")
        );
        
        // Clear storage and redirect
        clearSafeStorage();
        navigate("/auth");
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error("[DELETE_ACCOUNT_ERROR]", err);

      if (err?.message?.includes("Unauthorized")) {
    showError(t("settings.toasts.unauthorizedTitle"), t("settings.toasts.unauthorizedDesc"));
  } else if (err?.message?.includes("User not found")) {
    showError(t("settings.toasts.userNotFoundTitle"), t("settings.toasts.userNotFoundDesc"));
  } else if (err?.message?.includes("network")) {
    showError(t("settings.toasts.networkErrorTitle"), t("settings.toasts.networkErrorDesc"));
  } else {
    showError(
      t("settings.toasts.deletionFailedTitle"),
      t("settings.toasts.deletionUnexpectedDesc")
    );
  }
} finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("settings.title")}</h1>
        <p className="text-gray-500">{t("settings.subtitle")}</p>
      </div>

      <Tabs defaultValue="password" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="password" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">{t("settings.tabs.password")}</span>
            <span className="sm:hidden">{t("settings.tabs.passwordShort")}</span>
          </TabsTrigger>
          <TabsTrigger value="2fa" className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">{t("settings.tabs.twoFactor")}</span>
            <span className="sm:hidden">{t("settings.tabs.twoFactorShort")}</span>
          </TabsTrigger>
          <TabsTrigger value="language" className="flex items-center gap-2">
            <Languages className="w-4 h-4" />
            <span className="hidden sm:inline">{t("settings.tabs.language")}</span>
            <span className="sm:hidden">{t("settings.tabs.languageShort")}</span>
          </TabsTrigger>
          <TabsTrigger value="accessibility" className="flex items-center gap-2">
            <Accessibility className="w-4 h-4" />
            <span className="hidden sm:inline">{t("settings.tabs.accessibility")}</span>
            <span className="sm:hidden">{t("settings.tabs.accessibilityShort")}</span>
          </TabsTrigger>
          <TabsTrigger value="delete" className="flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t("settings.tabs.delete")}</span>
            <span className="sm:hidden">{t("settings.tabs.deleteShort")}</span>
          </TabsTrigger>
        </TabsList>

        {/* Change Password Tab */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.password.title")}</CardTitle>
              <CardDescription>{t("settings.password.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="current-password">{t("settings.password.current")}</Label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder={t("settings.password.currentPlaceholder")}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>

                {/* New Password with Strength Meter */}
                <PasswordStrengthMeter
                  value={newPassword}
                  onChange={setNewPassword}
                  label={t("settings.password.new")}
                  placeholder={t("settings.password.newPlaceholder")}
                  policy={DEFAULT_PASSWORD_POLICY}
                  showGenerator={true}
                  id="new-password"
                />

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t("settings.password.confirm")}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder={t("settings.password.confirmPlaceholder")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-600">{t("settings.password.mismatch")}</p>
                  )}
                  {confirmPassword && newPassword === confirmPassword && (
                    <p className="text-xs text-green-600">{t("settings.password.match")}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={changePasswordLoading}
                  className="w-full"
                >
                  {changePasswordLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("settings.password.updating")}
                    </>
                  ) : (
                    t("settings.password.update")
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Two-Factor Auth Tab */}
        <TabsContent value="2fa">
          <TwoFactorAuth />
        </TabsContent>

        {/* Language Tab */}
        <TabsContent value="language">
          <LanguageSwitcher />
        </TabsContent>

        {/* Accessibility Tab */}
        <TabsContent value="accessibility">
          <AccessibilitySettings />
        </TabsContent>

        {/* Delete Account Tab */}
        <TabsContent value="delete">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <CardTitle className="text-destructive">
                  {t("settings.delete.title")}
                </CardTitle>
              </div>
              <CardDescription>
                {t("settings.delete.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Warning Box */}
              <div className="bg-destructive/5 dark:bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <h4 className="font-semibold text-destructive mb-2">
                  {t("settings.delete.warningTitle")}
                </h4>
                <ul className="text-sm text-destructive/80 space-y-1 list-disc list-inside">
                  <li>{t("settings.delete.warning1")}</li>
                  <li>{t("settings.delete.warning2")}</li>
                  <li>{t("settings.delete.warning3")}</li>
                  <li>{t("settings.delete.warning4")}</li>
                </ul>
              </div>

              {/* Password Confirmation */}
              <div className="space-y-2">
                <Label htmlFor="delete-password">
                  {t("settings.delete.confirmLabel")}
                </Label>
                <div className="relative">
                  <Input
                    id="delete-password"
                    type={showDeletePassword ? "text" : "password"}
                    placeholder={t("settings.delete.confirmPlaceholder")}
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none"
                    aria-label={showDeletePassword ? "Hide password" : "Show password"}
                  >
                    {showDeletePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Delete Button */}
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={!deletePassword}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("settings.delete.button")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              {t("settings.delete.dialogTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{t("settings.delete.dialogQuestion")}</p>
              <p className="font-semibold">{t("settings.delete.dialogWarning")}</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-destructive/10 border border-destructive/20 rounded p-3 text-sm text-destructive">
            {t("settings.delete.dialogNote")}
          </div>
          <div className="flex gap-3">
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("settings.delete.deleting")}
                </>
              ) : (
                t("settings.delete.confirmButton")
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
