import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Phone, AlertTriangle, MapPin, ExternalLink,
  Heart, Wind, Brain, Thermometer, Zap, Clock,
  ChevronDown, ChevronUp, CheckCircle2, Copy, Share2,
  ShieldAlert, Flame, Activity, PhoneCall, Volume2, VolumeX,
  Hospital, Pill, Stethoscope, Bell, BookOpen,
  Navigation, Loader2, Radio, Users, Database, RefreshCw, Lock,
  WifiOff, Wifi
} from "lucide-react";
import { showSuccess, showInfo, showError, showWarning } from "@/lib/toast-helpers";
import { supabase } from "@/integrations/supabase/client";
import { meshNetwork, type MeshPeer } from "@/lib/mesh-network";
import { db, type MeshAlert } from "@/lib/offline-db";

// ─── Mobile Detection ────────────────────────────────────────────────────────
const isMobile = () =>
  typeof window !== "undefined" &&
  /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

// ─── Data ────────────────────────────────────────────────────────────────────

const emergencyNumbers = [
  { country: "USA",       flag: "🇺🇸", number: "911",  callNumber: "911",        description: "Emergency Services" },
  { country: "UK",        flag: "🇬🇧", number: "999",  callNumber: "999",        description: "Emergency Services" },
  { country: "Europe",    flag: "🇪🇺", number: "112",  callNumber: "112",        description: "Emergency Services" },
  { country: "India",     flag: "🇮🇳", number: "102",  callNumber: "102",        description: "Ambulance" },
  { country: "Australia", flag: "🇦🇺", number: "000",  callNumber: "000",        description: "Emergency Services" },
  { country: "Canada",    flag: "🇨🇦", number: "911",  callNumber: "911",        description: "Emergency Services" },
  { country: "Japan",     flag: "🇯🇵", number: "119",  callNumber: "119",        description: "Ambulance & Fire" },
  { country: "Germany",   flag: "🇩🇪", number: "112",  callNumber: "112",        description: "Emergency Services" },
  { country: "France",    flag: "🇫🇷", number: "15",   callNumber: "15",         description: "Medical Emergency (SAMU)" },
  { country: "Brazil",    flag: "🇧🇷", number: "192",  callNumber: "192",        description: "Medical Emergency (SAMU)" },
];

const crisisHotlines = [
  { name: "National Suicide Prevention Lifeline", contact: "988",            callNumber: "988",         type: "call", country: "USA",           available: "24/7" },
  { name: "Crisis Text Line",                     contact: "741741",         callNumber: null,          type: "text", country: "USA/CA/UK/IE",   available: "24/7" },
  { name: "Samaritans",                           contact: "116 123",        callNumber: "116123",      type: "call", country: "UK & Ireland",   available: "24/7" },
  { name: "iCall",                                contact: "9152987821",     callNumber: "9152987821",  type: "call", country: "India",          available: "Mon–Sat 8am–10pm" },
  { name: "Lifeline",                             contact: "13 11 14",       callNumber: "131114",      type: "call", country: "Australia",      available: "24/7" },
  { name: "Kids Help Phone",                      contact: "1-800-668-6868", callNumber: "18006686868", type: "call", country: "Canada",         available: "24/7" },
];

