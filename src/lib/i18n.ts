import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      hero: {
        badge: "AI-Powered Health Analysis",
        headingLine1: "Smart Health",
        headingLine2: "Tracker",
        subtitle:
          "Describe your symptoms and get instant AI-powered insights on possible causes, severity levels, and self-care recommendations.",
        getStarted: "Get Started Free",
        signIn: "Sign In",
        toastWelcomeTitle: "Welcome to Smart Health Tracker",
        toastWelcomeDesc: "Sign in to start tracking your health",
        toastBackTitle: "Welcome back!",
        toastBackDesc: "Please sign in to continue",
        pillSecureTitle: "Private & Secure",
        pillSecureDesc: "Your health data stays confidential",
        pillInstantTitle: "Instant Analysis",
        pillInstantDesc: "Get insights in seconds",
        pillEvidenceTitle: "Evidence-Based",
        pillEvidenceDesc: "Powered by medical knowledge",
      },
      settings: {
        language: "Language",
        languageDescription: "Choose your preferred language for the app interface",
      },
    },
  },
  hi: {
    translation: {
      hero: {
        badge: "एआई-संचालित स्वास्थ्य विश्लेषण",
        headingLine1: "स्मार्ट हेल्थ",
        headingLine2: "ट्रैकर",
        subtitle:
          "अपने लक्षण बताएं और संभावित कारणों, गंभीरता के स्तर और स्व-देखभाल सुझावों पर तुरंत एआई-संचालित जानकारी प्राप्त करें।",
        getStarted: "मुफ़्त में शुरू करें",
        signIn: "साइन इन करें",
        toastWelcomeTitle: "स्मार्ट हेल्थ ट्रैकर में आपका स्वागत है",
        toastWelcomeDesc: "अपनी सेहत को ट्रैक करना शुरू करने के लिए साइन इन करें",
        toastBackTitle: "वापसी पर स्वागत है!",
        toastBackDesc: "जारी रखने के लिए कृपया साइन इन करें",
        pillSecureTitle: "निजी और सुरक्षित",
        pillSecureDesc: "आपका स्वास्थ्य डेटा गोपनीय रहता है",
        pillInstantTitle: "तुरंत विश्लेषण",
        pillInstantDesc: "सेकंडों में जानकारी पाएं",
        pillEvidenceTitle: "प्रमाण-आधारित",
        pillEvidenceDesc: "चिकित्सा ज्ञान द्वारा संचालित",
      },
      settings: {
        language: "भाषा",
        languageDescription: "ऐप इंटरफ़ेस के लिए अपनी पसंदीदा भाषा चुनें",
      },
    },
  },
  te: {
    translation: {
      hero: {
        badge: "AI-ఆధారిత ఆరోగ్య విశ్లేషణ",
        headingLine1: "స్మార్ట్ హెల్త్",
        headingLine2: "ట్రాకర్",
        subtitle:
          "మీ లక్షణాలను వివరించండి మరియు సాధ్యమయ్యే కారణాలు, తీవ్రత స్థాయిలు మరియు స్వీయ-సంరక్షణ సిఫార్సులపై తక్షణ AI-ఆధారిత సమాచారం పొందండి.",
        getStarted: "ఉచితంగా ప్రారంభించండి",
        signIn: "సైన్ ఇన్ చేయండి",
        toastWelcomeTitle: "స్మార్ట్ హెల్త్ ట్రాకర్‌కు స్వాగతం",
        toastWelcomeDesc: "మీ ఆరోగ్యాన్ని ట్రాక్ చేయడం ప్రారంభించడానికి సైన్ ఇన్ చేయండి",
        toastBackTitle: "తిరిగి స్వాగతం!",
        toastBackDesc: "కొనసాగించడానికి దయచేసి సైన్ ఇన్ చేయండి",
        pillSecureTitle: "ప్రైవేట్ & సురక్షితం",
        pillSecureDesc: "మీ ఆరోగ్య డేటా గోప్యంగా ఉంటుంది",
        pillInstantTitle: "తక్షణ విశ్లేషణ",
        pillInstantDesc: "సెకన్లలో అంతర్దృష్టులు పొందండి",
        pillEvidenceTitle: "ఆధార-ఆధారిత",
        pillEvidenceDesc: "వైద్య పరిజ్ఞానంతో నడుస్తుంది",
      },
      settings: {
        language: "భాష",
        languageDescription: "యాప్ ఇంటర్‌ఫేస్ కోసం మీకు నచ్చిన భాషను ఎంచుకోండి",
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("app-language") || "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;