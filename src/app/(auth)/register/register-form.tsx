"use client";

/* ==========================================================================*/
// register-form.tsx — Client-side registration form with error handling
/* ==========================================================================*/
// Purpose: Form component that handles validation errors and displays them to users
// Sections: Imports, Props, Component, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React core ---
import React, { useActionState } from "react";
import { useFormStatus } from "react-dom";

// Local Modules ---
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// External Packages -----
import { Info } from "lucide-react";

// Actions ---
import { signup } from "@/actions/auth";

/* ==========================================================================*/
// Props Interface
/* ==========================================================================*/

interface RegisterFormProps {
  orgId?: string;
}

/* ==========================================================================*/
// Submit Button Component
/* ==========================================================================*/

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating Account..." : "Create Account"}
    </Button>
  );
}

/* ==========================================================================*/
// Main Component
/* ==========================================================================*/

/**
 * RegisterForm
 *
 * Client-side registration form that handles server action responses
 * and displays validation errors to the user.
 */
function RegisterForm({ orgId }: RegisterFormProps) {
  const [state, formAction] = useActionState(signup, { errors: {}, message: "" });

  return (
    <div className="space-y-4">
      {/* Error Message Display --- */}
      {state?.message && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      {/* Registration Form --- */}
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="orgId" className="text-sm font-medium">Organization ID</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  The organization ID you belong to. This is provided by your administrator.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="orgId"
            name="orgId"
            type="text"
            placeholder="Enter organization ID"
            required
            defaultValue={orgId || ""}
            disabled={!!orgId}
            className={orgId ? "bg-muted" : ""}
            aria-invalid={!!state?.errors?.orgId}
            aria-describedby={state?.errors?.orgId ? "orgId-error" : undefined}
          />
          {state?.errors?.orgId && (
            <p id="orgId-error" className="text-sm text-destructive">
              {state.errors.orgId[0]}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="First name"
              required
              aria-invalid={!!state?.errors?.firstName}
              aria-describedby={state?.errors?.firstName ? "firstName-error" : undefined}
            />
            {state?.errors?.firstName && (
              <p id="firstName-error" className="text-sm text-destructive">
                {state.errors.firstName[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Last name"
              required
              aria-invalid={!!state?.errors?.lastName}
              aria-describedby={state?.errors?.lastName ? "lastName-error" : undefined}
            />
            {state?.errors?.lastName && (
              <p id="lastName-error" className="text-sm text-destructive">
                {state.errors.lastName[0]}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            required
            aria-invalid={!!state?.errors?.email}
            aria-describedby={state?.errors?.email ? "email-error" : undefined}
          />
          {state?.errors?.email && (
            <p id="email-error" className="text-sm text-destructive">
              {state.errors.email[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Create a password"
            required
            aria-invalid={!!state?.errors?.password}
            aria-describedby={state?.errors?.password ? "password-error" : undefined}
          />
          <p className="text-xs text-muted-foreground">
            Password must be at least 8 characters with uppercase, lowercase, and number
          </p>
          {state?.errors?.password && (
            <p id="password-error" className="text-sm text-destructive">
              {state.errors.password[0]}
            </p>
          )}
        </div>

        <SubmitButton />
      </form>
    </div>
  );
}

/* ==========================================================================*/
// Public Component Exports
/* ==========================================================================*/
export { RegisterForm }; 