import type { Metadata } from "next";
import { Geist, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const fontSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const fontNumeric = IBM_Plex_Sans({
  variable: "--font-numeric",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://niticsr.com"),
  title: {
    default: "NITICSR — India's Enterprise CSR Operating System",
    template: "%s — NITICSR",
  },
  description:
    "Verified impact. Absolute compliance. NITICSR is the enterprise operating system for Corporate CSR in India — AI-matched NGO discovery, verification, and Schedule VII compliance in one platform.",
  openGraph: {
    title: "NITICSR — India's Enterprise CSR Operating System",
    description:
      "Verified impact. Absolute compliance. AI-matched NGO discovery, verification, and Schedule VII compliance in one platform.",
    siteName: "NITICSR",
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} ${fontNumeric.variable} antialiased`}
      >
        <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
