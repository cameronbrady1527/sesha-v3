'use client'

/* ==========================================================================*/
// page.tsx — Create organization page for new organization setup
/* ==========================================================================*/
// Purpose: Form interface for creating new organizations
// Sections: Imports, Component, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React core ---
import React, { useState } from "react"

// Local Modules ---
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

/* ==========================================================================*/
// Component
/* ==========================================================================*/

/**
 * CreateOrganizationPage
 *
 * Organization creation form component
 */
function CreateOrganizationPage() {
  const [orgName, setOrgName] = useState("")
  const [orgDescription, setOrgDescription] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminFirstName, setAdminFirstName] = useState("")
  const [adminLastName, setAdminLastName] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // TODO: Implement actual organization creation API call
      // const response = await createOrganization({
      //   orgName,
      //   orgDescription,
      //   adminUser: {
      //     email: adminEmail,
      //     firstName: adminFirstName,
      //     lastName: adminLastName,
      //     password: adminPassword
      //   }
      // })
      // 
      // if (response.success) {
      //   // Store organization data
      //   localStorage.setItem('organization', JSON.stringify({
      //     orgId: response.orgId,
      //     orgName,
      //     adminEmail
      //   }))
      //   
      //   // Navigate to confirmation or login
      //   router.push('/login')
      // }
      
      console.log("Organization creation attempted with:", {
        orgName,
        orgDescription,
        adminEmail,
        adminFirstName,
        adminLastName
      })
    } catch (error) {
      console.error("Organization creation error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = orgName && adminEmail && adminFirstName && adminLastName && adminPassword

  return (
    <div className="space-y-6">
      {/* Start of Header --- */}
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create Organization
        </h1>
        <p className="text-sm text-muted-foreground">
          Set up your organization and admin account
        </p>
      </div>
      {/* End of Header ---- */}

      {/* Start of Organization Form --- */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Organization Details */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              type="text"
              placeholder="Enter organization name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value.trim())}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orgDescription">Description (Optional)</Label>
            <Textarea
              id="orgDescription"
              placeholder="Brief description of your organization"
              value={orgDescription}
              onChange={(e) => setOrgDescription(e.target.value)}
              className="resize-none h-20"
            />
          </div>
        </div>

        {/* Admin User Details */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-medium">Admin Account</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adminFirstName">First Name</Label>
              <Input
                id="adminFirstName"
                type="text"
                placeholder="Admin first name"
                value={adminFirstName}
                onChange={(e) => setAdminFirstName(e.target.value.trim())}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminLastName">Last Name</Label>
              <Input
                id="adminLastName"
                type="text"
                placeholder="Admin last name"
                value={adminLastName}
                onChange={(e) => setAdminLastName(e.target.value.trim())}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminEmail">Admin Email</Label>
            <Input
              id="adminEmail"
              type="email"
              placeholder="Admin email address"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value.trim().toLowerCase())}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminPassword">Admin Password</Label>
            <Input
              id="adminPassword"
              type="password"
              placeholder="Create admin password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Password must be at least 8 characters with uppercase, lowercase, and number
            </p>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? "Creating organization..." : "Create Organization"}
        </Button>
      </form>
      {/* End of Organization Form ---- */}

      {/* Start of Footer Links --- */}
      <div className="space-y-2 text-center text-sm">
        <p className="text-muted-foreground">
          Already have an organization?{" "}
          <a href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </a>
        </p>
        <p>
          <a href="/register" className="text-muted-foreground hover:underline">
            Join existing organization
          </a>
        </p>
      </div>
      {/* End of Footer Links ---- */}
    </div>
  )
}

/* ==========================================================================*/
// Public Component Exports
/* ==========================================================================*/
export default CreateOrganizationPage 