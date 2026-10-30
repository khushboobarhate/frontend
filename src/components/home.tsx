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

export function Home() {
  const t = useTranslations("Home");

  const categories = [
    {
      image: "herbs",
      name: t("catHerbs"),
      note: t("catHerbsNote"),
      search: "herb",
      tag: t("catHerbsTag"),
    },
    {
      image: "wheat",
      name: t("catGrains"),
      note: t("catGrainsNote"),
      search: "wheat",
      tag: t("catGrainsTag"),
    },
    {
      image: "spices",
      name: t("catSpices"),
      note: t("catSpicesNote"),
      search: "groundnut",
      tag: t("catSpicesTag"),
    },
  ];

  const steps = [
    {
      icon: Sprout,
      eyebrow: t("step1Eyebrow"),
      title: t("step1Title"),
      text: t("step1Desc"),
    },
    {
      icon: ShieldCheck,
      eyebrow: t("step2Eyebrow"),
      title: t("step2Title"),
      text: t("step2Desc"),
    },
    {
      icon: Handshake,
      eyebrow: t("step3Eyebrow"),
      title: t("step3Title"),
      text: t("step3Desc"),
    },
  ];

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
                {t("coordinates")}
              </span>
              <div className="hero-photo-caption">
                <span>{t("photoHeading")}</span>
                <p style={{ whiteSpace: "pre-line" }}>
                  {t("photoText")}
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
                    {t("seal")}
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
                <strong style={{ whiteSpace: "pre-line" }}>
                  {t("heroNoteTitle")}
                </strong>
                <span>{t("heroNoteSub")}</span>
              </div>
              <ArrowUpRight size={21} />
            </div>
          </div>
        </section>

        <section className="principles container" aria-label="Our principles">
          <p style={{ whiteSpace: "pre-line" }}>
            {t("principlesHeading")}
          </p>
          <div>
            <ShieldCheck />
            <span style={{ whiteSpace: "pre-line" }}>
              {t("principle1")}
            </span>
          </div>
          <div>
            <Handshake />
            <span style={{ whiteSpace: "pre-line" }}>
              {t("principle2")}
            </span>
          </div>
          <div>
            <Wheat />
            <span style={{ whiteSpace: "pre-line" }}>
              {t("principle3")}
            </span>
          </div>
        </section>

        <section className="harvest-section section-pad" id="harvests">
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="eyebrow">{t("harvestsEyebrow")}</span>
                <h2>
                  {t("harvestsTitle")}
                  <br />
                  <em>{t("harvestsTitleAccent")}</em>
                </h2>
              </div>
              <div className="section-aside">
                <p style={{ whiteSpace: "pre-line" }}>
                  {t("harvestsDesc")}
                </p>
                <ArrowLink href="/marketplace">
                  {t("exploreMarketplace")}
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
              <span className="eyebrow">{t("howEyebrow")}</span>
              <h2>
                {t("howTitle")}
                <br />
                <em>{t("howTitleAccent")}</em>
              </h2>
            </div>
            <p className="section-aside" style={{ whiteSpace: "pre-line" }}>
              {t("howDesc")}
            </p>
          </div>
          <div className="steps-grid">
            {steps.map((step, index) => (
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
              <Check size={17} /> {t("trustDescription")}
            </span>
            <ArrowLink href="/register">{t("exploreMarketplace")}</ArrowLink>
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
                <Sun size={16} /> {t("seal")}
              </div>
            </div>
            <div className="purpose-copy">
              <span className="eyebrow">{t("purposeEyebrow")}</span>
              <h2>{t("purposeTitle")}</h2>
              <blockquote style={{ fontSize: "1.1rem", fontStyle: "italic", margin: "16px 0", color: "var(--foreground)" }}>
                {t("purposeQuote")}
              </blockquote>
              <p style={{ fontWeight: 600, color: "var(--color-primary-dark, #2b5329)" }}>
                — {t("purposeAuthor")}
              </p>
              <ArrowLink href="/register?role=farmer">
                {t("farmer")}
              </ArrowLink>
              <Botanical className="purpose-botanical" />
            </div>
          </div>
        </section>

        <section className="join-section container">
          <div>
            <span className="eyebrow">{t("ctaEyebrow")}</span>
            <h2>{t("ctaTitle")}</h2>
          </div>
          <div>
            <p>{t("ctaDesc")}</p>
            <div className="hero-actions">
              <Link href="/register?role=farmer" className="button">
                {t("ctaFarmer")}
                <ArrowUpRight size={18} />
              </Link>
              <Link
                href="/register?role=buyer"
                className="button button-outline"
              >
                {t("ctaBuyer")}
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
