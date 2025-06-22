/* ==========================================================================*/
// layout.tsx — Auth layout with centered container
/* ==========================================================================*/
// Purpose: Provides consistent layout wrapper for authentication pages
// Sections: Imports, Props, Component, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React core ---
import React from "react"

// Next.js ---
import Image from "next/image"

/* ==========================================================================*/
// Props Interface
/* ==========================================================================*/
interface AuthLayoutProps {
  children: React.ReactNode
}

/* ==========================================================================*/
// Component
/* ==========================================================================*/

/**
 * AuthLayout
 *
 * Layout wrapper for authentication pages with centered container
 */
function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      {/* Start of Logo --- */}
      <div className="fixed top-6 left-6 z-10">
        <Image
          src="/sesha.png"
          alt="Sesha Logo"
          width={110}
          height={140}
          style={{
            height: "auto",
            width: "auto",
          }}
          priority
        />
      </div>
      {/* End of Logo ---- */}

      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}

/* ==========================================================================*/
// Public Component Exports
/* ==========================================================================*/
export default AuthLayout 