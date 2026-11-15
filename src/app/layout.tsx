import type { Metadata, Viewport } from "next";
import { Caveat, Nunito } from "next/font/google";
import { installScript } from "@/lib/install-prompt";
import { AntdProvider } from "./antd-provider";
import "./globals.css";

const body = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
});

const hand = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "Sproutly",
  description: "Track baby formula bottles and when they spoil",
  appleWebApp: { capable: true, title: "Sproutly", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fbfaf8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: installScript }} />
      </head>
      <body className={`${body.variable} ${hand.variable} antialiased`}>
        <AntdProvider>{children}</AntdProvider>
      </body>
    </html>
  );
}
