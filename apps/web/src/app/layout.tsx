import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-couple",
});

export const metadata: Metadata = {
  title: "Memopics",
  description: "Premium event memory platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} bg-ivory-50 text-charcoal-900 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
