"use client";

/* ==========================================================================*/
// login-form.tsx — Client-side login form with error handling
/* ==========================================================================*/
// Purpose: Form component that handles login errors and displays them to users
// Sections: Imports, Component, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React core ---
import React, { useState } from "react";

// Local Modules ---
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";

// Actions ---
import { login } from "@/actions/auth";

/* ==========================================================================*/
// Main Component
/* ==========================================================================*/

/**
 * LoginForm
 *
 * Client-side login form that handles server action responses
 * and displays errors to the user.
 */
function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    try {
      setIsLoading(true);
      setError(null);
      const result = await login(formData);
      
      // If we get here, it means login failed (successful login would redirect)
      if (result?.message) {
        setError(result.message);
      }
    } catch (e: unknown) {
      console.error(e);
      // Check if this is a Next.js redirect (which is expected on successful login)
      if (e && typeof e === 'object' && 'digest' in e && typeof e.digest === 'string') {
        // This is a Next.js redirect, don't show error
        return;
      }
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Error Message Display --- */}
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Login Form --- */}
      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="Enter your email" 
            required 
            disabled={isLoading}
            className={isLoading ? "opacity-50 cursor-not-allowed" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            name="password" 
            type="password" 
            placeholder="Enter your password" 
            required 
            disabled={isLoading}
            className={isLoading ? "opacity-50 cursor-not-allowed" : ""}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
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

      {/* Footer Links --- */}
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
    </div>
  );
}

/* ==========================================================================*/
// Public Component Exports
/* ==========================================================================*/
export { LoginForm }; 