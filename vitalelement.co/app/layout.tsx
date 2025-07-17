// import NavBar from "./components/BlenderPanel";
import NavBar from "./components/NavBar/NavBar";
// import Workspaces from "./components/Workspaces";
import Footer from "./components/Footer/Footer";
import ComingSoon from "./components/ComingSoon/ComingSoon";

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Vital Elements | Immersive Therapeutic Experiences",
  description: "Discover a new dimension of wellness with Vital Elements. Our immersive pods and environments are designed to enhance your mental wellbeing.",
};

// You can control the coming soon mode by setting this to false when ready to launch
const COMING_SOON_MODE = true;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased ${COMING_SOON_MODE ? 'overflow-hidden' : ''}`}
      >
        {!COMING_SOON_MODE && (
          <>
            <NavBar />
            {/* <Workspaces /> */}
            {children}
            <Footer />
          </>
        )}
        
        {COMING_SOON_MODE && (
          <ComingSoon />
        )}
      </body>
    </html>
  );
}