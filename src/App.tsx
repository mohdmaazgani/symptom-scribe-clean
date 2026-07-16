import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import {
  initializeEncryption,
  whenEncryptionReady,
  encryptProfileField,
  encryptProfileArray,
} from "@/lib/encryption";

import { supabase } from "@/integrations/supabase/client";
import { syncOfflineData } from "@/lib/offline-db";
import ProtectedRoute from "./components/auth/ProtectedRoute.tsx";
import Layout from "./components/layout/Layout.tsx";
import ScrollToTop from "@/components/navigation/ScrollToTop.tsx";

// Lazy-loaded pages
const Index = lazy(() => import("./pages/Home/Index.tsx"));
const Auth = lazy(() => import("./pages/Auth/index.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Chat = lazy(() => import("./pages/Chat"));
const Metrics = lazy(() => import("./pages/Metrics"));
const History = lazy(() => import("./pages/History"));
const Profile = lazy(() => import("./pages/Profile"));
const Emergency = lazy(() => import("./pages/Health/Emergency.tsx"));
const BrainGames = lazy(() => import("./pages/Games/BrainGames.tsx"));
const HealthFacts = lazy(() => import("./pages/Health/HealthFacts.tsx"));
const Settings = lazy(() => import("./pages/User/Settings.tsx"));
const NotFound = lazy(() => import("./pages/NotFound/index.tsx"));
const AIHealthAssistant = lazy(() => import("./pages/Health/AIHealthAssistant.tsx"));
const Privacy = lazy(() => import("./pages/Legal/Privacy.tsx"));
const Terms = lazy(() => import("./pages/Legal/Terms.tsx"));
const Disclaimer = lazy(() => import("./pages/Legal/Disclaimer.tsx"));
const Accessibility = lazy(() => import("./pages/Legal/Accessibility.tsx"));
const HealthLibrary = lazy(() => import("./pages/Health/HealthLibrary.tsx"));
const Blog = lazy(() => import("./pages/Blog/index.tsx"));
const Contact = lazy(() => import("./pages/Contact/index.tsx"));
const BlogPostPage = lazy(() => import("@/pages/Blog/BlogPostPage.tsx"));
const ResetPassword = lazy(() => import("./pages/User/ResetPassword.tsx"));
const GamificationPage = lazy(() => import("@/pages/Gamification"));

// Loading spinner fallback component
const LoadingScreen = () => (
  <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
    <img
      src="/brand/icon-dark.svg"
      alt="Symptom Scribe"
      className="h-14 w-14 object-contain mb-4"
    />
    <div className="relative flex items-center justify-center">
      <div className="absolute h-16 w-16 animate-ping rounded-full border-2 border-cyan-500/20 opacity-75"></div>
      <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-r-2 border-cyan-500 border-r-transparent"></div>
    </div>
    <span className="mt-4 text-sm font-medium tracking-widest text-cyan-400/80 animate-pulse uppercase">
      Symptom Scribe
    </span>
  </div>
);

const queryClient = new QueryClient();
const App = () => {
  useEffect(() => {
    const cleanup = initializeEncryption();


    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
          if (navigator.onLine) {
            await syncOfflineData().catch((err) =>
              console.error("Failed to sync offline data on session ready:", err)
            );

            // Handle pending profile details (from MultiStepSignUp)
            const pendingProfileStr = localStorage.getItem("symptom_scribe_pending_profile");
            if (pendingProfileStr) {
              try {
                const pendingProfile = JSON.parse(pendingProfileStr);
                const key = await whenEncryptionReady();
                const encryptedFullName = await encryptProfileField(pendingProfile.full_name, key);
                const encryptedDob = await encryptProfileField(pendingProfile.date_of_birth, key);
                const encryptedEmergencyName = await encryptProfileField(pendingProfile.emergency_contact_name, key);
                const encryptedEmergencyPhone = await encryptProfileField(pendingProfile.emergency_contact_phone, key);
                const encryptedAllergies = await encryptProfileArray(pendingProfile.allergies, key);
                const encryptedChronicConditions = await encryptProfileArray(pendingProfile.chronic_conditions, key);

                const { error } = await supabase
                  .from("profiles")
                  .upsert({
                    user_id: session.user.id,
                    full_name: encryptedFullName,
                    date_of_birth: encryptedDob,
                    gender: pendingProfile.gender || null,
                    blood_type: pendingProfile.blood_type || null,
                    allergies: encryptedAllergies,
                    chronic_conditions: encryptedChronicConditions,
                    emergency_contact_name: encryptedEmergencyName,
                    emergency_contact_phone: encryptedEmergencyPhone,
                    updated_at: new Date().toISOString(),
                  }, { onConflict: "user_id" });

                if (error) {
                  console.error("Failed to sync pending profile details:", error);
                } else {
                  localStorage.removeItem("symptom_scribe_pending_profile");
                  console.log("Successfully encrypted and synced pending profile details");
                }
              } catch (err) {
                console.error("Failed parsing or encrypting pending profile:", err);
              }
            }
          }
        }
      }
    );


    return () => {
      cleanup?.();
      subscription.unsubscribe();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Chat />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/metrics"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Metrics />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <History />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Profile />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/emergency"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Emergency />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/brain-games"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <BrainGames />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/health-facts"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <HealthFacts />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Settings />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai-health-assistant"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <AIHealthAssistant />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gamification"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <GamificationPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/privacy"
                element={
                  <Privacy />
                }
              />
              <Route
                path="/terms"
                element={
                  <Terms />
                }
              />
              <Route
                path="/disclaimer"
                element={
                  <Disclaimer />
                }
              />
              <Route
                path="/accessibility"
                element={
                  <Accessibility />
                }
              />
              <Route path="/health-library" element={<HealthLibrary />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
