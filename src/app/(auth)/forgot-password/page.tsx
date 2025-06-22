/* ==========================================================================*/
// page.tsx — Forgot password page for password reset
/* ==========================================================================*/
// Purpose: Form interface for initiating password reset process
// Sections: Imports, Component, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React core ---
import React from "react";

// Local Modules ---
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";

/* ==========================================================================*/
// Component
/* ==========================================================================*/

/**
 * ForgotPasswordPage
 *
 * Password reset request form component
 */
function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      {/* Start of Header --- */}
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Reset your password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we&apos;ll send you reset instructions
        </p>
      </div>
      {/* End of Header ---- */}

      {/* Start of Reset Form --- */}
      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email address"
            required
            aria-invalid={false}
            aria-describedby={undefined}
          />
        </div>

        <Button type="submit" className="w-full" disabled={false}>
          Send reset instructions
        </Button>
      </form>
      {/* End of Reset Form ---- */}

      {/* Start of Footer Links --- */}
      <div className="space-y-2 text-center text-sm">
        <p className="text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
        <p>
          <Link href="/register" className="text-muted-foreground hover:underline">
            Create new account
          </Link>
        </p>
      </div>
      {/* End of Footer Links ---- */}
    </div>
  );
}

/* ==========================================================================*/
// Public Component Exports
/* ==========================================================================*/
export default ForgotPasswordPage; 