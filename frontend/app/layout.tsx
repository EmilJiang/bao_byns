import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "American Airlines Card Risk — Agent Guard Demo",
  description: "American Airlines AAdvantage card agentic commerce risk demo",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
