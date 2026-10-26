import type { Metadata } from "next";
import {
  DM_Sans,
  DM_Serif_Display,
  Noto_Sans_Devanagari,
} from "next/font/google";
import { AuthProvider } from "@/lib/auth/context";
import "./globals.css";
const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const serif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});
const hindi = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-hindi",
  display: "swap",
});
export const metadata: Metadata = {
  title: {
    default: "SetuMoolya — Rooted in fair value",
    template: "%s · SetuMoolya",
  },
  description:
    "A more connected future for Indian agriculture. Meet farmers, discover harvests, and build direct relationships on SetuMoolya.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${sans.variable} ${serif.variable} ${hindi.variable}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
