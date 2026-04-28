import type { Metadata } from "next";
import { Syne, DM_Sans, DM_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Invoice Studio",
  description: "Professional GST invoice and purchase order generator for Indian businesses",
};

// Anti-FOUC: apply stored/system theme before first paint
const themeInitScript = `(function(){try{var s=localStorage.getItem('di_theme'),m=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s===null&&m)){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${syne.variable} ${dmSans.variable} ${dmMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
