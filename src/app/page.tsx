/* ==========================================================================*/
// page.tsx — Home page component with immediate redirect to digest
/* ==========================================================================*/
// Purpose: Redirect landing page traffic directly to digest functionality
// Sections: Imports, Component, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// Next.js core ---
import { redirect } from 'next/navigation'

/* ==========================================================================*/
// Component
/* ==========================================================================*/

/**
 * Home
 *
 * Landing page component that immediately redirects to the digest page
 */
function Home() {
  // Immediately redirect to digest page
  redirect('/digest')
}

/* ==========================================================================*/
// Public Component Exports
/* ==========================================================================*/
export default Home
