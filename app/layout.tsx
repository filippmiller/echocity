import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/Toaster";
import { Navbar } from "@/components/Navbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ClientProviders } from "@/components/ClientProviders";

export const metadata: Metadata = {
  title: "ГдеСейчас — скидки рядом с вами",
  description: "Находите лучшие скидки в кафе, ресторанах и салонах вашего города. Активируйте через QR.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#2563EB" />
      </head>
      <body>
        <Navbar />
        <div className="pb-safe md:pb-0">
          {children}
        </div>
        <MobileBottomNav />
        <ClientProviders />
        <Toaster />
      </body>
    </html>
  );
}
