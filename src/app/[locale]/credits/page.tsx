import { useTranslations } from "next-intl";
import { Footer, SiteHeader } from "@/components/site-header";
const photographs = [
  [
    "A rice farmer in New Vellanur, Tamil Nadu",
    "Gowtham AGM",
    "https://unsplash.com/photos/a-man-kneeling-down-in-the-middle-of-a-rice-field-BWYUwLnGLeY",
  ],
  [
    "Carrying rice seedlings in Tamil Nadu",
    "Foto Murthy",
    "https://unsplash.com/photos/person-walking-on-rice-field-lXVWulsnNQE",
  ],
  [
    "Wheat harvesting in Kota, Rajasthan",
    "Anurag Gautam",
    "https://unsplash.com/photos/a-woman-in-a-red-bandana-is-harvesting-wheat-wE3JiWG54G0",
  ],
  [
    "A wheat field in Madhubani, India",
    "Abhinav Anand",
    "https://unsplash.com/photos/golden-wheat-field-under-a-clear-blue-sky-LunkQa2bNYo",
  ],
  [
    "Basil leaves",
    "Andrei Castanha",
    "https://unsplash.com/photos/close-up-of-lush-green-basil-leaves-in-a-garden-si0fsVD0uZo",
  ],
  [
    "Steamed groundnuts",
    "Angie J",
    "https://unsplash.com/photos/a-large-pile-of-dried-turmeric-roots-5zAy3VhNxSs",
  ],
];
export default function CreditsPage() {
  const t = useTranslations("Credits");
  return (
    <>
      <SiteHeader />
      <main className="container credits-page" id="main-content">
        <span className="eyebrow">{t("eyebrow")}</span>
        <h1>{t("title")}</h1>
        <p>
          {t("description")}{" "}
          <a
            href="https://unsplash.com/license"
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "underline" }}
          >
            Unsplash License
          </a>
          .
        </p>
        <ul>
          {photographs.map(([subject, creator, source]) => (
            <li key={source}>
              <strong>{subject}</strong>
              <br />
              {t("by", { creator })}
              <a href={source} target="_blank" rel="noreferrer">
                {t("viewOriginal")}
              </a>
            </li>
          ))}
        </ul>
        <p style={{ marginTop: 30 }}>
          {t("illustrationNote")}
        </p>
      </main>
      <Footer />
    </>
  );
}
