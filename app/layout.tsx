import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/overlays/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Matrx DM",
  description: "Universal Messaging Platform by AI Matrx",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Matrx DM",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg-primary text-text-primary antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
