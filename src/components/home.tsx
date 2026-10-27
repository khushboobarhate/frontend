"use client";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Handshake,
  Leaf,
  ShieldCheck,
  Sprout,
  Sun,
  Wheat,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { SiteHeader, Footer } from "./site-header";
import { ArrowLink, Botanical, FieldLines } from "./ui";
const categories = [
  {
    image: "herbs",
    name: "Herbs & botanicals",
    note: "Rooted in nature’s goodness",
    search: "herb",
    tag: "NATURALLY NOURISHING",
  },
  {
    image: "wheat",
    name: "Grains & cereals",
    note: "The heart of every harvest",
    search: "wheat",
    tag: "EVERYDAY ESSENTIALS",
  },
  {
    image: "spices",
    name: "Groundnuts & more",
    note: "Small harvests. Rich possibilities.",
    search: "groundnut",
    tag: "GROWN WITH CHARACTER",
  },
];
export function Home() {
  const t = useTranslations("Home");
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="hero container">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="live-dot" />
              {t("eyebrow")}
            </div>
            <h1>
              {t("title")}
              <br />
              <em>{t("titleAccent")}</em>
              <svg
                viewBox="0 0 360 16"
                fill="none"
                className="title-underline"
                aria-hidden="true"
              >
                <path
                  d="M3 12C112-2 231-1 355 9"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </h1>
            <p className="hero-description">{t("description")}</p>
            <div className="hero-actions">
              <Link className="button" href="/marketplace">
                {t("explore")}
                <ArrowUpRight size={19} />
              </Link>
              <Link
                className="button button-outline"
                href="/register?role=farmer"
              >
                {t("farmer")}
                <ArrowRight size={18} />
              </Link>
            </div>
            <div className="hero-trust">
              <span className="trust-stamp">
                <ShieldCheck size={21} strokeWidth={1.6} />
              </span>
              <p>
                <strong>{t("trustTitle")}</strong>
                <span>{t("trustDescription")}</span>
              </p>
            </div>
            <Botanical className="hero-botanical" />
          </div>
          <div className="hero-visual">
            <div className="hero-photo">
              <Image
                src="/images/farmer-field.jpg"
                alt="A farmer planting young rice seedlings in a field in Tamil Nadu, India"
                fill
                priority
                sizes="(max-width: 760px) 100vw, 52vw"
                className="hero-image"
              />
              <div className="hero-photo-overlay" />
              <span className="photo-coordinate">
                <span />
                TAMIL NADU, INDIA
              </span>
              <div className="hero-photo-caption">
                <span>THE HANDS BEHIND EVERY HARVEST</span>
                <p>
                  A little more connection.
                  <br />A world of possibility.
                </p>
              </div>
            </div>
            <div className="harvest-seal">
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <defs>
                  <path
                    id="seal-path"
                    d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0"
                  />
                </defs>
                <text>
                  <textPath href="#seal-path" startOffset="0%">
                    GROWN WITH CARE · CONNECTED WITH PURPOSE ·{" "}
                  </textPath>
                </text>
              </svg>
              <Sprout size={30} strokeWidth={1.4} />
            </div>
            <div className="hero-note">
              <span className="note-leaf">
                <Leaf size={21} />
              </span>
              <div>
                <strong>
                  From our soil.
                  <br />
                  For a better tomorrow.
                </strong>
                <span>Every root deserves its worth.</span>
              </div>
              <ArrowUpRight size={21} />
            </div>
          </div>
        </section>
        <section className="principles container" aria-label="Our principles">
          <p>
            A better way to
            <br />
            <strong>grow your connections.</strong>
          </p>
          <div>
            <ShieldCheck />
            <span>
              Admin-reviewed
              <br />
              <strong>farmer & buyer profiles</strong>
            </span>
          </div>
          <div>
            <Handshake />
            <span>
              Direct conversations.
              <br />
              <strong>Meaningful connections.</strong>
            </span>
          </div>
          <div>
            <Wheat />
            <span>
              From medicinal herbs
              <br />
              <strong>to everyday harvests</strong>
            </span>
          </div>
        </section>
        <section className="harvest-section section-pad" id="harvests">
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="eyebrow">A WORLD OF POSSIBILITY</span>
                <h2>
                  Goodness, straight
                  <br />
                  from the <em>ground.</em>
                </h2>
              </div>
              <div className="section-aside">
                <p>
                  Explore the possibilities in every harvest.
                  <br />
                  Find your next connection in the marketplace.
                </p>
                <ArrowLink href="/marketplace">
                  Explore the marketplace
                </ArrowLink>
              </div>
            </div>
            <div className="category-grid">
              {categories.map((category) => (
                <Link
                  href={`/marketplace?search=${category.search}`}
                  key={category.name}
                  className="category-card"
                >
                  <div className="category-image">
                    <Image
                      src={`/images/${category.image}.jpg`}
                      alt={category.name}
                      fill
                      sizes="(max-width: 640px) 90vw, 32vw"
                    />
                    <span>{category.tag}</span>
                    <span className="round-arrow">
                      <ArrowUpRight size={23} />
                    </span>
                  </div>
                  <h3>{category.name}</h3>
                  <p>{category.note}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
        <section
          className="how-section container section-pad"
          id="how-it-works"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                SIMPLE STEPS. STRONGER CONNECTIONS.
              </span>
              <h2>
                Your next chapter
                <br />
                starts with a <em>seed.</em>
              </h2>
            </div>
            <p className="section-aside">
              Less complexity. More possibility.
              <br />
              Here’s how we bring the two sides together.
            </p>
          </div>
          <div className="steps-grid">
            {[
              {
                icon: Sprout,
                title: "Plant your first seed",
                text: "Register as a farmer or buyer. Share a few details and let our team review your application.",
              },
              {
                icon: ShieldCheck,
                title: "Grow with confidence",
                text: "Once approved, your login details arrive by email. Set your password and make yourself at home.",
              },
              {
                icon: Handshake,
                title: "Connect with possibility",
                text: "List a harvest or discover one. Express interest, start a conversation, and grow your network.",
              },
            ].map((step, index) => (
              <article className="step-card" key={step.title}>
                <div className="step-top">
                  <span className="step-number">0{index + 1}</span>
                  <step.icon size={31} strokeWidth={1.2} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
          <div className="how-footer">
            <span>
              <Check size={17} /> One simple registration. Human review. A real
              connection.
            </span>
            <ArrowLink href="/register">Let’s get you growing</ArrowLink>
          </div>
        </section>
        <section className="purpose-section" id="purpose">
          <div className="container purpose-grid">
            <div className="purpose-photo">
              <Image
                src="/images/harvest.jpg"
                alt="A farmer harvesting wheat in Kota, Rajasthan"
                fill
                sizes="(max-width: 760px) 100vw, 50vw"
              />
              <div className="photo-label">
                <Sun size={16} /> GROWN WITH PATIENCE. HARVESTED WITH PRIDE.
              </div>
            </div>
            <div className="purpose-copy">
              <span className="eyebrow">MORE THAN A MARKETPLACE</span>
              <h2>
                Behind every crop,
                <br />
                there’s a story
                <br />
                <em>worth connecting.</em>
              </h2>
              <p>
                The early mornings. The changing seasons. The care that goes
                into every field. We believe that work deserves to be seen — and
                connected to opportunity.
              </p>
              <p>
                SetuMoolya brings farmers and buyers closer, with thoughtful
                introductions and space for direct conversations. Because a
                better future for agriculture starts with its people.
              </p>
              <ArrowLink href="/register?role=farmer">
                Be part of the story
              </ArrowLink>
              <Botanical className="purpose-botanical" />
            </div>
          </div>
        </section>
        <section className="join-section container">
          <div>
            <span className="eyebrow">LET’S GROW SOMETHING GOOD</span>
            <h2>
              Your roots.
              <br />
              Our shared <em>future.</em>
            </h2>
          </div>
          <div>
            <p>
              Whether you grow it or source it,
              <br />
              there’s a place for you here.
            </p>
            <div className="hero-actions">
              <Link href="/register?role=farmer" className="button">
                I’m a farmer
                <ArrowUpRight size={18} />
              </Link>
              <Link
                href="/register?role=buyer"
                className="button button-outline"
              >
                I’m a buyer
                <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
          <div className="join-lines">
            <FieldLines />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
