/* ==========================================================================*/
// layout.tsx — Root layout component for the Next.js application
/* ==========================================================================*/
// Purpose: Provides global layout structure and font configuration
// Sections: Imports, Fonts, Metadata, Component, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// Next.js core ---
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner"


// Local Modules ---
import "./globals.css";

/* ==========================================================================*/
// Font Configuration
/* ==========================================================================*/
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* ==========================================================================*/
// Metadata
/* ==========================================================================*/
const metadata: Metadata = {
  title: "Sesha Systems",
  description: "Sesha Systems",
};

/* ==========================================================================*/
// Props Interface
/* ==========================================================================*/
interface RootLayoutProps {
  children: React.ReactNode;
}

/* ==========================================================================*/
// Component
/* ==========================================================================*/

/**
 * RootLayout
 *
 * Root layout component that wraps all pages with sidebar provider and font configuration
 *
 * @param children - Child components to render within the layout
 */
function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

/* ==========================================================================*/
// Public API Exports
/* ==========================================================================*/
export { metadata };
export default RootLayout;
