'use client'

/* ==========================================================================*/
// page.tsx — Login page for user authentication
/* ==========================================================================*/
// Purpose: Form interface for user login with email and password using server actions
// Sections: Imports, Components, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React core ---
import React, { useState } from "react";

// Local Modules ---
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// Server Actions ---
import { login } from "@/actions/auth";
import Link from "next/link";

/* ==========================================================================*/
// Main Component
/* ==========================================================================*/

/**
 * LoginPage
 *
 * Login form component with server action integration
 */
function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    try {
      setIsLoading(true);
      setError(null);
      const result = await login(formData);
      
      if (result?.message) {
        setError(result.message);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Start of Header --- */}
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Enter your email and password to sign in</p>
      </div>
      {/* End of Header ---- */}

      {/* Start of Login Form --- */}
      <form action={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="Enter your email" required aria-invalid={false} aria-describedby={undefined} disabled={isLoading} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" placeholder="Enter your password" required aria-invalid={false} aria-describedby={undefined} disabled={isLoading} />
        </div>

        <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="mr-2">Signing in</span>
              <span className="animate-pulse">...</span>
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
      {/* End of Login Form ---- */}

      {/* Start of Footer Links --- */}
      <div className="space-y-2 text-center text-sm">
        <p className="text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline cursor-pointer">
            Sign up
          </Link>
        </p>
        <p>
          <Link href="/forgot-password" className="text-muted-foreground hover:underline cursor-pointer">
            Forgot your password?
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
export default LoginPage;
