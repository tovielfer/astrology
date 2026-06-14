import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "מחולל דוחות מפת לידה",
  description: "יצירת דוחות מפת לידה אישיים בעברית",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "מפת לידה",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1030",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
