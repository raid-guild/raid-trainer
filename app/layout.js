import { DM_Sans, Space_Grotesk } from "next/font/google";

import "./globals.css";

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"]
});

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"]
});

export const metadata = {
  title: "Coach Spike Dashboard",
  description: "Read-only personal trainer dashboard for a Pinata-hosted coaching agent."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable}`}>{children}</body>
    </html>
  );
}
