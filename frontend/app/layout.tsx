import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "American Airlines Card Risk — Sentra Demo",
  description: "American Airlines AAdvantage card agentic commerce risk demo",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
