import type { Metadata } from "next";
import { Great_Vibes } from "next/font/google";
import "./globals.css";

/** Fallback script until ED Lavonia woff2 is added to public/fonts/ */
const coupleFallback = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-couple-fallback",
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
        className={`${coupleFallback.variable} bg-ivory-50 text-charcoal-900 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
