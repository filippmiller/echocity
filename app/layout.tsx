import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
  variable: '--font-manrope',
});
import { Toaster } from "@/components/ui/Toaster";
import { Navbar } from "@/components/Navbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ClientProviders } from "@/components/ClientProviders";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "ГдеСейчас — скидки рядом с вами",
  description: "Находите лучшие скидки в кафе, ресторанах и салонах вашего города. Активируйте через QR.",
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'ГдеСейчас — скидки рядом с вами',
    description: 'Находите скидки в кафе, ресторанах и салонах Санкт-Петербурга. Активируйте через QR и экономьте каждый день.',
    url: 'https://echocity.vsedomatut.com',
    siteName: 'ГдеСейчас',
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ГдеСейчас — скидки рядом с вами',
    description: 'Скидки в кафе, ресторанах и салонах Санкт-Петербурга',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={manrope.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#2563EB" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <ClientProviders>
          <ServiceWorkerRegistration />
          <Navbar />
          <div className="pb-safe md:pb-0">
            {children}
          </div>
          <MobileBottomNav />
          <Toaster />
        </ClientProviders>
      </body>
    </html>
  );
}
