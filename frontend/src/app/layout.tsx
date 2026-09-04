import type { Metadata } from "next";
import "./globals.css";
import React from "react";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "RazorRecover | AI Revenue Recovery System",
  description: "Detect payment failures, diagnose drop-offs, and recover revenue with autonomous agents. Built for Razorpay Buildathon.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50 text-slate-900 antialiased">
      <body className="h-full flex overflow-hidden font-sans bg-slate-50 text-slate-900">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </body>
    </html>
  );
}

