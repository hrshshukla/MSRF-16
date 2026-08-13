import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  Home as HomeIcon,
  LogIn,
  UserPlus,
  Settings,
  LogOut,
  SquarePen,
  HandHeart,
  Mail,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { UserAvatar } from "@/components/user-avatar";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSelector } from "@/components/language-selector";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const directLinks: NavItem[] = [
  { href: "/members", label: "Members", icon: Users },
  { href: "/contact", label: "Contact", icon: Mail },
];

const mobileNavLinks: NavItem[] = [
  { href: "/seva", label: "Seva", icon: HandHeart },
  ...directLinks,
];

const LAST_NAV_INDEX_KEY = "mahakal-last-nav-index";

function getStoredNavIndex() {
  if (typeof window === "undefined") return 0;
  const storedIndex = Number(window.sessionStorage.getItem(LAST_NAV_INDEX_KEY));
  return Number.isInteger(storedIndex) && storedIndex >= 0 && storedIndex < 5 ? storedIndex : 0;
}

function storeNavIndex(index: number) {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(LAST_NAV_INDEX_KEY, String(index));
  }
}

function ThemeToggle({
  theme,
  onToggle,
  mobile = false,
}: {
  theme: "light" | "dark";
  onToggle: () => void;
  mobile?: boolean;
}) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
      data-testid={mobile ? "btn-mobile-theme-toggle" : "btn-theme-toggle"}
      className={`relative flex ${mobile ? "h-8 w-[70px]" : "h-10 w-[78px]"} shrink-0 items-center justify-between overflow-hidden rounded-full border-0 p-1 shadow-inner transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        isDark ? "bg-[#414967]" : "bg-[#dfe2eb]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`relative z-0 flex h-6 w-6 items-center justify-center transition-colors ${
          isDark ? "text-[#aeb5cc]" : "text-[#f59e0b]"
        }`}
      >
        <Sun size={19} strokeWidth={2.5} />
      </span>
      <span
        aria-hidden="true"
        className={`relative z-0 flex h-6 w-6 items-center justify-center transition-colors ${
          isDark ? "text-[#aeb5cc]" : "text-[#9da3b4]"
        }`}
      >
        <Moon size={19} strokeWidth={2.5} />
      </span>
      <span
        aria-hidden="true"
        className={`absolute left-0.5 top-1/2 z-10 flex ${mobile ? "h-7 w-7" : "h-9 w-9"} -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_3px_8px_rgba(32,42,70,0.24)] transition-transform duration-300 ease-out ${
          isDark ? (mobile ? "translate-x-[37px]" : "translate-x-[35px]") : "translate-x-0"
        }`}
      >
        {isDark ? (
          <Moon size={22} strokeWidth={2.4} className="text-[#4662bd]" />
        ) : (
          <Sun size={22} strokeWidth={2.4} className="text-[#f59e0b]" />
        )}
      </span>
    </button>
  );
}

function PageSwitcher({ location }: { location: string }) {
  const isHome = location === "/";

  const target = isHome
    ? {
        href: "/blog",
        label: "Post",
        ariaLabel: "View all posts",
        icon: <SquarePen size={16} strokeWidth={2.2} />,
      }
    : {
        href: "/",
        label: "Home",
        ariaLabel: "Go to home",
        icon: <HomeIcon size={16} strokeWidth={2.2} />,
      };

  return (
    <Link
      href={target.href}
      aria-label={target.ariaLabel}
      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-2.5 sm:px-3.5 font-sans text-xs font-semibold tracking-[0.1em] text-primary-foreground shadow-[0_4px_12px_rgba(190,83,20,0.22)] transition-colors hover:bg-primary/90 lg:hidden"
    >
      {target.icon}
      {target.label}
    </Link>
  );
}

function DesktopNavigationPill({ location }: { location: string }) {
  const pathname = location.split(/[?#]/)[0] ?? location;
  const activeDirectLinkIndex = directLinks.findIndex((link) => pathname === link.href);
  const routeIndex =
    pathname === "/"
      ? 0
      : pathname === "/blog"
        ? 1
        : pathname === "/seva"
          ? 2
          : activeDirectLinkIndex >= 0
            ? activeDirectLinkIndex + 3
            : -1;
  const [selectedIndex, setSelectedIndex] = useState(getStoredNavIndex);
  const activeIndex = routeIndex >= 0 ? routeIndex : selectedIndex;

  useEffect(() => {
    if (routeIndex >= 0) {
      setSelectedIndex(routeIndex);
      storeNavIndex(routeIndex);
    }
  }, [routeIndex]);

  return (
    <div className="absolute left-1/2 hidden w-[min(52vw,620px)] min-w-[520px] -translate-x-1/2 items-center gap-0 rounded-full border border-primary/25 bg-foreground/5 p-1.5 backdrop-blur-md lg:flex">
      {activeIndex >= 0 && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-1.5 left-1.5 rounded-full bg-primary shadow-[0_4px_12px_rgba(190,83,20,0.22)] transition-transform duration-300 ease-out"
          style={{
            width: "calc((100% - 12px) / 5)",
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
      )}
      <Link
        href="/"
        aria-label="Go to home"
        aria-current={pathname === "/" ? "page" : undefined}
        onClick={() => {
          setSelectedIndex(0);
          storeNavIndex(0);
        }}
        className={`relative z-10 flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-2 text-xs font-semibold transition-colors ${
          activeIndex === 0 ? "text-primary-foreground" : "text-foreground/80 hover:text-primary"
        }`}
      >
        {activeIndex === 0 && <HomeIcon size={15} strokeWidth={2.2} aria-hidden="true" />}
        Home
      </Link>
      <Link
        href="/blog"
        aria-label="View all posts"
        aria-current={pathname === "/blog" ? "page" : undefined}
        onClick={() => {
          setSelectedIndex(1);
          storeNavIndex(1);
        }}
        className={`relative z-10 flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-2 text-xs font-semibold transition-colors ${
          activeIndex === 1 ? "text-primary-foreground" : "text-foreground/80 hover:text-primary"
        }`}
      >
        {activeIndex === 1 && <SquarePen size={15} strokeWidth={2.2} aria-hidden="true" />}
        Post
      </Link>
      <Link
        href="/seva"
        aria-label="View seva campaigns, projects, and events"
        aria-current={pathname === "/seva" ? "page" : undefined}
        onClick={() => {
          setSelectedIndex(2);
          storeNavIndex(2);
        }}
        className={`relative z-10 flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-2 text-xs font-semibold transition-colors ${
          activeIndex === 2 ? "text-primary-foreground" : "text-foreground/80 hover:text-primary"
        }`}
      >
        {activeIndex === 2 && <HandHeart size={15} strokeWidth={2.2} aria-hidden="true" />}
        Seva
      </Link>
      {directLinks.map((link, index) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => {
            setSelectedIndex(index + 3);
            storeNavIndex(index + 3);
          }}
          className={`relative z-10 flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-2 text-xs font-semibold transition-colors ${
            activeIndex === index + 3
              ? "text-primary-foreground hover:text-primary-foreground"
              : "text-foreground/80 hover:text-primary"
          }`}
        >
          {activeIndex === index + 3 && <link.icon size={15} strokeWidth={2.2} aria-hidden="true" />}
          {link.label}
        </Link>
      ))}
    </div>
  );
}

function ProfileMenu({
  mobile = false,
  includeLogout = true,
  theme,
  onToggleTheme,
}: {
  mobile?: boolean;
  includeLogout?: boolean;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!user) return null;

  async function handleLogout() {
    setOpen(false);
    await logout();
  }

  const accountLabel =
    user.role === "super_admin"
      ? "Super user"
      : user.role === "admin"
        ? "Admin"
        : user.role === "volunteer"
          ? "Volunteer"
          : "Member";
  const displayLabel = user.customBadge || accountLabel;

  if (mobile) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-xl bg-primary/5 px-3 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <UserAvatar
              name={user.name}
              imageUrl={user.profileImageUrl}
              className="h-10 w-10 bg-primary text-sm font-bold text-primary-foreground"
              imageClassName="h-full w-full"
              fallbackClassName="bg-primary text-primary-foreground"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
              <p className="truncate text-xs capitalize text-muted-foreground">{displayLabel}</p>
            </div>
          </div>
          {theme && onToggleTheme && (
            <ThemeToggle theme={theme} onToggle={onToggleTheme} mobile />
          )}
        </div>
        {includeLogout && (
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut size={16} />
            Log out
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open profile menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <UserAvatar
          name={user.name}
          imageUrl={user.profileImageUrl}
          className="h-9 w-9 bg-primary text-xs font-bold text-primary-foreground shadow-sm"
          fallbackClassName="bg-primary text-primary-foreground"
        />
        <ChevronDown
          size={14}
          className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 w-64 pt-3">
          <div className="overflow-hidden rounded-2xl border bg-card py-2 shadow-xl">
            <div className="border-b px-4 pb-3 pt-2">
              <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p>
              <span
                className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] shadow-sm ${
                  user.customBadge
                    ? "border-secondary/35 bg-secondary/15 text-foreground shadow-secondary/10 dark:text-secondary"
                    : "border-primary/20 bg-primary/10 text-primary"
                }`}
              >
                {displayLabel}
              </span>
            </div>
            <div className="border-b px-4 py-3">
              <LanguageSelector compact />
            </div>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-primary/5 hover:text-primary"
            >
              <Settings size={16} />
              Settings
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 border-t px-4 py-3 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileLogoutAction({ onLogout }: { onLogout: () => void }) {
  const { logout } = useAuth();

  async function handleLogout() {
    onLogout();
    await logout();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-600 hover:text-white"
    >
      <LogOut size={16} />
      Log out
    </button>
  );
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 relative z-10 shrink-0">
            <BrandLogo
              className="h-14 w-14 rounded-full bg-white"
              sizes="56px"
              loading="eager"
            />
            <div className="flex flex-col">
              <span className="font-sans text-sm font-extrabold leading-tight tracking-[-0.02em] sm:text-lg">Mahakal Sanatan</span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Raksha Foundation</span>
            </div>
          </Link>

          {/* Desktop navigation pill */}
          <DesktopNavigationPill location={location} />

          {/* Right actions */}
          <div className="hidden lg:flex items-center gap-3 ml-4 pl-6 border-l border-border/50">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            {!isLoading && !user ? (
              <>
                <Link
                  href="/login"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-foreground/80 transition-colors hover:bg-primary/5 hover:text-primary"
                >
                  <LogIn size={14} />
                  Login in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-primary/30 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                >
                  <UserPlus size={14} />
                  Create
                </Link>
              </>
            ) : (
              <ProfileMenu />
            )}
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-3 lg:hidden">
            <PageSwitcher location={location} />
            <button onClick={() => setIsOpen(!isOpen)} className="text-foreground p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden border-t bg-background absolute z-50 w-full shadow-xl overflow-y-auto transition-all duration-300 ease-in-out ${
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-3 pointer-events-none"
        }`}
        style={{ height: isOpen ? "calc(100dvh - 80px)" : 0 }}
      >
          <div className="border-b px-4 py-4 space-y-3">
            {!isLoading && user ? (
              <>
                <ProfileMenu
                  mobile
                  includeLogout={false}
                />
                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold text-foreground transition-colors hover:bg-primary/5 hover:text-primary"
                >
                  <Settings size={16} />
                  Settings
                </Link>
              </>
            ) : null}
          </div>
          <div className="px-4 py-4 space-y-1">
            {mobileNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-base font-semibold transition-colors hover:bg-primary/5 hover:text-primary ${
                  location.startsWith(link.href) ? "text-primary" : "text-foreground"
                }`}
              >
                <link.icon size={18} strokeWidth={2.2} aria-hidden="true" />
                {link.label}
              </Link>
            ))}
          </div>
          <div className="px-4 py-4 border-t space-y-3">
            <LanguageSelector />
            <div className="flex items-center justify-between rounded-lg px-3 py-2.5">
              <span className="text-sm font-medium text-foreground">Appearance</span>
              <ThemeToggle theme={theme} onToggle={toggleTheme} mobile />
            </div>
            {!isLoading && !user && (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-primary/30 px-3 text-sm font-medium text-primary"
                >
                  <LogIn size={16} />
                  Login in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full bg-primary px-3 text-sm font-medium text-primary-foreground"
                >
                  <UserPlus size={16} />
                  Create
                </Link>
              </div>
            )}
            {!isLoading && user && <MobileLogoutAction onLogout={() => setIsOpen(false)} />}
          </div>
        </div>
    </nav>
  );
}
