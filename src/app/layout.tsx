import localFont from "next/font/local";
// import { Inter, Roboto, Source_Sans_3 } from "next/font/google";
import "./globals.css";

import LayoutComponent from './components/LayoutComponent';
import { AuthProvider } from "./context/auth";

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
         <AuthProvider> {/* Add the AuthProvider here */}
        <LayoutComponent>
          {children}
        </LayoutComponent>
        </AuthProvider>
      </body>
    </html>
  );
}
