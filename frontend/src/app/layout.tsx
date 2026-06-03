import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Camaleon",
  description: "Local, privacy-first file transmutation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
