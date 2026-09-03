import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ParticleBackground from "@/components/ParticleBackground";

export const metadata: Metadata = {
  title: "IPL Universe — The Ultimate Cricket Analytics Platform",
  description:
    "Explore ball-by-ball IPL stats from 2008–2024. Real-time win predictor, player H2H analysis, venue analytics, and immersive 3D visualizations.",
  keywords: "IPL, cricket, analytics, win predictor, stats, T20",
  openGraph: {
    title: "IPL Universe",
    description: "The Ultimate IPL Analytics Platform",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ParticleBackground />
        <Navbar />
        <main style={{ position: "relative", zIndex: 1 }}>{children}</main>
      </body>
    </html>
  );
}
