import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Geist via the official geist npm package (next/font/google doesn't carry Geist in Next 14)
const geistSans = localFont({
  src: "../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2",
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PilotPhD — Your PhD Application Co-Pilot",
  description:
    "Stay organized, write better emails, and find fellowships with AI-powered tools built for PhD applicants.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased bg-[#fafafa]">{children}</body>
    </html>
  );
}
