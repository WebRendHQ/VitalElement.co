import type { Metadata } from "next";
import { ReactNode } from "react";
// Remove Footer import since we won't include it
// import Footer from "../components/Footer/Footer";

export const metadata: Metadata = {
  title: "Vital Elements | Immersive Therapeutic Experiences",
  description: "Discover a new dimension of wellness with Vital Elements. Our immersive pods and environments are designed to enhance your mental wellbeing.",
};

export default function LandingPagesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {/* NavBar is intentionally not included for landing pages */}
      <main>{children}</main>
      {/* Footer is intentionally not included for landing pages */}
    </>
  );
} 