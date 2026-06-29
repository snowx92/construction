import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { ToastProvider } from "@/components/shared/toast-provider";
import { LocaleProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth-context";
import "@/styles/globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const thmanyah = localFont({
  variable: "--font-cairo",
  src: [
    { path: "../public/fonts/thmanyahsans-Light.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/thmanyahsans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/thmanyahsans-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/thmanyahsans-Bold.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/thmanyahsans-Black.woff2", weight: "900", style: "normal" },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Tender.ai", template: "%s — Tender.ai" },
  description: "AI-powered construction tender intelligence platform",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className={`${inter.variable} ${thmanyah.variable}`}>
      <body>
        <LocaleProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
