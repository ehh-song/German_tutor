import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deutsch Meister - German Learning App",
  description: "Learn German with AI-powered passages and exercises",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
