import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import siteData from "../data/site-data.json";

const displayFont = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata = {
  title: siteData.seo.title || siteData.restaurant.name,
  description: siteData.seo.description,
};

export default function RootLayout({ children }) {
  return (
    <html lang="de" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
