import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Metrics from "./pages/Metrics";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Emergency from "./pages/Emergency";
import BrainGames from "./pages/BrainGames";
import HealthFacts from "./pages/HealthFacts";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Disclaimer from "./pages/Disclaimer";
import Accessibility from "./pages/Accessibility";
import HealthLibrary from "./pages/HealthLibrary";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import ScrollToTop from "@/components/ScrollToTop";
import BlogPostPage from "@/pages/BlogPostPage";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
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

export default App;
