import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SahajCredit — Credit for Real Lives",
  description: "Explainable, fair, reproducible credit underwriting platform for thin-file borrowers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
