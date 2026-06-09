import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "מחולל דוחות מפת לידה",
  description: "MVP פנימי ליצירת דוחות PDF בעברית",
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
