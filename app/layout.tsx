import type { Metadata } from "next";
import { Onest } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";
import "./globals.css";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tanhwe Guest House",
  description: "Comfortable accommodation and conference facilities in Mukwe, Namibia.",
  icons: {
    icon: [
      { url: "/tanhwe-icon.webp", type: "image/webp" },
      { url: "/tanhwe-icon@2x.png", type: "image/png", sizes: "32x32" },
      { url: "/tanhwe-icon@3x.png", type: "image/png", sizes: "48x48" },
    ],
    shortcut: "/tanhwe-icon@2x.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${onest.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
