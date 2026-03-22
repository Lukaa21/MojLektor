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
  icons: {
    icon: "/mojlektor_logo_white_bg.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400;1,6..72,500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${jakarta.variable} ${newsreader.variable} antialiased`}
      >
        <TokenBalanceProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main style={{ flex: 1 }}>{children}</main>
            <footer
              style={{
                borderTop: "1px solid var(--border-light)",
                padding: "32px 24px",
                display: "flex",
                justifyContent: "center",
                gap: "32px",
                maxWidth: 960,
                margin: "0 auto",
                width: "100%",
              }}
            >
              <a
                href="/privacy-policy"
                style={{
                  color: "var(--text-muted)",
                  fontSize: 13,
                  textDecoration: "none",
                  fontWeight: 500,
                  transition: "color 0.2s",
                }}
              >
                Privatnost
              </a>
              <a
                href="/terms"
                style={{
                  color: "var(--text-muted)",
                  fontSize: 13,
                  textDecoration: "none",
                  fontWeight: 500,
                  transition: "color 0.2s",
                }}
              >
                Uslovi korišćenja
              </a>
            </footer>
          </div>
        </TokenBalanceProvider>
      </body>
    </html>
  );
}
