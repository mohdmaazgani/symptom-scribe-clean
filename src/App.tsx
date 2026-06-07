import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import ScrollToTop from "@/components/ScrollToTop";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Chat = lazy(() => import("./pages/Chat"));
const Metrics = lazy(() => import("./pages/Metrics"));
const History = lazy(() => import("./pages/History"));
const Profile = lazy(() => import("./pages/Profile"));
const Emergency = lazy(() => import("./pages/Emergency"));
const BrainGames = lazy(() => import("./pages/BrainGames"));
const HealthFacts = lazy(() => import("./pages/HealthFacts"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AIHealthAssistant = lazy(() => import("./pages/AIHealthAssistant"));

const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));
const Accessibility = lazy(() => import("./pages/Accessibility"));
const HealthLibrary = lazy(() => import("./pages/HealthLibrary"));
const Blog = lazy(() => import("./pages/Blog"));
const Contact = lazy(() => import("./pages/Contact"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />

<Suspense fallback={<div>Loading...</div>}>
  <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
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
</Suspense>
</BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
