import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ace Legacy Services - Dispatch & Freight Brokerage ERP",
  description: "Enterprise Logistics Management System for Freight Brokerage and Fleet Dispatching",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
