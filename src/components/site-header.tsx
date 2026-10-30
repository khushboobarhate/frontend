"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronDown, Globe2, Menu, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useAuth } from "@/lib/auth/context";
import { updateProfile } from "@/lib/api/client";
import { AvatarMenu } from "./avatar-menu";
import { Brand } from "./ui";
import type { Locale } from "@/types";

export function LanguageSwitch() {
  const locale = useLocale();
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale === locale) return;
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=lax`;
    try {
      localStorage.setItem("sm_locale", newLocale);
      sessionStorage.setItem("sm_locale_explicit", newLocale);
    } catch {}
    if (user?.role) {
      updateProfile(user.role, { preferred_language: newLocale }).catch(() => {});
    }
    router.replace(
      `${pathname}${window.location.search}${window.location.hash}`,
      { locale: newLocale },
    );
  };

  return (
    <label className="language-switch">
      <Globe2 size={16} />
      <span className="sr-only">Language</span>
      <select
        aria-label="Language"
        value={locale}
        onChange={(event) => handleLanguageChange(event.target.value as Locale)}
      >
        <option value="en">EN</option>
        <option value="hi">हिंदी</option>
        <option value="gu">ગુજરાતી</option>
        <option value="mr">मराठी</option>
      </select>
      <ChevronDown size={12} />
    </label>
  );
}

export function SiteHeader({ simple = false }: { simple?: boolean }) {
  const t = useTranslations("Nav");
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="announcement">
        <span className="tiny-sun">✳</span>
        {t("announcement")}
        <span className="announcement-hindi">{t("announcementSub")}</span>
      </div>
      <header className="site-header container">
        <Brand />
        <nav
          className={`main-nav ${open ? "nav-open" : ""}`}
          aria-label="Main navigation"
        >
          <Link href="/marketplace" onClick={() => setOpen(false)}>
            {t("marketplace")}
          </Link>
          <Link href="/#how-it-works" onClick={() => setOpen(false)}>
            {t("how")}
          </Link>
          <Link href="/#purpose" onClick={() => setOpen(false)}>
            {t("purpose")}
          </Link>
        </nav>
        <div className="header-actions">
          <LanguageSwitch />
          {!simple &&
            (user ? (
              <AvatarMenu />
            ) : (
              <>
                <Link className="sign-in-link" href="/login">
                  {t("login")}
                </Link>
                <Link
                  className="button button-small join-button"
                  href="/register"
                >
                  {t("join")}
                  <ArrowUpRight size={16} />
                </Link>
              </>
            ))}
          <button
            className="icon-button mobile-menu"
            aria-label={open ? t("closeMenu") : t("openMenu")}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
    </>
  );
}

export function Footer() {
  const t = useTranslations("Nav");
  return (
    <footer className="footer">
      <div className="container footer-top">
        <div>
          <Brand light />
          <p style={{ whiteSpace: "pre-line" }}>
            {t("footerTagline")}
          </p>
        </div>
        <div className="footer-links">
          <span>{t("community")}</span>
          <Link href="/register?role=farmer">{t("forFarmers")}</Link>
          <Link href="/register?role=buyer">{t("forBuyers")}</Link>
        </div>
        <div className="footer-links">
          <span>{t("explore")}</span>
          <Link href="/marketplace">{t("marketplace")}</Link>
          <Link href="/#how-it-works">{t("how")}</Link>
          <Link href="/#purpose">{t("purpose")}</Link>
        </div>
        <div className="footer-note">
          <span className="eyebrow">सेतुमूल्य</span>
          <p style={{ whiteSpace: "pre-line" }}>
            {t("footerBridge")}
          </p>
          <div className="footer-dot">
            <span />
            {t("rootedInIndia")}
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          {t("copyright", { year: new Date().getFullYear() })}
        </span>
        <Link href="/credits">
          {t("photographyCredits")} <ArrowUpRight size={12} />
        </Link>
      </div>
    </footer>
  );
}
