import { Link, Redirect, Route, Switch, useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Award,
  BarChart3,
  FileText,
  IdCard,
  Image,
  KeyRound,
  Mail,
  Megaphone,
  Settings as SettingsIcon,
  type LucideIcon,
  UserRound,
  UserCheck,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import ProfilePage from "@/pages/profile";
import { YourPostsPage } from "@/pages/your-posts";
import { AccountDashboardPage } from "@/pages/account-dashboard";
import { UpdatePasswordPage } from "@/pages/update-password";
import { IdCardPage } from "@/pages/id-card";
import { ManageVolunteersPage } from "@/pages/manage-volunteers";
import {
  ManageMembersPage,
  ManageMemberAccountsPage,
} from "@/pages/manage-members";
import { CampaignAdministrationPage } from "@/pages/campaign-administration";
import { CreateCampaignPage } from "@/pages/create-campaign";
import { ManageExistingCampaignsPage } from "@/pages/manage-existing-campaigns";
import { ManageProjectsPage } from "@/pages/manage-projects";
import { MessagesPage } from "@/pages/messages";
import { ManageBadgesPage } from "@/pages/manage-badges";

const adminRoles = ["super_admin", "admin"] as const;

const memberSettingsLinks = [
  { href: "/settings/profile", label: "Edit profile", icon: UserRound },
  { href: "/settings/posts", label: "Your posts", icon: FileText },
  { href: "/settings/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/settings/id-card", label: "ID card", icon: IdCard },
  { href: "/settings/password", label: "Update password", icon: KeyRound },
];

type SettingsLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  unreadCount?: number;
};

