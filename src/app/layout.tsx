import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import QueryProvider from "@/components/QueryProvider";
import { AppHeader } from "@/components/AppHeader";
import { AddTransactionFAB } from "@/components/AddTransactionFAB";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Money Tracker",
  description: "Money Tracker is a simple money tracking app that allows you to track your income and expenses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`bg-background text-foreground ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <div className="min-h-screen flex flex-col">
            <AppHeader />
            <main className="flex-1">
              {children}
            </main>
            <AddTransactionFAB />
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
