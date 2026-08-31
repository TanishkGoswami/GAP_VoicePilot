import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Geist, Instrument_Serif } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-display',
  weight: '400',
  display: 'swap',
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

const arrayFont = localFont({
  src: "./fonts/Array-Regular.otf",
  variable: "--font-array",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GAP | VoicePilot",
  description: "Autonomous AI Voice Agents & Telephony Platform",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
};

import { DemoModalProvider } from "@/components/demo/GetDemoContext";

import MaintenanceGuard from "@/components/MaintenanceGuard";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable, instrumentSerif.variable, arrayFont.variable)} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for (let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${geist.className} ${geistMono.variable} ${arrayFont.variable} font-sans font-normal bg-white text-black min-h-screen antialiased`} suppressHydrationWarning>
        <DemoModalProvider>
          <MaintenanceGuard productKey="voice_pilot">
            {children}
          </MaintenanceGuard>
        </DemoModalProvider>
      </body>
    </html>
  );
}
