"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  ClipboardList,
  Heart,
  Home,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  Phone,
  Settings,
  ShieldCheck,
  Sprout,
  Users,
  X,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { AvatarMenu } from "./avatar-menu";
import { useAuth } from "@/lib/auth/context";
import type { UserRole } from "@/types";
import {
  AdminMetrics,
  CallActivity,
  PeoplePanel,
  RequestPanel,
} from "./admin-workspace";
import {
  AccountPanel,
  CropPanel,
  InterestsPanel,
  MemberMetrics,
} from "./market-workspace";
import { LanguageSwitch } from "./site-header";
import { Brand, FieldLines, Notice, Spinner } from "./ui";
const navigation = (role: UserRole) => [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  ...(role === "admin"
    ? [
        { id: "requests", label: "Registration inbox", Icon: ClipboardList },
        { id: "people", label: "Our community", Icon: Users },
        { id: "crops", label: "Crop listings", Icon: Sprout },
        { id: "calls", label: "Contact activity", Icon: Phone },
      ]
    : [
        {
          id: role === "buyer" ? "marketplace" : "crops",
          label: role === "buyer" ? "The marketplace" : "My harvests",
          Icon: Sprout,
        },
        {
          id: "interests",
          label: role === "buyer" ? "My interests" : "Buyer interests",
          Icon: Heart,
        },
      ]),
  { id: "account", label: "My account", Icon: Settings },
];
export function Workspace() {
  const { user, isLoading, sessionError, logout, refreshProfile } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const route = params.toString();
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === route;
  const setOpen = (value: boolean) => setOpenFor(value ? route : null);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenFor(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  if (isLoading)
    return (
      <main className="workspace-loading" style={{ minHeight: "100vh" }}>
        <Spinner label="Opening your workspace…" />
      </main>
    );
  if (!user)
    return (
      <main className="container" style={{ paddingBlock: 40 }}>
        <Brand />
        <section className="panel account-gate">
          <ShieldCheck size={32} strokeWidth={1.2} />
          <h2 style={{ marginTop: 20 }}>Your community is waiting.</h2>
          <p>
            Sign in with the credentials sent to your email after approval. Your
            harvests, connections, and account will be right here.
          </p>
          {sessionError && <Notice>{sessionError}</Notice>}
          <div className="hero-actions">
            <Link className="button" href="/login">
              Sign in
              <ArrowUpRight size={16} />
            </Link>
            <Link className="button button-outline" href="/register">
              Join the community
            </Link>
          </div>
          <Link className="text-link" style={{ marginTop: 24 }} href="/">
            Back to home
          </Link>
        </section>
      </main>
    );
  const nav = navigation(user.role);
  const requested = params.get("view") || "overview";
  const view = user.must_change_password
    ? "account"
    : nav.some((item) => item.id === requested)
      ? requested
      : "overview";
  const title = nav.find((item) => item.id === view)?.label || "Overview";
  const signOut = async () => {
    setSigningOut(true);
    try {
      await logout();
      router.replace(
        user.role === "admin" ? "/admin/login" : `/login?role=${user.role}`,
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSigningOut(false);
    }
  };
  const greeting = user.full_name?.split(" ")[0] || "there";
  return (
    <div className="workspace">
      {open && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <Brand />
        <div className="sidebar-role">
          <span className="live-dot" />
          {user.role === "admin"
            ? "COMMUNITY ADMIN"
            : user.role === "farmer"
              ? "FARMER WORKSPACE"
              : "BUYER WORKSPACE"}
        </div>
        <nav className="sidebar-nav" aria-label="Workspace navigation">
          {nav.map(({ id, label, Icon }) => (
            <Link
              key={id}
              className={view === id ? "active" : ""}
              href={`/dashboard?view=${id}`}
              aria-current={view === id ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <Icon size={17} strokeWidth={1.6} />
              {label}
              {view === id && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Leaf size={24} strokeWidth={1.2} />
            <p>
              Good things grow
              <br />
              when we grow together.
            </p>
            <Link href="/">
              Back to our roots
              <ArrowUpRight size={12} />
            </Link>
          </div>
          <button
            className="sidebar-signout"
            disabled={signingOut}
            onClick={() => void signOut()}
          >
            <LogOut size={16} />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="workspace-top">
          <div className="workspace-breadcrumb">
            <button
              className="workspace-mobile-menu"
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Home size={13} />
            <span>/</span>
            <span>{title}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <LanguageSwitch />
            <AvatarMenu />
          </div>
        </header>
        <main className="workspace-main" id="main-content">
          {(error || sessionError) && (
            <Notice>
              {error || sessionError}
              <button
                className="text-link"
                onClick={() => void refreshProfile().catch(() => {})}
              >
                Try again
              </button>
            </Notice>
          )}
          <div className="workspace-heading">
            <div>
              <span className="eyebrow">ROOTED IN POSSIBILITY</span>
              <h1>
                {view === "overview"
                  ? `A good day to grow, ${greeting}.`
                  : title}
              </h1>
              <p>
                {view === "overview"
                  ? user.role === "admin"
                    ? "A little care today. A stronger community tomorrow."
                    : "Your harvest. Your connections. Your next chapter."
                  : view === "account"
                    ? "A little care for the person behind the profile."
                    : "Good connections begin with the details."}
              </p>
            </div>
          </div>
          {user.must_change_password && (
            <Notice kind="info">
              Your account is approved. Set a personal password to open the rest
              of your workspace.
            </Notice>
          )}
          {view === "overview" && (
            <>
              <section className="workspace-welcome">
                <div>
                  <span className="eyebrow">
                    {user.role === "admin"
                      ? "THE COMMUNITY STARTS WITH YOU"
                      : "A LITTLE MORE CONNECTION"}
                  </span>
                  <h2>
                    {user.role === "admin"
                      ? "Help good connections take root."
                      : user.role === "farmer"
                        ? "Your hard work deserves to be seen."
                        : "Find the people behind the produce."}
                  </h2>
                  <p>
                    {user.role === "admin"
                      ? "Review applications, welcome new members, and keep the community growing with care."
                      : user.role === "farmer"
                        ? "Share what you’ve grown and connect directly with buyers who see its value."
                        : "Discover real harvests, share your interest, and start a conversation with a farmer."}
                  </p>
                </div>
                <Link
                  className="button button-lime"
                  href={`/dashboard?view=${user.role === "admin" ? "requests" : user.role === "farmer" ? "crops" : "marketplace"}`}
                >
                  {user.role === "admin"
                    ? "Review applications"
                    : user.role === "farmer"
                      ? "Manage my harvests"
                      : "Explore harvests"}
                  <ArrowUpRight size={17} />
                </Link>
                <div className="welcome-lines">
                  <FieldLines />
                </div>
              </section>
              {user.role === "admin" ? (
                <>
                  <AdminMetrics key={revision} />
                  <RequestPanel
                    overview
                    onChanged={() => setRevision((value) => value + 1)}
                  />
                </>
              ) : (
                <>
                  <MemberMetrics role={user.role} />
                  <CropPanel role={user.role} overview />
                </>
              )}
            </>
          )}
          {view === "requests" && user.role === "admin" && <RequestPanel />}
          {view === "people" && user.role === "admin" && <PeoplePanel />}
          {view === "calls" && user.role === "admin" && <CallActivity />}
          {(view === "crops" || view === "marketplace") && (
            <CropPanel
              key={`${view}-${params.get("search") || ""}`}
              role={user.role}
              initialSearch={params.get("search") || ""}
            />
          )}
          {view === "interests" && user.role !== "admin" && (
            <InterestsPanel role={user.role} />
          )}
          {view === "account" && <AccountPanel user={user} />}
          <footer className="workspace-footer">
            <span>SetuMoolya · A more connected harvest.</span>
            <Link href="/">
              Rooted in India. Growing together.
              <ArrowUpRight size={11} />
            </Link>
          </footer>
        </main>
      </div>
    </div>
  );
}
