/* ==========================================================================*/
// page.tsx — Login page for user authentication
/* ==========================================================================*/
// Purpose: Server component that renders the login form interface
// Sections: Imports, Component, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// Local Modules ---
import { LoginForm } from "@/components/auth/login-form";

/* ==========================================================================*/
// Main Component
/* ==========================================================================*/

/**
 * LoginPage
 *
 * Server component that renders the login form with header
 */
async function LoginPage() {
  return (
    <div className="space-y-6">
      {/* Start of Header --- */}
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Enter your email and password to sign in</p>
      </div>
      {/* End of Header ---- */}

      {/* Login Form Component --- */}
      <LoginForm />
    </div>
  );
}

/* ==========================================================================*/
// Public Component Exports
/* ==========================================================================*/
export default LoginPage;
