import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeSaaS",
  description: "Güvenli-varsayılanlı multi-tenant SaaS iskeleti",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
