import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
// import { Inter, Roboto, Source_Sans_3 } from "next/font/google";
import "./globals.css";

import LayoutComponent from './components/LayoutComponent';
import { AuthProvider } from "./context/auth";
import PwaRegister from "./components/PwaRegister";

// PWA: installable app ("Add to Home screen" / "Install app")
export const metadata: Metadata = {
  title: "Omech Inventory",
  applicationName: "Omech Inventory",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "Omech", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1677ff",
};

// Local fonts
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Google fonts - commented out until we add the dependencies
// const inter = Inter({
//   subsets: ['latin'],
//   display: 'swap',
//   variable: '--font-inter',
// });

// const roboto = Roboto({
//   weight: ['300', '400', '500', '700'],
//   subsets: ['latin'],
//   display: 'swap',
//   variable: '--font-roboto',
// });

// const sourceSans = Source_Sans_3({
//   weight: ['300', '400', '600', '700'],
//   subsets: ['latin'],
//   display: 'swap',
//   variable: '--font-source-sans',
// });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
         <PwaRegister />
         <AuthProvider> {/* Add the AuthProvider here */}
        <LayoutComponent>
          {children}
        </LayoutComponent>
        </AuthProvider>
      </body>
    </html>
  );
}
