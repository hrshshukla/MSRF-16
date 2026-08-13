import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Route, Switch, Router as WouterRouter, useLocation } from "wouter";
import { ShieldAlert } from "lucide-react";
import { useEffect } from "react";

// Auth
import { AuthProvider } from "@/lib/auth-context";

// Components
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

// Pages — public
import { Home } from "@/pages/home";
import { AboutPage } from "@/pages/about";
import { SevaPage } from "@/pages/seva";
import { CampaignDetail } from "@/pages/campaign-detail";
import { SevaDonationDetail } from "@/pages/seva-donation-detail";
import { EventDetail } from "@/pages/event-detail";
import { ProjectDetail } from "@/pages/project-detail";
import { BlogPage } from "@/pages/blog";
import { PostDetail } from "@/pages/post-detail";
import { GalleryPage } from "@/pages/gallery";
import { MembersPage } from "@/pages/members";
import { ContactPage } from "@/pages/contact";
import { JoinPage } from "@/pages/join";
import { PublicMemberProfilePage } from "@/pages/public-member-profile";
import { SharedPostPage } from "@/pages/shared-post";
import NotFound from "@/pages/not-found";

// Pages — auth (full-screen, no Navbar/Footer)
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import ForgotPasswordPage from "@/pages/forgot-password";
import { SettingsPage } from "@/pages/settings";
import { ProtectedRoute } from "@/components/protected-route";
import { LanguageProvider } from "@/lib/language-context";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* ── Auth pages — standalone layout ── */}
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />

      {/* ── Blog feed — no footer ── */}
      <Route path="/blog">
        <div className="flex flex-col h-[100dvh] overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-hidden">
            <BlogPage />
          </main>
        </div>
      </Route>

      {/* ── Public member profiles — no footer ── */}
      <Route path="/members/:id">
        <div className="flex min-h-[100dvh] flex-col">
          <Navbar />
          <main className="flex-1">
            <PublicMemberProfilePage />
          </main>
        </div>
      </Route>

      {/* ── Shared community post permalink ── */}
      <Route path="/posts/:id">
        <div className="flex min-h-[100dvh] flex-col">
          <Navbar />
          <main className="flex-1">
            <SharedPostPage />
          </main>
        </div>
      </Route>

      {/* ── Public pages — shared Navbar + Footer ── */}
      <Route>
        {() => (
          <div className="flex flex-col min-h-[100dvh]">
            <Navbar />
            <main className="flex-1">
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/about" component={AboutPage} />
                <Route path="/seva" component={SevaPage} />
                <Route path="/campaigns/:id" component={CampaignDetail} />
                <Route path="/seva-campaigns/:id" component={SevaDonationDetail} />
                <Route path="/donations/:id" component={SevaDonationDetail} />
                <Route path="/events/:id" component={EventDetail} />
                <Route path="/projects/:id" component={ProjectDetail} />
                <Route path="/blog/:slug" component={PostDetail} />
                <Route path="/gallery" component={GalleryPage} />
                <Route path="/members" component={MembersPage} />
                <Route path="/contact" component={ContactPage} />
                <Route path="/join" component={JoinPage} />
                <Route
                  path="/settings"
                  component={() => (
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/settings/profile"
                  component={() => (
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/settings/members/members"
                  component={() => (
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/settings/campaigns/create"
                  component={() => (
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/settings/campaigns/manage"
                  component={() => (
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/settings/campaigns"
                  component={() => (
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/settings/projects/manage"
                  component={() => (
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/settings/messages"
                  component={() => (
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/settings/members/admins"
                  component={() => (
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/settings/:rest*"
                  component={() => (
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/profile"
                  component={() => (
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/unauthorized"
                  component={() => (
                    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
                      <ShieldAlert className="w-16 h-16 text-destructive" />
                      <h1 className="text-2xl font-bold text-gray-900">
                        Access Denied
                      </h1>
                      <p className="text-gray-500 max-w-sm">
                        You don't have permission to view this page. Contact
                        your administrator if you believe this is an error.
                      </p>
                      <a
                        href="/"
                        className="rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition"
                      >
                        Go Home
                      </a>
                    </div>
                  )}
                />
                <Route component={NotFound} />
              </Switch>
            </main>
            <Footer />
          </div>
        )}
      </Route>
    </Switch>
  );
}

function ScrollToTopOnRouteChange() {
  const [location] = useLocation();
  const pathname = location.split("#")[0];

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <ScrollToTopOnRouteChange />
            <Router />
          </WouterRouter>
        </LanguageProvider>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
