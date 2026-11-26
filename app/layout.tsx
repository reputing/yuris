import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "yuri.xxx", template: "%s · yuri.xxx" },
  description: "Adults only. Yuri first.",
  other: { rating: "RTA-5042-1996-1400-1577-RTA" },   // the adult-site label filtering software looks for
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
