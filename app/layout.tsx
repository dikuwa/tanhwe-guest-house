import type { Metadata } from "next";
import { Allura, Onest } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
  display: "swap",
});

const allura = Allura({
  variable: "--font-allura",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tanhwe Guest House",
  description: "Comfortable accommodation and conference facilities in Mukwe, Namibia.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${onest.variable} ${allura.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster
          position="top-right"
          gutter={8}
          containerStyle={{
            top: 16,
            right: 16,
            left: 16,
          }}
          toastOptions={{
            duration: 4000,
            style: {
              maxWidth: "min(420px, calc(100vw - 32px))",
              fontSize: "0.875rem",
            },
            success: { duration: 3500, style: { background: "#059669", color: "#fff" } },
            error: { duration: 5000, style: { background: "#dc2626", color: "#fff" } },
          }}
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