export function SettingsPage() {
  const { accessToken, user } = useAuth();
  const [location] = useLocation();
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadVolunteerCount, setUnreadVolunteerCount] = useState(0);

  if (!user) return <Redirect to="/login" />;
  const isAdmin = adminRoles.includes(user.role as (typeof adminRoles)[number]);
  const isSuperUser = user.role === "super_admin";
  const isSettingsHome = location === "/settings";
  const isAccountListPage =
    location === "/settings/members/members" ||
    location === "/settings/members/admins";
  const isAdminContentPage =
    location === "/settings/campaigns/create" ||
    location === "/settings/campaigns/manage" ||
    location === "/settings/projects/manage";
  const backHref = isAdminContentPage
    ? "/settings/campaigns"
    : isAccountListPage
      ? "/settings/members"
      : "/settings";

  useEffect(() => {
    if (!isAdmin || !accessToken) return;

    let cancelled = false;
    async function loadUnreadMessageCount() {
      const response = await fetch(
        `${import.meta.env.BASE_URL?.replace(/\/$/, "") ?? ""}/api/contact/messages/unread-count`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!response.ok || cancelled) return;
      const body = (await response.json()) as { count?: number };
      if (typeof body.count === "number") setUnreadMessageCount(body.count);
    }

    async function loadUnreadVolunteerCount() {
      const response = await fetch(
        `${import.meta.env.BASE_URL?.replace(/\/$/, "") ?? ""}/api/volunteer-applications/unread-count`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!response.ok || cancelled) return;
      const body = (await response.json()) as { count?: number };
      if (typeof body.count === "number") setUnreadVolunteerCount(body.count);
    }

    function handleMessagesRead() {
      setUnreadMessageCount(0);
    }
    function handleVolunteerApplicationsRead() {
      setUnreadVolunteerCount(0);
    }

    void loadUnreadMessageCount();
    void loadUnreadVolunteerCount();
    const interval = window.setInterval(
      () => void loadUnreadMessageCount(),
      30_000,
    );
    window.addEventListener("contact-messages-read", handleMessagesRead);
    window.addEventListener(
      "volunteer-applications-read",
      handleVolunteerApplicationsRead,
    );
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("contact-messages-read", handleMessagesRead);
      window.removeEventListener(
        "volunteer-applications-read",
        handleVolunteerApplicationsRead,
      );
    };
  }, [accessToken, isAdmin]);

  const settingsLinks: SettingsLink[] = isAdmin
    ? [
        ...memberSettingsLinks,
        {
          href: "/settings/volunteers",
          label: "Manage volunteer",
          icon: UserCheck,
          unreadCount: unreadVolunteerCount,
        },
        {
          href: "/settings/campaigns",
          label: "Manage campaigns",
          icon: Megaphone,
        },
        {
          href: "/settings/projects/manage",
          label: "Manage projects",
          icon: Image,
        },
        {
          href: "/settings/messages",
          label: "Messages",
          icon: Mail,
          unreadCount: unreadMessageCount,
        },
        {
          href: "/settings/members",
          label: isSuperUser ? "Manage accounts" : "Manage members",
          icon: Users,
        },
        ...(isSuperUser
          ? [{ href: "/settings/badges", label: "Custom badges", icon: Award }]
          : []),
      ]
    : memberSettingsLinks;

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-orange-50/70 via-background to-amber-50/50 px-4 py-7 sm:py-9">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="min-w-0">
            <div
              className={`mb-6 items-center gap-3 ${isSettingsHome ? "flex" : "hidden lg:flex"}`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <SettingsIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-primary">
                  My account
                </p>
                <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
                  Settings
                </h1>
              </div>
            </div>
            <nav
              aria-label="Settings"
              className={`${isSettingsHome ? "block" : "hidden"} h-fit rounded-2xl border bg-card p-2 shadow-sm lg:block`}
            >
              {settingsLinks.map(({ href, label, icon: Icon, unreadCount }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                    location === href ||
                    (href === "/settings/members" &&
                      location.startsWith("/settings/members/"))
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-primary/5 hover:text-primary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {unreadCount ? (
                    <span
                      aria-label={`${unreadCount} unread ${label.toLowerCase()}`}
                      className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[11px] font-bold leading-none text-destructive-foreground"
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : null}
                </Link>
              ))}
            </nav>
          </div>
          <div
            className={`${isSettingsHome ? "hidden lg:block" : "block"} min-w-0 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:pr-2`}
          >
            {!isSettingsHome && (
              <Link
                href={backHref}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-x-0.5 hover:bg-primary/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:hidden"
              >
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                <span>Back to settings</span>
              </Link>
            )}
            <Switch>
              <Route
                path="/settings/dashboard"
                component={AccountDashboardPage}
              />
              <Route path="/settings/posts" component={YourPostsPage} />
              <Route path="/settings/password" component={UpdatePasswordPage} />
              <Route path="/settings/id-card" component={IdCardPage} />
              <Route path="/settings/profile" component={ProfilePage} />
              <Route
                path="/settings/volunteers"
                component={() =>
                  isAdmin ? (
                    <ManageVolunteersPage />
                  ) : (
                    <Redirect to="/settings" />
                  )
                }
              />
              <Route
                path="/settings/campaigns/create"
                component={() =>
                  isAdmin ? <CreateCampaignPage /> : <Redirect to="/settings" />
                }
              />
              <Route
                path="/settings/campaigns/manage"
                component={() =>
                  isAdmin ? (
                    <ManageExistingCampaignsPage />
                  ) : (
                    <Redirect to="/settings" />
                  )
                }
              />
              <Route
                path="/settings/campaigns"
                component={() =>
                  isAdmin ? (
                    <CampaignAdministrationPage />
                  ) : (
                    <Redirect to="/settings" />
                  )
                }
              />
              <Route
                path="/settings/projects/manage"
                component={() =>
                  isAdmin ? <ManageProjectsPage /> : <Redirect to="/settings" />
                }
              />
              <Route
                path="/settings/messages"
                component={() =>
                  isAdmin ? <MessagesPage /> : <Redirect to="/settings" />
                }
              />
              <Route
                path="/settings/members/members"
                component={() =>
                  isAdmin ? (
                    <ManageMemberAccountsPage accountType="members" />
                  ) : (
                    <Redirect to="/settings" />
                  )
                }
              />
              <Route
                path="/settings/members/admins"
                component={() =>
                  isSuperUser ? (
                    <ManageMemberAccountsPage accountType="admins" />
                  ) : (
                    <Redirect to="/settings/members" />
                  )
                }
              />
              <Route
                path="/settings/members"
                component={() =>
                  isAdmin ? <ManageMembersPage /> : <Redirect to="/settings" />
                }
              />
              <Route
                path="/settings/badges"
                component={() =>
                  isSuperUser ? (
                    <ManageBadgesPage />
                  ) : (
                    <Redirect to="/settings" />
                  )
                }
              />
              <Route component={ProfilePage} />
            </Switch>
          </div>
        </div>
      </div>
    </div>
  );
}