const firstAidGuides = [
  {
    id: "cpr",
    icon: Heart,
    title: "CPR (Cardiac Arrest)",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    badgeColor: "bg-red-500/20 text-red-500 border-red-500/30",
    urgency: "LIFE THREATENING",
    isLifeThreatening: true,
    animationClass: "animate-pulse",
    steps: [
      "Call emergency services (911/999/112) immediately or ask someone else to call",
      "Lay the person flat on their back on a firm surface",
      "Place the heel of your hand on the centre of their chest, then your other hand on top. Interlace fingers",
      "Push hard and fast — compress at least 2 inches (5cm) deep, 100–120 times per minute",
      "If trained: give 2 rescue breaths after every 30 compressions. If not trained: chest compressions only",
      "Continue until emergency services arrive or the person recovers",
    ],
  },
  {
    id: "choking",
    icon: Wind,
    title: "Choking (Adult)",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    badgeColor: "bg-orange-500/20 text-orange-500 border-orange-500/30",
    urgency: "LIFE THREATENING",
    isLifeThreatening: true,
    animationClass: "animate-bounce",
    steps: [
      "Ask 'Are you choking?' — if they cannot speak, cough, or breathe, act immediately",
      "Stand behind the person, slightly to one side. Support their chest with one hand",
      "Lean them forward and give up to 5 firm back blows between the shoulder blades",
      "If back blows fail: give up to 5 abdominal thrusts (Heimlich manoeuvre)",
      "Alternate 5 back blows with 5 abdominal thrusts until the blockage clears",
      "If the person becomes unconscious, call emergency services and begin CPR",
    ],
  },
  {
    id: "stroke",
    icon: Brain,
    title: "Stroke — FAST Test",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    badgeColor: "bg-purple-500/20 text-purple-500 border-purple-500/30",
    urgency: "CALL 911 IMMEDIATELY",
    isLifeThreatening: true,
    animationClass: "animate-ping",
    steps: [
      "F — FACE: Ask them to smile. Is one side drooping?",
      "A — ARMS: Ask them to raise both arms. Does one drift downward?",
      "S — SPEECH: Ask them to repeat a simple phrase. Is it slurred or strange?",
      "T — TIME: If ANY of the above, call emergency services immediately",
      "Do NOT give food or water — swallowing may be impaired",
      "Keep them calm, comfortable and still. Do not leave them alone",
    ],
  },
  {
    id: "burns",
    icon: Thermometer,
    title: "Severe Burns",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    badgeColor: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
    urgency: "CALL 911 IF SEVERE",
    isLifeThreatening: false,
    animationClass: "",
    steps: [
      "Remove the person from danger. Do NOT remove clothing stuck to the burn",
      "Cool the burn under cool (not cold/ice) running water for at least 20 minutes",
      "Do NOT use butter, toothpaste, oils or ice — these cause more damage",
      "Cover loosely with cling film or a clean non-fluffy material",
      "Call emergency services if burn is larger than a palm or on face/hands",
      "Keep the person warm and monitor for shock",
    ],
  },
  {
    id: "bleeding",
    icon: Zap,
    title: "Severe Bleeding",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    badgeColor: "bg-rose-500/20 text-rose-500 border-rose-500/30",
    urgency: "CALL 911 IF SEVERE",
    isLifeThreatening: false,
    animationClass: "",
    steps: [
      "Call emergency services if bleeding is severe or doesn't stop",
      "Apply firm, direct pressure to the wound with a clean cloth. Do NOT remove it",
      "If an object is embedded, do NOT remove it — apply pressure around it",
      "Elevate the injured area above the level of the heart if possible",
      "If cloth soaks through, apply another layer on top",
      "Watch for signs of shock: pale/cold/clammy skin, rapid weak pulse",
    ],
  },
];

const warningSigns = [
  { icon: "❤️", text: "Chest pain or pressure" },
  { icon: "💨", text: "Difficulty breathing" },
  { icon: "🧠", text: "Sudden confusion or weakness" },
  { icon: "🩸", text: "Uncontrolled severe bleeding" },
  { icon: "😶", text: "Loss of consciousness" },
  { icon: "🤧", text: "Severe allergic reaction" },
  { icon: "🔥", text: "Severe burns on large areas" },
  { icon: "💊", text: "Suspected poisoning or overdose" },
  { icon: "😢", text: "Suicidal thoughts or self-harm" },
  { icon: "🗣️", text: "Sudden slurred speech" },
];

const reminders = [
  { icon: Phone,        text: "Always call emergency services first in a life-threatening situation" },
  { icon: Navigation,   text: "Provide your exact location — street address, landmarks, floor number" },
  { icon: Bell,         text: "Stay on the line and follow dispatcher instructions carefully" },
  { icon: BookOpen,     text: "Know basic first aid — consider taking a certified course" },
  { icon: Heart,        text: "Keep your emergency contacts updated in your profile" },
  { icon: Pill,         text: "Have your medical information and allergies readily available" },
];

const navItems = [
  { id: "numbers",  label: "Numbers",   icon: Phone },
  { id: "firstaid", label: "First Aid", icon: Activity },
  { id: "crisis",   label: "Crisis",    icon: Heart },
  { id: "find",     label: "Find Help", icon: MapPin },
];

// ─── Component ───────────────────────────────────────────────────────────────

const EmergencyClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const tick = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-2 rounded-lg">
      <Clock className="w-4 h-4" />
      <span className="font-mono">{currentTime.toLocaleTimeString()}</span>
    </div>
  );
};

