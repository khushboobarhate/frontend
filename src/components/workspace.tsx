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
  Sparkles,
  Sprout,
  Users,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { AvatarMenu } from "./avatar-menu";
import { useAuth } from "@/lib/auth/context";
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
import { NotificationBell } from "./notification-bell";
import { FarmerAiAgent } from "./farmer-ai-agent";
import { Brand, FieldLines, Notice, Spinner } from "./ui";

export function Workspace() {
  const { user, isLoading, sessionError, logout, refreshProfile } = useAuth();
  const t = useTranslations("Workspace");
  const tCommon = useTranslations("Common");
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
        <Spinner label={t("loading")} />
      </main>
    );

  if (!user)
    return (
      <main className="container" style={{ paddingBlock: 40 }}>
        <Brand />
        <section className="panel account-gate">
          <ShieldCheck size={32} strokeWidth={1.2} />
          <h2 style={{ marginTop: 20 }}>{t("unauthenticatedTitle")}</h2>
          <p>{t("unauthenticatedDesc")}</p>
          {sessionError && <Notice>{sessionError}</Notice>}
          <div className="hero-actions">
            <Link className="button" href="/login">
              {t("signIn")}
              <ArrowUpRight size={16} />
            </Link>
            <Link className="button button-outline" href="/register">
              {t("joinCommunity")}
            </Link>
          </div>
          <Link className="text-link" style={{ marginTop: 24 }} href="/">
            {tCommon("backToHome")}
          </Link>
        </section>
      </main>
    );

  const nav = [
    { id: "overview", label: t("nav.overview"), Icon: LayoutDashboard },
    ...(user.role === "admin"
      ? [
          { id: "requests", label: t("nav.requests"), Icon: ClipboardList },
          { id: "people", label: t("nav.people"), Icon: Users },
          { id: "crops", label: t("nav.crops"), Icon: Sprout },
          { id: "calls", label: t("nav.calls"), Icon: Phone },
        ]
      : [
          {
            id: user.role === "buyer" ? "marketplace" : "crops",
            label:
              user.role === "buyer"
                ? t("nav.marketplace")
                : t("nav.myHarvests"),
            Icon: Sprout,
          },
          {
            id: "interests",
            label:
              user.role === "buyer"
                ? t("nav.myInterests")
                : t("nav.interests"),
            Icon: Heart,
          },
          ...(user.role === "farmer"
            ? [
                {
                  id: "ai",
                  label: t("nav.aiAgent"),
                  Icon: Sparkles,
                },
              ]
            : []),
        ]),
    { id: "account", label: t("nav.account"), Icon: Settings },
  ];

  const requested = params.get("view") || "overview";
  const view = user.must_change_password
    ? "account"
    : nav.some((item) => item.id === requested)
      ? requested
      : "overview";
  const title = nav.find((item) => item.id === view)?.label || t("nav.overview");

  const signOut = async () => {
    setSigningOut(true);
    try {
      await logout();
      router.replace(
        user.role === "admin" ? "/admin/login" : `/login?role=${user.role}`,
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : tCommon("error"));
    } finally {
      setSigningOut(false);
    }
  };

  const greeting = user.full_name?.split(" ")[0] || "";

  return (
    <div className="workspace">
      {open && (
        <button
          className="sidebar-overlay"
          aria-label={tCommon("close")}
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <Brand />
        <div className="sidebar-role">
          <span className="live-dot" />
          {user.role === "admin"
            ? t("adminRole")
            : user.role === "farmer"
              ? t("farmerRole")
              : t("buyerRole")}
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
            <p style={{ whiteSpace: "pre-line" }}>
              {t("sidebarTagline")}
            </p>
            <Link href="/">
              {t("backToRoots")}
              <ArrowUpRight size={12} />
            </Link>
          </div>
          <button
            className="sidebar-signout"
            disabled={signingOut}
            onClick={() => void signOut()}
          >
            <LogOut size={16} />
            {signingOut ? t("signingOut") : t("signOut")}
          </button>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="workspace-top">
          <div className="workspace-breadcrumb">
            <button
              className="workspace-mobile-menu"
              aria-label={open ? tCommon("close") : tCommon("all")}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Home size={13} />
            <span>/</span>
            <span>{title}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {user.role === "farmer" && <NotificationBell />}
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
                {tCommon("tryAgain")}
              </button>
            </Notice>
          )}
          <div className="workspace-heading">
            <div>
              <span className="eyebrow">{t("eyebrow")}</span>
              <h1>
                {view === "overview"
                  ? t("greeting", { name: greeting || user.full_name })
                  : title}
              </h1>
              <p>
                {view === "overview"
                  ? user.role === "admin"
                    ? t("subtitles.adminOverview")
                    : t("subtitles.memberOverview")
                  : view === "account"
                    ? t("subtitles.account")
                    : t("subtitles.general")}
              </p>
            </div>
          </div>
          {user.must_change_password && (
            <Notice kind="info">
              {t("passwordRequiredNotice")}
            </Notice>
          )}
          {view === "overview" && (
            <>
              <section className="workspace-welcome">
                <div>
                  <span className="eyebrow">
                    {user.role === "admin"
                      ? t("welcome.adminEyebrow")
                      : t("welcome.memberEyebrow")}
                  </span>
                  <h2>
                    {user.role === "admin"
                      ? t("welcome.adminTitle")
                      : user.role === "farmer"
                        ? t("welcome.farmerTitle")
                        : t("welcome.buyerTitle")}
                  </h2>
                  <p>
                    {user.role === "admin"
                      ? t("welcome.adminDesc")
                      : user.role === "farmer"
                        ? t("welcome.farmerDesc")
                        : t("welcome.buyerDesc")}
                  </p>
                </div>
                <Link
                  className="button button-lime"
                  href={`/dashboard?view=${user.role === "admin" ? "requests" : user.role === "farmer" ? "crops" : "marketplace"}`}
                >
                  {user.role === "admin"
                    ? t("welcome.adminAction")
                    : user.role === "farmer"
                      ? t("welcome.farmerAction")
                      : t("welcome.buyerAction")}
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
          {view === "ai" && user.role === "farmer" && <FarmerAiAgent />}
          {view === "account" && <AccountPanel user={user} />}
          <footer className="workspace-footer">
            <span>{t("footerText")}</span>
            <Link href="/">
              {t("footerLink")}
              <ArrowUpRight size={11} />
            </Link>
          </footer>
        </main>
      </div>
    </div>
  );
}
