import type { Metadata } from "next";
import { GeistPixelCircle } from "geist/font/pixel";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://portal.world1.dev"),
  title: {
    default: "World1 Portal",
    template: "%s | World1 Portal",
  },
  description: "Private World1 stakeholder portal.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistPixelCircle.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
      </body>
    </html>
  );
}
