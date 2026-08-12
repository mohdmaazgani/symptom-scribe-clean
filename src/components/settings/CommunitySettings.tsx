import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Eye, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast-helpers";

export function CommunitySettings() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [optIn, setOptIn] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("community_opt_in, community_visible")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!error && data) {
          setOptIn(!!data.community_opt_in);
          setVisible(data.community_visible !== false);
        }
      } catch (err) {
        console.error("Failed to load community privacy settings:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            community_opt_in: optIn,
            community_visible: visible,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;

      showSuccess(
        t("community.settings.saveSuccessTitle", "Settings Saved"),
        optIn
          ? t("community.settings.optInSuccess", "Community features enabled with anonymity controls.")
          : t("community.settings.optOutSuccess", "You have opted out of community features.")
      );
    } catch (err: unknown) {
      const error = err as Error;
      showError(
        t("community.settings.saveErrorTitle", "Failed to Update Settings"),
        error.message || t("community.settings.saveErrorDesc", "Could not save privacy settings.")
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-500" />
            <CardTitle>{t("community.settings.title", "Community & Social Privacy")}</CardTitle>
          </div>
          <Badge variant={optIn ? "default" : "outline"} className={optIn ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : ""}>
            {optIn ? t("community.settings.statusOptedIn", "Opted In") : t("community.settings.statusOptedOut", "Opted Out")}
          </Badge>
        </div>
        <CardDescription>
          {t(
            "community.settings.description",
            "Manage your participation in anonymous support groups, progress sharing, and visibility controls."
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Opt in/out toggle */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-card border border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-medium">
              <Shield className="w-4 h-4 text-cyan-400" />
              <Label htmlFor="opt-in-toggle" className="cursor-pointer text-base">
                {t("community.settings.optInLabel", "Enable Community Support Groups")}
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              {t(
                "community.settings.optInDesc",
                "Join support groups, share progress achievements, and ask questions anonymously. You can opt out at any time."
              )}
            </p>
          </div>
          <Switch
            id="opt-in-toggle"
            checked={optIn}
            onCheckedChange={setOptIn}
          />
        </div>

        {/* Visibility toggle */}
        <div className={`flex items-start justify-between gap-4 p-4 rounded-xl bg-card border border-border transition-opacity ${!optIn ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-medium">
              <Eye className="w-4 h-4 text-cyan-400" />
              <Label htmlFor="visibility-toggle" className="cursor-pointer text-base">
                {t("community.settings.visibleLabel", "Anonymous Profile Visibility")}
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              {t(
                "community.settings.visibleDesc",
                "Allow other group members to see your posts and group-specific anonymous username in group feeds."
              )}
            </p>
          </div>
          <Switch
            id="visibility-toggle"
            checked={visible}
            disabled={!optIn}
            onCheckedChange={setVisible}
          />
        </div>

        {/* Anonymity Notice */}
        <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            {t("community.settings.privacyGuarantee", "Privacy & PHI Protection Guarantee")}
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
            <li>{t("community.settings.point1", "No Personal Health Information (PHI) or real names are exposed in groups.")}</li>
            <li>{t("community.settings.point2", "Each group assigns you a unique pseudonymous handle (e.g. SupportiveSquirrel7).")}</li>
            <li>{t("community.settings.point3", "Opting out removes your visibility from community group feeds immediately.")}</li>
          </ul>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("common.saving", "Saving...")}
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {t("community.settings.saveButton", "Save Privacy Preferences")}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
