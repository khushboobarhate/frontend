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
  return (
    <>
      <SiteHeader />
      <main className="container credits-page" id="main-content">
        <span className="eyebrow">THE PEOPLE BEHIND THE PICTURES</span>
        <h1>A little gratitude.</h1>
        <p>
          The photographs that bring our story to life are by the following
          creators on Unsplash. They are used under the{" "}
          <a
            href="https://unsplash.com/license"
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "underline" }}
          >
            Unsplash License
          </a>
          . These editorial images illustrate farming and produce; they do not
          represent registered members, available listings, or endorsements.
        </p>
        <ul>
          {photographs.map(([subject, creator, source]) => (
            <li key={source}>
              <strong>{subject}</strong>
              <br />
              Photography by {creator}
              <a href={source} target="_blank" rel="noreferrer">
                View the original photograph ↗
              </a>
            </li>
          ))}
        </ul>
        <p style={{ marginTop: 30 }}>
          The bridge, botanical drawings, and field illustrations were created
          for this interface as scalable SVG artwork.
        </p>
      </main>
      <Footer />
    </>
  );
}
