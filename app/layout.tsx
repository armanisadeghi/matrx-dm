import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Matrx DM",
  description: "Universal Messaging Platform by AI Matrx",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg-primary text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
