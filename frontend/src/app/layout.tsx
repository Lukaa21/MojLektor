import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Newsreader } from "next/font/google";
import Navbar from "../components/Navbar";
import { TokenBalanceProvider } from "../context/TokenBalanceContext";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
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
        className={`${jakarta.variable} ${newsreader.variable} antialiased`}
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
