import type { Metadata } from "next";
import "./globals.css";

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
      <body className="bg-ivory-50 text-charcoal-900 antialiased">{children}</body>
    </html>
  );
}