const Emergency = () => {
  const navigate = useNavigate();
  const [expandedGuide, setExpandedGuide]         = useState<string | null>(null);
  // tracks which LIFE THREATENING guides have confirmed the call step
  const [calledFor, setCalledFor]                 = useState<string[]>([]);
  const [searchCountry, setSearchCountry]         = useState("");
  const [copiedNumber, setCopiedNumber]           = useState<string | null>(null);
  const [muted, setMuted]                         = useState(false);

  const [activeSection, setActiveSection]         = useState("numbers");
  const [checkedReminders, setCheckedReminders]   = useState<number[]>([]);
  const [hospitalLoading, setHospitalLoading]     = useState<string | null>(null);
  const [detectedCountry, setDetectedCountry]     = useState<string | null>(null);

  // Emergency Contact & Broadcast states
  const [profile, setProfile] = useState<{
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    full_name: string | null;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [alertStatus, setAlertStatus] = useState<"idle" | "locating" | "sending" | "success" | "error">("idle");
  const [alertProgressMessage, setAlertProgressMessage] = useState("");

  // P2P Emergency Mesh network states
  const [peers, setPeers] = useState<MeshPeer[]>([]);
  const [meshAlerts, setMeshAlerts] = useState<MeshAlert[]>([]);
  const [isOfflineSim, setIsOfflineSim] = useState(meshNetwork.getOfflineSimulation());

  // Set node name once profile details are loaded
  useEffect(() => {
    if (profile?.full_name) {
      meshNetwork.setNodeName(profile.full_name);
    }
  }, [profile]);

  // Sync state with mesh network manager
  useEffect(() => {
    const updateMeshState = async () => {
      setPeers(meshNetwork.getPeers());
      setIsOfflineSim(meshNetwork.getOfflineSimulation());
      try {
        const alerts = await db.pendingEmergencyMesh.toArray();
        // Sort alerts by timestamp descending
        alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setMeshAlerts(alerts);
      } catch (err) {
        console.error("Failed to load mesh alerts:", err);
      }
    };

    updateMeshState();

    // Subscribe to mesh manager notifications
    const unsubscribe = meshNetwork.subscribe(updateMeshState);

    // BroadcastChannel receiver event handlers for real-time notifications
    const handleAlertReceived = (e: Event) => {
      const customEvent = e as CustomEvent<MeshAlert>;
      showInfo(
        "Mesh Alert Received",
        `Emergency alert from ${customEvent.detail.sender_name} received via local P2P mesh network.`
      );
      updateMeshState();
    };

    const handleSyncCompleted = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      showSuccess(
        "Gateway Sync Relay",
        `Alert ${customEvent.detail.substring(0, 8)}... successfully relayed to the cloud gateway!`
      );
      updateMeshState();
    };

    window.addEventListener("mesh-alert-received", handleAlertReceived);
    window.addEventListener("mesh-sync-completed", handleSyncCompleted);

    return () => {
      unsubscribe();
      window.removeEventListener("mesh-alert-received", handleAlertReceived);
      window.removeEventListener("mesh-sync-completed", handleSyncCompleted);
    };
  }, []);

  // Fetch emergency contact profile info
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
          .select("full_name, emergency_contact_name, emergency_contact_phone")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error loading emergency profile info:", error);
        } else if (data) {
          setProfile(data);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleAlertContacts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showWarning("Authentication Required", "Please sign in to alert emergency contacts");
      return;
    }

    if (!profile || !profile.emergency_contact_phone) {
      showWarning(
        "No Contact Saved",
        "Please configure an emergency contact in your Health Profile page first."
      );
      return;
    }

    playBeep();
    setAlertStatus("locating");
    setAlertProgressMessage("Acquiring real-time location...");

    const executeMeshAlert = async (lat: number | null, lon: number | null) => {
      setAlertStatus("sending");
      setAlertProgressMessage(
        meshNetwork.isOnline()
          ? "Broadcasting via cloud gateway..."
          : "Offline: Caching alert and broadcasting to local P2P mesh..."
      );
      try {
        const contactName = profile.emergency_contact_name || "Emergency Contact";
        const contactPhone = profile.emergency_contact_phone;

        await meshNetwork.triggerEmergencyAlert(lat, lon, contactName, contactPhone);

        setAlertStatus("success");
        if (meshNetwork.isOnline()) {
          showSuccess(
            "Alert Sent!",
            `Emergency alert successfully broadcast to ${contactName}.`
          );
        } else {
          showWarning(
            "Offline Mode: Broadcast Queued",
            `No connection. Alert signed and broadcast to local P2P mesh peers. It will sync automatically when a peer goes online.`
          );
        }
        setTimeout(() => setAlertStatus("idle"), 5000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
        console.error("Failed to broadcast alert:", err);
        setAlertStatus("error");
        showError("Broadcast Failed", errorMessage);
        setTimeout(() => setAlertStatus("idle"), 5000);
      }
    };

    if (!navigator.geolocation) {
      setAlertProgressMessage("Location service not supported. Broadcaster starting...");
      await executeMeshAlert(null, null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setAlertProgressMessage("Location acquired. Starting broadcast...");
        await executeMeshAlert(latitude, longitude);
      },
      async (error) => {
        console.error("Geolocation failed:", error);
        setAlertProgressMessage("Unable to get location. Starting broadcast without coordinates...");
        await executeMeshAlert(null, null);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    // Attempt keyless geolocation lookup using ipapi.co
    fetch("https://ipapi.co/json/")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        if (data.country_name) {
          // Normalize country names if needed (e.g. "United States" vs "USA", "United Kingdom" vs "UK")
          let mappedName = data.country_name;
          if (mappedName === "United States") mappedName = "USA";
          else if (mappedName === "United Kingdom") mappedName = "UK";
          setDetectedCountry(mappedName);
        }
      })
      .catch((err) => {
        console.error("Geolocation fetch failed:", err);
      });
  }, []);

  const getDetectedCountryMatch = () => {
    if (!detectedCountry) return null;
    const lower = detectedCountry.toLowerCase();
    
    // Direct matches
    const directMatch = emergencyNumbers.find(n => n.country.toLowerCase() === lower);
    if (directMatch) return directMatch;
    
    // Europe fallback mapping for EU countries
    const europeanCountries = [
      "austria", "belgium", "bulgaria", "croatia", "cyprus", "czech republic", 
      "denmark", "estonia", "finland", "greece", "hungary", "ireland", "italy", 
      "latvia", "lithuania", "luxembourg", "malta", "netherlands", "poland", 
      "portugal", "romania", "slovakia", "slovenia", "spain", "sweden"
    ];
    if (europeanCountries.includes(lower)) {
      return emergencyNumbers.find(n => n.country === "Europe") || null;
    }
    
    return null;
  };


  // ── Beep sound using Web Audio API ────────────────────────────────────────
  const playBeep = () => {
    if (muted) return;
    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = 880;
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } catch (err) {
      console.error("Audio beep failed:", err);
    }
  };

  // ── Filtered numbers ───────────────────────────────────────────────────────
  const localMatch = getDetectedCountryMatch();
  const filteredNumbers = emergencyNumbers.filter(
    (n) => {
      if (localMatch && n.country === localMatch.country && !searchCountry) return false;
      return (
        n.country.toLowerCase().includes(searchCountry.toLowerCase()) ||
        n.number.includes(searchCountry)
      );
    }
  );

  // ── Copy handler ───────────────────────────────────────────────────────────
  const handleCopyNumber = (number: string, label: string) => {
    navigator.clipboard.writeText(number);
    setCopiedNumber(number);
    showSuccess("Copied!", `${label} copied to clipboard`);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  // ── Share page ─────────────────────────────────────────────────────────────
  const handleSharePage = () => {
    if (navigator.share) {
      navigator.share({ title: "Emergency Resources", url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showInfo("Link copied!", "Share this emergency page with others");
    }
  };

  // ── Toggle first aid accordion ─────────────────────────────────────────────
  const toggleGuide = (id: string) => {
    setExpandedGuide((prev) => (prev === id ? null : id));
  };

  // ── Confirm call made for a guide ─────────────────────────────────────────
  const confirmCalled = (id: string) => {
    setCalledFor((prev) => [...prev, id]);
  };

  // ── Hospital finder with loading state ────────────────────────────────────
  const openMap = (type: string, url: string) => {
    setHospitalLoading(type);
    setTimeout(() => {
      window.open(url, "_blank");
      setHospitalLoading(null);
    }, 800);
  };

  // ── Toggle reminder checkoff ───────────────────────────────────────────────
  const toggleReminder = (idx: number) => {
    setCheckedReminders((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-20">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-destructive" />
            Emergency Resources
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Quick access to emergency contacts, first aid guides, and crisis support
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <EmergencyClock />
          <button
            onClick={() => setMuted((m) => !m)}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            title={muted ? "Unmute panic button" : "Mute panic button"}
          >
            {muted
              ? <VolumeX className="w-4 h-4 text-muted-foreground" />
              : <Volume2 className="w-4 h-4 text-muted-foreground" />}
          </button>
          <button
            onClick={handleSharePage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      {/* ── Panic Button ─────────────────────────────────────────────────── */}
      <a
        href="tel:112"
        onClick={(e) => {
          playBeep();
          if (!isMobile()) {
            e.preventDefault();
            showInfo("On mobile?", "This button dials emergency services directly on a phone.");
          }
        }}
        className="flex items-center justify-center gap-3 w-full rounded-xl bg-destructive hover:bg-destructive/90 active:scale-95 transition-all duration-150 py-4 px-6 text-white font-bold text-lg shadow-lg shadow-destructive/30 dark:shadow-destructive/20"
      >
        <PhoneCall className="w-6 h-6 animate-pulse" />
        CALL EMERGENCY SERVICES NOW
        <span className="text-sm font-normal opacity-80 hidden sm:inline">
          — tap to dial 112 / 911 / 999
        </span>
      </a>

      {/* ── Broadcast Geolocation / Twilio SMS alerts ────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-destructive animate-bounce" />
              Broadcast Emergency Alert
            </h3>
            <p className="text-sm text-muted-foreground">
              Send an instant SMS with your real-time GPS coordinates and a Google Maps link to your trusted contact.
            </p>
          </div>
        </div>

        {profileLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="w-4 h-4 animate-spin text-destructive" />
            Checking emergency contacts...
          </div>
        ) : !profile || !profile.emergency_contact_phone ? (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">No Emergency Contact Configured</p>
                <p className="text-xs opacity-90">Please set up a contact name and phone number in your profile first.</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/profile")}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shrink-0 self-end sm:self-auto"
            >
              Configure Contact
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                disabled={alertStatus !== "idle"}
                onClick={handleAlertContacts}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-lg text-white font-bold text-sm transition-all duration-200 active:scale-95 shadow-sm
                  ${alertStatus === "idle" ? "bg-destructive hover:bg-destructive/90" : ""}
                  ${alertStatus === "locating" ? "bg-orange-500 animate-pulse" : ""}
                  ${alertStatus === "sending" ? "bg-blue-600" : ""}
                  ${alertStatus === "success" ? "bg-green-600 cursor-default" : ""}
                  ${alertStatus === "error" ? "bg-destructive/80" : ""}
                `}
              >
                {alertStatus === "idle" && (
                  <>
                    <Navigation className="w-4 h-4 animate-pulse" />
                    ALERT TRUSTED CONTACTS
                  </>
                )}
                {alertStatus === "locating" && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    ACQUIRING GPS LOCATION...
                  </>
                )}
                {alertStatus === "sending" && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    SENDING SMS BROADCAST...
                  </>
                )}
                {alertStatus === "success" && (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    EMERGENCY ALERT BROADCASTED
                  </>
                )}
                {alertStatus === "error" && (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    BROADCAST FAILED
                  </>
                )}
              </button>
            </div>

            {/* Status / Contact detail message */}
            <div className="flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2 pt-1">
              <div>
                Recipient: <span className="font-semibold text-foreground">{profile.emergency_contact_name || "Emergency Contact"}</span> ({profile.emergency_contact_phone})
              </div>
              {alertStatus !== "idle" && alertProgressMessage && (
                <div className="text-destructive font-semibold animate-pulse">
                  {alertProgressMessage}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── P2P Mesh Network Dashboard ─────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Radio className="w-5 h-5 text-primary animate-pulse" />
              {peers.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-1.5">
                P2P Emergency Alert Mesh
              </h3>
              <p className="text-xs text-muted-foreground">
                Local tab-to-tab peer simulation (BroadcastChannel)
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="offline-sim-toggle" className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                {isOfflineSim ? <WifiOff className="w-3.5 h-3.5 text-destructive" /> : <Wifi className="w-3.5 h-3.5 text-green-500" />}
                Simulate Offline
              </label>
              <button
                id="offline-sim-toggle"
                onClick={() => {
                  const val = !isOfflineSim;
                  meshNetwork.setOfflineSimulation(val);
                  setIsOfflineSim(val);
                  showInfo(
                    val ? "Offline Mode Simulated" : "Online Mode Restored",
                    val
                      ? "Twilio edge calls will be queued locally. Rebroadcast active."
                      : "Connecting to Supabase... Relaying queued mesh alerts."
                  );
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                  ${isOfflineSim ? "bg-destructive" : "bg-muted"}
                `}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${isOfflineSim ? "translate-x-6" : "translate-x-1"}
                  `}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Node Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-muted/20 p-3.5 rounded-lg border border-border">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground block font-medium">Local Node ID</span>
            <span className="font-mono text-xs font-semibold">{meshNetwork.getNodeId()}</span>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground block font-medium">Node Display Name</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={meshNetwork.getNodeName()}
                onChange={(e) => {
                  meshNetwork.setNodeName(e.target.value);
                  // Force state update to re-render
                  setPeers([...meshNetwork.getPeers()]);
                }}
                className="bg-background border border-border rounded px-2 py-0.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Set node name..."
              />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground block font-medium">Mesh Status</span>
            <div className="flex items-center gap-1.5 font-semibold">
              <span className={`h-2.5 w-2.5 rounded-full ${isOfflineSim ? "bg-amber-500 animate-pulse" : "bg-green-500 animate-pulse"}`} />
              {isOfflineSim ? "Offline Sim (Mesh Active)" : "Online Gateway"}
            </div>
          </div>
        </div>

        {/* Peers List */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> Discovered Peers ({peers.length})
          </h4>
          {peers.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3 text-center bg-muted/10 border border-dashed rounded-lg">
              No other active peers discovered. Open another tab or window on this route to simulate peers.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {peers.map((peer) => (
                <div
                  key={peer.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{peer.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground truncate">{peer.id}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
                    <span className="text-[10px] font-semibold text-green-600 dark:text-green-400">Active</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sync Queue */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Database className="w-3.5 h-3.5" /> Mesh Alert Queue & Relays ({meshAlerts.length})
          </h4>
          {meshAlerts.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3 text-center bg-muted/10 border border-dashed rounded-lg">
              Queue is empty. Broadcast an alert to populate the mesh ledger.
            </p>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
              {meshAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 bg-background flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground">{alert.sender_name}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">ID: {alert.sender_id.substring(0, 8)}...</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-primary/10 text-primary border border-primary/20">
                        <Lock className="w-2.5 h-2.5" /> Signed P-256
                      </span>
                    </div>
                    <div className="text-muted-foreground text-[10px] flex items-center gap-2 flex-wrap">
                      <span>Coords: {alert.latitude !== null && alert.longitude !== null ? `${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}` : "None"}</span>
                      <span>•</span>
                      <span>Target: {alert.contact_name} ({alert.contact_phone})</span>
                      <span>•</span>
                      <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                    {alert.pending_sync === 1 ? (
                      <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-500 bg-amber-500/5 flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Offline Cache
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-500 bg-green-500/5 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Relayed
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Pulsing Alert Strip ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-xl border border-destructive/40 bg-destructive/5 dark:bg-destructive/10 px-4 py-3">
        <span className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-destructive animate-pulse" />
        <div className="flex items-center gap-2 ml-3">
          <Flame className="w-4 h-4 text-destructive flex-shrink-0 animate-pulse" />
          <p className="text-sm font-semibold text-destructive">
            IN A LIFE-THREATENING EMERGENCY — CALL YOUR LOCAL EMERGENCY NUMBER FIRST
          </p>
        </div>
      </div>

      {/* ── Warning Signs Accordion ──────────────────────────────────────── */}
      <details className="group rounded-xl border border-destructive/30 bg-destructive/5 dark:bg-destructive/10 overflow-hidden">
        <summary className="flex cursor-pointer items-center justify-between px-4 py-3 select-none list-none">
          <span className="flex items-center gap-2 font-semibold text-destructive text-sm">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
            When to Call Emergency Services Immediately
          </span>
          <ChevronDown className="w-4 h-4 text-destructive transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-4 pt-1 border-t border-destructive/20">
          <p className="text-xs text-muted-foreground mb-3">
            Do not wait — every second matters in these situations
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {warningSigns.map((sign, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-background/50 dark:bg-background/20">
                <span className="text-2xl">{sign.icon}</span>
                <span className="text-sm font-medium text-foreground">{sign.text}</span>
              </div>
            ))}
          </div>
        </div>
      </details>

      {/* ── Sticky Tab Bar ────────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Emergency resource sections"
        className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border border-border rounded-xl p-1 flex gap-1"
      >
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeSection === id}
            aria-controls={`panel-${id}`}
            onClick={() => setActiveSection(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium flex-1 justify-center transition-all duration-150
              ${activeSection === id
                ? "bg-destructive text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Active Section Panel ──────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          id={`panel-${activeSection}`}
          role="tabpanel"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >

      {/* ══ SECTION 1 — Emergency Numbers ════════════════════════════════════ */}
      {activeSection === "numbers" && (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Phone className="w-5 h-5 text-destructive" />
          <h2 className="text-xl font-bold text-foreground">Emergency Numbers</h2>
        </div>

        <input
          type="text"
          placeholder="🔍  Search by country or number..."
          value={searchCountry}
          onChange={(e) => setSearchCountry(e.target.value)}
          className="w-full max-w-sm px-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-destructive/40"
        />

        {/* Featured Local Hotline Card */}
        {localMatch && !searchCountry && (
          <div className="p-5 rounded-xl border border-destructive bg-destructive/5 dark:bg-destructive/10 relative overflow-hidden transition-all duration-300 shadow-md">
            <span className="absolute left-0 top-0 h-full w-1.5 bg-destructive animate-pulse" />
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive text-white uppercase tracking-wider animate-pulse mb-1">
                  <MapPin className="w-3 h-3" /> Detected Local Helpline
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{localMatch.flag}</span>
                  <h3 className="text-xl font-bold text-foreground">{localMatch.country}</h3>
                </div>
                <p className="text-xs text-muted-foreground">{localMatch.description} for your current location</p>
              </div>

              <div className="flex items-center gap-4">
                <p className="text-5xl font-black text-destructive leading-none tracking-tight">
                  {localMatch.number}
                </p>
                <div className="flex flex-col gap-1.5">
                  <a
                    href={`tel:${localMatch.callNumber}`}
                    onClick={(e) => { if (!isMobile()) e.preventDefault(); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-destructive hover:bg-destructive/90 text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call
                  </a>
                  <button
                    onClick={() => handleCopyNumber(localMatch.number, localMatch.country)}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-destructive/20 hover:bg-destructive/5 text-destructive text-xs font-semibold transition-colors"
                    title="Copy number"
                  >
                    {copiedNumber === localMatch.number
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      : <><Copy className="w-3.5 h-3.5 mr-1" /> Copy</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredNumbers.map((item, idx) => (
            <div
              key={idx}
              className="group relative rounded-xl border border-border bg-card hover:border-destructive/40 hover:shadow-md dark:hover:shadow-destructive/10 transition-all duration-200 overflow-hidden"
            >
              <span className="absolute left-0 top-0 h-full w-1 bg-destructive rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between px-4 py-4 ml-1">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{item.flag}</span>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {item.country}
                    </p>
                  </div>
                  <p className="text-4xl font-black text-destructive leading-none tracking-tight">
                    {item.number}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <a
                    href={`tel:${item.callNumber}`}
                    onClick={(e) => { if (!isMobile()) e.preventDefault(); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-semibold transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call
                  </a>
                  <button
                    onClick={() => handleCopyNumber(item.number, item.country)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title="Copy number"
                  >
                    {copiedNumber === item.number
                      ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                      : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredNumbers.length === 0 && (
            <p className="text-muted-foreground text-sm col-span-3 py-8 text-center">
              No results for "{searchCountry}"
            </p>
          )}
        </div>
      </div>
      )}

      {/* ══ SECTION 2 — First Aid ══════════════════════════════════════════════ */}
      {activeSection === "firstaid" && (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-5 h-5 text-destructive" />
          <h2 className="text-xl font-bold text-foreground">First Aid Guides</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Tap any situation for step-by-step instructions. Life-threatening situations require a call first.
        </p>

        {firstAidGuides.map((guide) => {
          const Icon = guide.icon;
          const isOpen = expandedGuide === guide.id;
          const hasCalled = calledFor.includes(guide.id);

          return (
            <div
              key={guide.id}
              className={`rounded-xl border overflow-hidden transition-all duration-200 ${guide.border}`}
            >
              {/* Guide Header */}
              <button
                onClick={() => toggleGuide(guide.id)}
                className={`w-full flex items-center justify-between px-4 py-3.5 ${guide.bg} hover:opacity-90 transition-opacity`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${guide.bg} border ${guide.border}`}>
                    <Icon className={`w-4 h-4 ${guide.color} ${isOpen && guide.animationClass}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground text-sm">{guide.title}</p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 mt-0.5 font-bold ${guide.badgeColor}`}
                    >
                      {guide.urgency}
                    </Badge>
                  </div>
                </div>
                {isOpen
                  ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              </button>

              {/* Guide Body */}
              {isOpen && (
                <div className="bg-card border-t border-border">

                  {/* LIFE THREATENING — show call screen first */}
                  {guide.isLifeThreatening && !hasCalled ? (
                    <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
                      <div className="w-16 h-16 rounded-full bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center">
                        <PhoneCall className="w-8 h-8 text-destructive animate-bounce" />
                      </div>
                      <div>
                        <p className="font-bold text-lg text-destructive">Call Emergency Services First!</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          This is a life-threatening situation. Call for help before starting first aid.
                        </p>
                      </div>
                      <a
                        href="tel:112"
                        onClick={(e) => {
                          playBeep();
                          if (!isMobile()) e.preventDefault();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold text-base transition-colors animate-pulse"
                      >
                        <Phone className="w-5 h-5" />
                        CALL 112 / 911 / 999 NOW
                      </a>
                      <button
                        onClick={() => confirmCalled(guide.id)}
                        className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                      >
                        ✓ I've already called — show me the steps
                      </button>
                    </div>
                  ) : (
                    /* Steps — timeline style */
                    <div className="px-4 py-4">
                      {/* Non-life-threatening still gets a small call reminder */}
                      {!guide.isLifeThreatening && (
                        <a
                          href="tel:112"
                          onClick={(e) => { if (!isMobile()) e.preventDefault(); }}
                          className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Call 112 / 911 if situation is severe
                        </a>
                      )}

                      <div className="relative pl-8">
                        <span className={`absolute left-3 top-2 bottom-2 w-px border-l-2 ${guide.border}`} />
                        {guide.steps.map((step, idx) => (
                          <div key={idx} className="relative mb-4 last:mb-0">
                            <div className={`absolute -left-8 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${guide.color.replace("text-", "bg-")}`}>
                              {idx + 1}
                            </div>
                            <p className="text-sm leading-relaxed text-foreground">{step}</p>
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-muted-foreground italic mt-4 pt-3 border-t border-border">
                        ⚠️ General guidance only. Always follow instructions from emergency dispatchers.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {/* ══ SECTION 3 — Crisis Hotlines ══════════════════════════════════════ */}
      {activeSection === "crisis" && (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Heart className="w-5 h-5 text-destructive" />
          <h2 className="text-xl font-bold text-foreground">Crisis & Mental Health Hotlines</h2>
        </div>
        <p className="text-sm text-muted-foreground">Free, confidential support — you are not alone.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {crisisHotlines.map((line, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all duration-200 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-snug">{line.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{line.country}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="outline" className="text-xs px-2 py-0 capitalize">
                      {line.type}
                    </Badge>
                    <span className="text-destructive font-bold text-sm">{line.contact}</span>
                    {/* availability indicator */}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className={`w-1.5 h-1.5 rounded-full ${line.available === "24/7" ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`} />
                      {line.available}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {line.callNumber ? (
                    <a
                      href={`tel:${line.callNumber}`}
                      onClick={(e) => { if (!isMobile()) e.preventDefault(); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-semibold transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call
                    </a>
                  ) : (
                    /* Text type — copy "HOME" ready to send */
                    <button
                      onClick={() => handleCopyNumber("HOME", "Crisis Text Line keyword")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy "HOME"
                    </button>
                  )}
                  <button
                    onClick={() => handleCopyNumber(line.contact, line.name)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    title="Copy number"
                  >
                    {copiedNumber === line.contact
                      ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                      : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reminders — with checkoff */}
        <div className="rounded-xl border border-dashed border-border bg-muted/30 dark:bg-muted/10 p-4 mt-2">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Important Reminders</h3>
            {checkedReminders.length > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">
                {checkedReminders.length}/{reminders.length} done
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {reminders.map((r, idx) => {
              const Icon = r.icon;
              const checked = checkedReminders.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => toggleReminder(idx)}
                  className={`flex items-start gap-3 p-2.5 rounded-lg text-left transition-all duration-150
                    ${checked
                      ? "bg-green-500/10 border border-green-500/30"
                      : "bg-background/50 border border-transparent hover:border-border"
                    }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${checked ? "text-green-500" : "text-primary"}`} />
                  <span className={`text-sm ${checked ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {r.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      )}

      {/* ══ SECTION 4 — Find Help ═════════════════════════════════════════════ */}
      {activeSection === "find" && (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-5 h-5 text-destructive" />
          <h2 className="text-xl font-bold text-foreground">Find Nearby Help</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Opens Google Maps to locate medical facilities near you.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              type: "hospital",
              label: "Hospital",
              description: "For life-threatening emergencies",
              when: "Use when: cardiac arrest, stroke, severe injury",
              url: "https://www.google.com/maps/search/hospital+near+me",
              icon: Hospital,
              color: "border-red-500/30 hover:border-red-500/60",
              iconColor: "text-red-500",
              bg: "bg-red-500/5 dark:bg-red-500/10",
            },
            {
              type: "urgentcare",
              label: "Urgent Care",
              description: "Serious but not life-threatening",
              when: "Use when: cuts, sprains, fever, infections",
              url: "https://www.google.com/maps/search/urgent+care+near+me",
              icon: Stethoscope,
              color: "border-orange-500/30 hover:border-orange-500/60",
              iconColor: "text-orange-500",
              bg: "bg-orange-500/5 dark:bg-orange-500/10",
            },
            {
              type: "pharmacy",
              label: "Pharmacy",
              description: "Medications and first aid supplies",
              when: "Use when: minor symptoms, prescription refills",
              url: "https://www.google.com/maps/search/pharmacy+near+me",
              icon: Pill,
              color: "border-blue-500/30 hover:border-blue-500/60",
              iconColor: "text-blue-500",
              bg: "bg-blue-500/5 dark:bg-blue-500/10",
            },
          ].map((item) => {
            const Icon = item.icon;
            const isLoading = hospitalLoading === item.type;
            return (
              <button
                key={item.type}
                onClick={() => openMap(item.type, item.url)}
                className={`group rounded-xl border ${item.color} ${item.bg} p-5 text-left transition-all duration-200 hover:shadow-md`}
              >
                <div className="flex items-start justify-between mb-3">
                  <Icon className={`w-7 h-7 ${item.iconColor} ${isLoading ? "animate-spin" : "group-hover:animate-bounce"}`} />
                  {isLoading
                    ? <span className="text-xs text-muted-foreground animate-pulse">Finding...</span>
                    : <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  }
                </div>
                <p className="font-bold text-foreground text-base">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                <p className="text-xs text-muted-foreground/70 mt-2 italic">{item.when}</p>
              </button>
            );
          })}
        </div>

        {/* Location tip */}
        <div className="rounded-xl border border-border bg-muted/30 dark:bg-muted/10 p-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Tip: Enable location access</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Allow your browser to access your location when Google Maps opens for the most accurate results.
            </p>
          </div>
        </div>
      </div>
      )}

        </motion.div>
      </AnimatePresence>

    </div>
  );
};

export default Emergency;
