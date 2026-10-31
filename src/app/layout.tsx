import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://learnsphere.global";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LearnSphere Global — Learn the skills that actually ship",
    template: "%s · LearnSphere Global",
  },
  description:
    "World-class courses in engineering, data and design, taught by practitioners who have shipped at scale. Learn by building real systems, with an AI tutor grounded in your course material.",
  keywords: [
    "online courses",
    "learn to code",
    "Next.js course",
    "Supabase",
    "product analytics",
    "design systems",
    "AI tutor",
  ],
  authors: [{ name: "LearnSphere Global" }],
  creator: "LearnSphere Global",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "LearnSphere Global",
    title: "LearnSphere Global — Learn the skills that actually ship",
    description:
      "World-class courses in engineering, data and design, taught by practitioners who have shipped at scale.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "LearnSphere Global",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LearnSphere Global",
    description:
      "World-class courses in engineering, data and design, taught by practitioners who have shipped at scale.",
    images: ["https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&q=80"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfcfa" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0c12" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable} ${mono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
