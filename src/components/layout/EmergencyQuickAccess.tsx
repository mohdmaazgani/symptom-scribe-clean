import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LifeBuoy, X, PhoneCall, BookOpen, Navigation,
  Loader2, CheckCircle2, AlertTriangle, Phone,
} from "lucide-react";
import { showSuccess, showWarning, showError, showInfo } from "@/lib/toast-helpers";
import { supabase } from "@/integrations/supabase/client";
import { meshNetwork } from "@/lib/mesh-network";
import { whenEncryptionReady, decryptProfileField } from "@/lib/encryption";

// ─── Mobile Detection (mirrors Emergency.tsx) ───────────────────────────────
const isMobile = () =>
  typeof window !== "undefined" &&
  /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

type AlertStatus = "idle" | "locating" | "sending" | "success" | "error";

/**
 * EmergencyQuickAccess
 *
 * A persistent floating action button, mounted once at the app-shell/layout
 * level, that gives one-tap access to the three most urgent actions from
 * anywhere in the app:
 *   1. Call emergency services
 *   2. Open the emergency / first-aid guide
 *   3. Alert the saved emergency contact
 *
 * It intentionally does not duplicate state from Emergency.tsx — it re-fetches
 * the minimal profile fields it needs and calls the same underlying
 * meshNetwork.triggerEmergencyAlert() used there, so both surfaces stay in sync.
 */
const EmergencyQuickAccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const [profile, setProfile] = useState<{
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [alertStatus, setAlertStatus] = useState<AlertStatus>("idle");

  // Hide the button on the Emergency page itself — it already has every
  // action front and center there, so a floating duplicate is just noise.
  const isOnEmergencyPage = location.pathname.startsWith("/emergency");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setProfileLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from("profiles")
          .select("emergency_contact_name, emergency_contact_phone")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error loading emergency profile info:", error);
        } else if (data) {
          const key = await whenEncryptionReady();
          const decryptedName = await decryptProfileField(data.emergency_contact_name, key);
          const decryptedPhone = await decryptProfileField(data.emergency_contact_phone, key);
          setProfile({
            emergency_contact_name: decryptedName,
            emergency_contact_phone: decryptedPhone,
          });
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleCall = () => {
    // Let the native tel: link do the work on mobile; on desktop, explain.
    if (!isMobile()) {
      showInfo(t("emergencyQuickAccess.onMobileTitle"), t("emergencyQuickAccess.onMobileDesc"));
    }
  };

  const handleOpenGuide = () => {
    setOpen(false);
    navigate("/emergency");
  };

  const handleAlertContact = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showWarning(
        t("emergencyQuickAccess.authRequiredTitle"),
        t("emergencyQuickAccess.authRequiredDesc")
      );
      return;
    }
    if (!profile || !profile.emergency_contact_phone) {
      showWarning(
        t("emergencyQuickAccess.noContactSavedTitle"),
        t("emergencyQuickAccess.noContactSavedDesc")
      );
      return;
    }

    setAlertStatus("locating");

    const executeMeshAlert = async (lat: number | null, lon: number | null) => {
      setAlertStatus("sending");
      try {
        const contactName =
          profile.emergency_contact_name || t("emergencyQuickAccess.defaultContactName");
        const contactPhone = profile.emergency_contact_phone as string;
        await meshNetwork.triggerEmergencyAlert(lat, lon, contactName, contactPhone);

        setAlertStatus("success");
        showSuccess(
          meshNetwork.isOnline()
            ? t("emergencyQuickAccess.alertSentTitle")
            : t("emergencyQuickAccess.alertQueuedTitle"),
          meshNetwork.isOnline()
            ? t("emergencyQuickAccess.alertSentDesc", { name: contactName })
            : t("emergencyQuickAccess.alertQueuedDesc", { name: contactName })
        );
        setTimeout(() => setAlertStatus("idle"), 4000);
      } catch (err) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred.";
        console.error("Failed to broadcast alert:", err);
        setAlertStatus("error");
        showError(t("emergencyQuickAccess.broadcastFailedTitle"), message);
        setTimeout(() => setAlertStatus("idle"), 4000);
      }
    };

    if (!navigator.geolocation) {
      await executeMeshAlert(null, null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await executeMeshAlert(position.coords.latitude, position.coords.longitude);
      },
      async (err) => {
        console.error("Geolocation failed:", err);
        await executeMeshAlert(null, null);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  if (isOnEmergencyPage) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t("emergencyQuickAccess.openLabel")}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive text-white px-3 py-2 text-sm font-semibold shadow-sm shadow-destructive/20 hover:bg-destructive/90 transition duration-150"
      >
        <LifeBuoy className="w-4 h-4" />
        <span className="hidden xl:inline">{t("emergencyQuickAccess.needHelp")}</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
            />
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background border-t border-border p-4 pb-6 sm:max-w-md sm:mx-auto sm:rounded-2xl sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:border shadow-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                  <LifeBuoy className="w-4 h-4 text-destructive" />
                  {t("emergencyQuickAccess.title")}
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  aria-label={t("common.close")}
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-2">
                <a
                  href="tel:112"
                  onClick={handleCall}
                  className="flex items-center gap-3 w-full rounded-xl bg-destructive hover:bg-destructive/90 active:scale-[0.98] transition-all px-4 py-3 text-white font-bold text-sm"
                >
                  <PhoneCall className="w-5 h-5 animate-pulse flex-shrink-0" />
                  <span className="flex-1 text-left">{t("emergencyQuickAccess.callServices")}</span>
                  <span className="text-xs font-normal opacity-80">
                    {t("emergencyQuickAccess.callNumbers")}
                  </span>
                </a>

                <button
                  onClick={handleOpenGuide}
                  className="flex items-center gap-3 w-full rounded-xl bg-muted hover:bg-muted/80 active:scale-[0.98] transition-all px-4 py-3 text-foreground font-semibold text-sm"
                >
                  <BookOpen className="w-5 h-5 flex-shrink-0 text-destructive" />
                  <span className="flex-1 text-left">{t("emergencyQuickAccess.openGuide")}</span>
                </button>

                {profileLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2.5 px-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("emergencyQuickAccess.checkingContact")}
                  </div>
                ) : !profile || !profile.emergency_contact_phone ? (
                  <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-xs text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{t("emergencyQuickAccess.noContactTitle")}</p>
                      <button
                        onClick={() => { setOpen(false); navigate("/profile"); }}
                        className="underline underline-offset-2 mt-0.5"
                      >
                        {t("emergencyQuickAccess.addInProfile")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    disabled={alertStatus !== "idle"}
                    onClick={handleAlertContact}
                    className={`flex items-center gap-3 w-full rounded-xl active:scale-[0.98] transition-all px-4 py-3 text-white font-semibold text-sm
                      ${alertStatus === "idle" ? "bg-blue-600 hover:bg-blue-600/90" : ""}
                      ${alertStatus === "locating" ? "bg-orange-500 animate-pulse" : ""}
                      ${alertStatus === "sending" ? "bg-blue-600" : ""}
                      ${alertStatus === "success" ? "bg-green-600" : ""}
                      ${alertStatus === "error" ? "bg-destructive/80" : ""}
                    `}
                  >
                    {alertStatus === "idle" && (
                      <>
                        <Navigation className="w-5 h-5 flex-shrink-0" />
                        <span className="flex-1 text-left">
                          {t("emergencyQuickAccess.alertContact", {
                            name:
                              profile.emergency_contact_name ||
                              t("emergencyQuickAccess.defaultContactName"),
                          })}
                        </span>
                      </>
                    )}
                    {alertStatus === "locating" && (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                        <span className="flex-1 text-left">
                          {t("emergencyQuickAccess.acquiringLocation")}
                        </span>
                      </>
                    )}
                    {alertStatus === "sending" && (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                        <span className="flex-1 text-left">
                          {t("emergencyQuickAccess.sendingAlert")}
                        </span>
                      </>
                    )}
                    {alertStatus === "success" && (
                      <>
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span className="flex-1 text-left">
                          {t("emergencyQuickAccess.alertBroadcast")}
                        </span>
                      </>
                    )}
                    {alertStatus === "error" && (
                      <>
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <span className="flex-1 text-left">
                          {t("emergencyQuickAccess.broadcastFailedRetry")}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground text-center mt-3">
                {t("emergencyQuickAccess.footerNote")}
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default EmergencyQuickAccess;