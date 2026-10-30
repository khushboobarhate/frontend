"use client";
import { useEffect } from "react";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Check, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { SiteHeader, Footer } from "./site-header";
import { Botanical } from "./ui";

export function MarketplaceEntry() {
  const { user } = useAuth();
  const t = useTranslations("MarketplaceEntry");
  const router = useRouter();
  const params = useSearchParams();
  const search = params.get("search") || "";

  useEffect(() => {
    if (user)
      router.replace(
        `/dashboard?view=${user.role === "buyer" ? "marketplace" : "crops"}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
      );
  }, [user, router, search]);

  return (
    <>
      <SiteHeader />
      <main className="container marketplace-entry">
        <div>
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1>
            {t("title1")}
            <br />
            {t("title2")}
            <br />
            <em>{t("title3")}</em>
          </h1>
          <p>{t("description")}</p>
          <div className="entry-checks">
            <span>
              <Check /> {t("check1")}
            </span>
            <span>
              <Check /> {t("check2")}
            </span>
            <span>
              <Check /> {t("check3")}
            </span>
          </div>
          <div className="hero-actions">
            <Link href="/login?role=buyer" className="button">
              {t("signInButton")}
              <ArrowUpRight size={19} />
            </Link>
            <Link href="/register?role=buyer" className="button button-outline">
              {t("joinButton")}
              <ArrowRight size={18} />
            </Link>
          </div>
          <small className="muted">{t("notice")}</small>
        </div>
        <div className="entry-image">
          <Image
            src="/images/rice-fields.jpg"
            alt="An Indian farmer carrying fresh rice seedlings through a paddy field"
            fill
            priority
            sizes="(max-width: 760px) 95vw, 45vw"
          />
          <span style={{ whiteSpace: "pre-line" }}>
            <ShieldCheck size={22} />
            {t("badge")}
          </span>
        </div>
        <Botanical className="entry-botanical" />
      </main>
      <Footer />
    </>
  );
}
