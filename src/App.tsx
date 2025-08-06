import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthContext";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Navbar } from "@/components/layout/Navbar";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { Dashboard } from "./pages/Dashboard";
import { ViralReels } from "./pages/ViralReels";
import { ReelResults } from "./pages/ReelResults";
import { Profile } from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const location = useLocation();
  const isAuthRoute = location.pathname === "/auth";
  const isLandingRoute = location.pathname === "/";

  // Show navbar for landing and auth pages, sidebar for authenticated pages
  if (isLandingRoute || isAuthRoute) {
    return (
      <>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </>
    );
  }

  // Use sidebar layout for all other pages
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
              <Route path="/viral-reels" element={<ViralReels />} />
              <Route path="/reels/:username" element={<ReelResults />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/script-generator" element={<NotFound />} />
              <Route path="/my-scripts" element={<NotFound />} />
              <Route path="/instagram-data" element={<NotFound />} />
              <Route path="/analytics" element={<NotFound />} />
              <Route path="/settings" element={<NotFound />} />
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
