import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import Navbar from "../components/Navbar";
import { TokenBalanceProvider } from "../context/TokenBalanceContext";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MojLektor",
  description: "AI lektura i korektura za balkanske jezike.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} ${plexMono.variable} antialiased`}
      >
        <TokenBalanceProvider>
          <div className="min-h-screen">
            <Navbar />
            {children}
          </div>
        </TokenBalanceProvider>
      </body>
    </html>
  );
}
