import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthContext";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Navbar } from "@/components/layout/Navbar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { AuthCallback } from "./pages/AuthCallback";
import { ResetPassword } from "./pages/ResetPassword";
import { Dashboard } from "./pages/Dashboard";
import { ViralReels } from "./pages/ViralReels";
import { HashtagSearch } from "./pages/HashtagSearch";
import { HashtagVideos } from "./pages/HashtagVideos";
import { InstagramHashtags } from "./pages/InstagramHashtags";
import { InstagramHashtagReels } from "./pages/InstagramHashtagReels";
import { ReelResults } from "./pages/ReelResults";
import { ViralTikToks } from "./pages/ViralTikToks";
import { TikTokUserResults } from "./pages/TikTokUserResults";
import TikTokCreators from "./pages/TikTokCreators";
import TikTokCreatorResults from "./pages/TikTokCreatorResults";
import InstagramCreators from "./pages/InstagramCreators";
import InstagramCreatorResults from "./pages/InstagramCreatorResults";
import { Profile } from "./pages/Profile";
import CreatorProfile from "./pages/CreatorProfile";
import ErrorBoundary from "./components/ErrorBoundary";
import { ScriptGenerator } from "./pages/ScriptGenerator";
import { MyScripts } from "./pages/MyScripts";
import { Content } from "./pages/Content";
import ContentCalendar from "./pages/ContentCalendar";
import Billing from "./pages/Billing";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import SavedCreators from "./pages/SavedCreators";
import TestApifyAccess from "./pages/TestApifyAccess";
import SystemStatus from "./pages/SystemStatus";

const queryClient = new QueryClient();

function AppContent() {
  const location = useLocation();
  const isAuthRoute = location.pathname === "/auth" || location.pathname.startsWith("/auth/");
  const isLandingRoute = location.pathname === "/";
  const isMobile = useIsMobile();
  
  // Check if we're on the main domain (viraltify.com) vs app subdomain (app.viraltify.com)
  const isMainDomain = window.location.hostname === "viraltify.com" || 
                       window.location.hostname === "www.viraltify.com" ||
                       window.location.hostname === "localhost";
  
  // On main domain, only show landing page - redirect app routes to app subdomain
  if (isMainDomain && !isLandingRoute) {
    window.location.href = `https://app.viraltify.com${location.pathname}${location.search}`;
    return <div>Redirecting...</div>;
  }
  
  // On main domain, show only landing page without navbar
  if (isMainDomain && isLandingRoute) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  // On app subdomain, handle auth pages without navbar for clean design
  if (isAuthRoute) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  // Pricing page with navbar
  if (location.pathname === "/pricing") {
    return (
      <>
        <Navbar />
        <Routes>
          <Route path="/pricing" element={<Pricing />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </>
    );
  }
  
  // On app subdomain, redirect home to auth
  if (isLandingRoute) {
    window.location.href = "/auth";
    return <div>Redirecting...</div>;
  }

  // Mobile layout (no sidebar)
  if (isMobile) {
    return (
      <SidebarProvider>
        <div className="min-h-screen w-full">
          {/* Fixed Mobile Header */}
          <MobileHeader />
          
          {/* Main Content with proper top padding */}
          <main className="pt-16 px-4 pb-6">
            <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tiktok-creators" element={<TikTokCreators />} />
            <Route path="/tiktok-creators/:searchId" element={<TikTokCreatorResults />} />
            <Route path="/instagram-creators" element={<InstagramCreators />} />
            <Route path="/instagram-creators/:searchId" element={<InstagramCreatorResults />} />
            <Route path="/viral-reels" element={<ViralReels />} />
            <Route path="/viral-tiktoks" element={<ViralTikToks />} />
            <Route path="/tiktoks/:username" element={<TikTokUserResults />} />
            <Route path="/hashtag-search" element={<HashtagSearch />} />
            <Route path="/hashtags/:hashtagId/videos" element={<HashtagVideos />} />
            <Route path="/instagram-hashtags" element={<InstagramHashtags />} />
            <Route path="/instagram/hashtags/:hashtagId/reels" element={<InstagramHashtagReels />} />
            <Route path="/reels/:username" element={<ReelResults />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/creator-profile" element={
              <ErrorBoundary>
                <CreatorProfile />
              </ErrorBoundary>
            } />
            <Route path="/script-generator" element={<ScriptGenerator />} />
            <Route path="/my-scripts" element={<MyScripts />} />
            <Route path="/content" element={<Content />} />
            <Route path="/saved-creators" element={<SavedCreators />} />
            <Route path="/content-calendar" element={<ContentCalendar />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/test-apify-access" element={<TestApifyAccess />} />
            <Route path="/system-status" element={<SystemStatus />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </SidebarProvider>
    );
  }

  // Desktop layout with sidebar
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <SidebarInset className="flex-1">
          <header className="sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="ml-auto flex items-center space-x-4">
              {/* Additional header content can go here */}
            </div>
          </header>
          
          <main className="flex-1 p-6">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tiktok-creators" element={<TikTokCreators />} />
              <Route path="/tiktok-creators/:searchId" element={<TikTokCreatorResults />} />
              <Route path="/instagram-creators" element={<InstagramCreators />} />
              <Route path="/instagram-creators/:searchId" element={<InstagramCreatorResults />} />
              <Route path="/viral-reels" element={<ViralReels />} />
              <Route path="/viral-tiktoks" element={<ViralTikToks />} />
              <Route path="/tiktoks/:username" element={<TikTokUserResults />} />
              <Route path="/hashtag-search" element={<HashtagSearch />} />
              <Route path="/hashtags/:hashtagId/videos" element={<HashtagVideos />} />
              <Route path="/instagram-hashtags" element={<InstagramHashtags />} />
              <Route path="/instagram/hashtags/:hashtagId/reels" element={<InstagramHashtagReels />} />
              <Route path="/reels/:username" element={<ReelResults />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/creator-profile" element={
                <ErrorBoundary>
                  <CreatorProfile />
                </ErrorBoundary>
              } />
              <Route path="/script-generator" element={<ScriptGenerator />} />
              <Route path="/my-scripts" element={<MyScripts />} />
              <Route path="/content" element={<Content />} />
              <Route path="/saved-creators" element={<SavedCreators />} />
              <Route path="/content-calendar" element={<ContentCalendar />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/test-apify-access" element={<TestApifyAccess />} />
              <Route path="/system-status" element={<SystemStatus />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;