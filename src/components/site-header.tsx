"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronDown, Globe2, Menu, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useAuth } from "@/lib/auth/context";
import { AvatarMenu } from "./avatar-menu";
import { Brand } from "./ui";
import type { Locale } from "@/types";
export function LanguageSwitch() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const pathname = usePathname();
  const router = useRouter();
  return (
    <label className="language-switch">
      <Globe2 size={16} />
      <span className="sr-only">Language</span>
      <select
        aria-label="Language"
        value={locale}
        onChange={(event) =>
          router.replace(
            `${pathname}${window.location.search}${window.location.hash}`,
            { locale: event.target.value as Locale },
          )
        }
      >
        <option value="en">EN</option>
        <option value="hi">हिंदी</option>
        <option value="gu">ગુજરાતી</option>
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
        <span className="announcement-hindi">जड़ों से जुड़ें, साथ बढ़ें।</span>
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
            aria-label={open ? "Close navigation" : "Open navigation"}
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
          <p>
            Good things grow when
            <br />
            we grow together.
          </p>
        </div>
        <div className="footer-links">
          <span>THE COMMUNITY</span>
          <Link href="/register?role=farmer">For farmers</Link>
          <Link href="/register?role=buyer">For buyers</Link>
        </div>
        <div className="footer-links">
          <span>EXPLORE</span>
          <Link href="/marketplace">{t("marketplace")}</Link>
          <Link href="/#how-it-works">{t("how")}</Link>
          <Link href="/#purpose">{t("purpose")}</Link>
        </div>
        <div className="footer-note">
          <span className="eyebrow">सेतुमूल्य</span>
          <p>
            A bridge from your roots
            <br />
            to new possibilities.
          </p>
          <div className="footer-dot">
            <span />
            Rooted in India.
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} SetuMoolya. Made for a more connected
          harvest.
        </span>
        <Link href="/credits">
          Photography credits <ArrowUpRight size={12} />
        </Link>
      </div>
    </footer>
  );
}
