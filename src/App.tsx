import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import {
  initializeEncryption,
  whenEncryptionReady,
  encryptProfileField,
  encryptProfileArray,
} from "@/lib/encryption";

import { supabase } from "@/integrations/supabase/client";
import { syncOfflineData } from "@/lib/offline-db";
import Index from "./pages/Home/Index.tsx";
import Auth from "./pages/Auth/index.tsx";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Metrics from "./pages/Metrics";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Emergency from "./pages/Health/Emergency.tsx";
import BrainGames from "./pages/Games/BrainGames.tsx";
import HealthFacts from "./pages/Health/HealthFacts.tsx";
import Settings from "./pages/User/Settings.tsx";
import NotFound from "./pages/NotFound/index.tsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.tsx";
import Layout from "./components/layout/Layout.tsx";
import AIHealthAssistant from "./pages/Health/AIHealthAssistant.tsx";

import Privacy from "./pages/Legal/Privacy.tsx";
import Terms from "./pages/Legal/Terms.tsx";
import Disclaimer from "./pages/Legal/Disclaimer.tsx";
import Accessibility from "./pages/Legal/Accessibility.tsx";
import HealthLibrary from "./pages/Health/HealthLibrary.tsx";
import Blog from "./pages/Blog/index.tsx";
import Contact from "./pages/Contact/index.tsx";
import ScrollToTop from "@/components/navigation/ScrollToTop.tsx";
import BlogPostPage from "@/pages/Blog/BlogPostPage.tsx";
import ResetPassword from "./pages/User/ResetPassword.tsx";
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
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
