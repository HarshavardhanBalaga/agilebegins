import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { env } from "@/lib/env";

// Cal Sans is the site's primary typeface, self-hosted from
// src/assets/fonts and applied via the --font-cal-sans CSS variable.
// Local loading avoids the Google Fonts fallback-metrics warning entirely.
const calSans = localFont({
  src: [
    {
      path: "../assets/fonts/cal-sans-latin-400-normal.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/cal-sans-latin-ext-400-normal.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-cal-sans",
});

const siteName = "Agile Begins";
const description =
  "Practical live workshops for ambitious students — build real projects, sharpen in-demand skills, and get career-ready.";

export const metadata: Metadata = {
  // Absolute base so OG/canonical URLs resolve on the production domain.
  metadataBase: new URL(env.appUrl()),
  title: {
    default: `${siteName} — Practical workshops for students`,
    template: `%s | ${siteName}`,
  },
  description,
  applicationName: siteName,
  icons: {
    // Main app mark as the browser-tab favicon.
    icon: "/logos/main-icon.png",
    // Same mark for Apple touch / home-screen surfaces.
    apple: "/logos/main-icon.png",
    shortcut: "/logos/main-icon.png",
  },
  openGraph: {
    type: "website",
    siteName,
    title: `${siteName} — Practical workshops for students`,
    description,
    url: env.appUrl(),
    images: ["/logos/main-icon.png"],
  },
  twitter: {
    card: "summary",
    title: `${siteName} — Practical workshops for students`,
    description,
    images: ["/logos/main-icon.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={calSans.variable}>
      <body>
        {children}
      </body>
    </html>
  );
}
