import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Lock, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import { DEFAULT_PASSWORD_POLICY, evaluatePasswordStrength } from "@/lib/password-strength";
import { showSuccess, showError } from "@/lib/toast-helpers";
import { clearSafeStorage } from "@/lib/storage";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  // Delete Account State
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!currentPassword) {
      toast({
        title: "Validation Error",
        description: "Please enter your current password",
        variant: "destructive",
      });
      return;
    }

    if (!newPassword) {
      toast({
        title: "Validation Error",
        description: "Please enter a new password",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    const strength = evaluatePasswordStrength(newPassword, DEFAULT_PASSWORD_POLICY);
    if (!strength.isStrong) {
      toast({
        title: "Weak Password",
        description: "Password does not meet strength requirements",
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
        showError("Invalid Password", "Current password is incorrect");
        setChangePasswordLoading(false);
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        showError("Update Failed", error.message);
      } else {
        showSuccess("Password Updated!", "Your password has been changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      showError("Error", "An unexpected error occurred");
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
          title: "Validation Error",
          description: "Please enter your password to confirm",
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
        showError("Invalid Password", "Password is incorrect");
        setDeleteLoading(false);
        return;
      }

      // Call Edge Function to perform deletion via Admin API
      const { error: deleteFuncError } = await supabase.functions.invoke("delete-user-account");

      if (deleteFuncError) {
        showError("Deletion Failed", deleteFuncError.message);
      } else {
        // Log out locally (clear session)
        await supabase.auth.signOut();
        showSuccess("Account Deleted", "Your account has been deleted successfully");
        
        // Clear storage and redirect
        clearSafeStorage();
        navigate("/auth");
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error("[DELETE_ACCOUNT_ERROR]", err);

      if (err?.message?.includes("Unauthorized")) {
    showError(
      "Unauthorized",
      "You are not authorized to delete this account"
    );
  } else if (err?.message?.includes("User not found")) {
    showError(
      "User Not Found",
      "The account could not be found"
    );
  } else if (err?.message?.includes("network")) {
    showError(
      "Network Error",
      "Please check your internet connection and try again"
    );
  } else {
    showError(
      "Deletion Failed",
      "An unexpected error occurred while deleting your account"
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
        <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
        <p className="text-gray-500">Manage your account security and preferences</p>
      </div>

      <Tabs defaultValue="password" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="password" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Change Password</span>
            <span className="sm:hidden">Password</span>
          </TabsTrigger>
          <TabsTrigger value="delete" className="flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Delete Account</span>
            <span className="sm:hidden">Delete</span>
          </TabsTrigger>
        </TabsList>

        {/* Change Password Tab */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="Enter your current password"
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
                  label="New Password"
                  placeholder="Create a strong password"
                  policy={DEFAULT_PASSWORD_POLICY}
                  showGenerator={true}
                  id="new-password"
                />

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-600">Passwords do not match</p>
                  )}
                  {confirmPassword && newPassword === confirmPassword && (
                    <p className="text-xs text-green-600">Passwords match</p>
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
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delete Account Tab */}
        <TabsContent value="delete">
          <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <CardTitle className="text-red-600 dark:text-red-400">Delete Account</CardTitle>
              </div>
              <CardDescription className="text-red-700 dark:text-red-300">
                This action cannot be undone
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Warning Box */}
              <div className="bg-white dark:bg-slate-900 border border-red-300 dark:border-red-800 rounded-lg p-4">
                <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2">
                  Warning: Permanent Deletion
                </h4>
                <ul className="text-sm text-red-600 dark:text-red-300 space-y-1 list-disc list-inside">
                  <li>Your account will be permanently deleted</li>
                  <li>All your health data and history will be removed</li>
                  <li>This action cannot be reversed</li>
                  <li>You will need to create a new account to use the service again</li>
                </ul>
              </div>

              {/* Password Confirmation */}
              <div className="space-y-2">
                <Label htmlFor="delete-password">Confirm with your password</Label>
                <Input
                  id="delete-password"
                  type="password"
                  placeholder="Enter your password to confirm"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              {/* Delete Button */}
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={!deletePassword}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete My Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Delete Account?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you absolutely sure you want to delete your account?</p>
              <p className="font-semibold">
                This will permanently remove all your data and cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded p-3 text-sm text-red-700 dark:text-red-300">
            You will be logged out and redirected to the login page.
          </div>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
