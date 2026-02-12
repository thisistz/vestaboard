import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vestaboard Quotes Sender",
  description: "Send scheduled quotes to Vestaboard from DailyScript or Rick & Morty sources."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
