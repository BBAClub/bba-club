import type {
  Metadata,
} from "next";

import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import "./globals.css";
import "leaflet/dist/leaflet.css";

const geistSans = Geist({
  variable:
    "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable:
    "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://bbaclubvse.cz"
  ),

  title: {
    default:
      "BBA Club | VŠE Prague",
    template:
      "%s | BBA Club",
  },

  description:
    "The student community for BBA students at Prague University of Economics and Business. Discover events, Prague recommendations, study resources and more.",

  applicationName:
    "BBA Club",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bbaclubvse.cz",
    siteName: "BBA Club",
    title:
      "BBA Club | VŠE Prague",
    description:
      "Events, study resources, Prague recommendations and a community for BBA students at VŠE.",
  },

  twitter: {
    card: "summary",
    title:
      "BBA Club | VŠE Prague",
    description:
      "Events, study resources, Prague recommendations and a community for BBA students at VŠE.",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}