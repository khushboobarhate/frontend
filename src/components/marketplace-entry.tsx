"use client";
import { useEffect } from "react";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Check, ShieldCheck } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { SiteHeader, Footer } from "./site-header";
import { Botanical } from "./ui";
export function MarketplaceEntry() {
  const { user } = useAuth();
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
          <span className="eyebrow">THE SETUMOOLYA MARKETPLACE</span>
          <h1>
            A good harvest.
            <br />
            An even better
            <br />
            <em>connection.</em>
          </h1>
          <p>
            Meet the people behind the produce. Explore crop listings, discover
            something worth sourcing, and start a direct conversation with an
            approved farmer.
          </p>
          <div className="entry-checks">
            <span>
              <Check /> Browse organic and conventional crops
            </span>
            <span>
              <Check /> See quantities, photos, and listed prices
            </span>
            <span>
              <Check /> Express interest and connect directly
            </span>
          </div>
          <div className="hero-actions">
            <Link href="/login?role=buyer" className="button">
              Sign in to explore
              <ArrowUpRight size={19} />
            </Link>
            <Link href="/register?role=buyer" className="button button-outline">
              Join as a buyer
              <ArrowRight size={18} />
            </Link>
          </div>
          <small className="muted">
            Our marketplace is open to approved members. New here? Registration
            is the first step.
          </small>
        </div>
        <div className="entry-image">
          <Image
            src="/images/rice-fields.jpg"
            alt="An Indian farmer carrying fresh rice seedlings through a paddy field"
            fill
            priority
            sizes="(max-width: 760px) 95vw, 45vw"
          />
          <span>
            <ShieldCheck size={22} />
            Better sourcing starts
            <br />
            with people you can meet.
          </span>
        </div>
        <Botanical className="entry-botanical" />
      </main>
      <Footer />
    </>
  );
}
