/* ==========================================================================*/
// article-complete.tsx — Article completion email component
/* ==========================================================================*/
// Purpose: Renders a styled email notification when an article is completed
// Sections: Imports, Props, Component, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React Core ---
import * as React from "react";

// Next.js Core ---
// import Image from "next/image";

// Local UI Components ---
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/* ==========================================================================*/
// Props Interface
/* ==========================================================================*/

interface ArticleCompleteProps {
  name: string;
  slug: string;
  version: number;
  href: string;
}

/* ==========================================================================*/
// Component
/* ==========================================================================*/

export function ArticleComplete({ name, slug, version, href }: ArticleCompleteProps) {
  return (
    <div className="max-w-lg mx-auto bg-white">
      {/* Header with Logo */}
      <div className="text-center mb-6">
        Sesha
      </div>

      {/* Main Card */}
      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="p-0 space-y-6">
          {/* Article Completed Banner */}
          {/* <div className="bg-black text-white text-center py-3 px-6">
            <div className="text-lg font-bold">
              <span className="bg-yellow-400 text-black px-2 py-1 mr-2">ARTICLE</span>
              COMPLETED
            </div>
          </div> */}

          {/* Content */}
          <div className="space-y-4 px-4">
            {/* Greeting */}
            <p className="text-gray-700">Hi {name},</p>

            {/* Article completion message */}
            <p className="text-gray-700">
              Your <span className="font-medium">article</span> - &quot;{slug}&quot; version: {version} is now complete! This <span className="font-medium">article</span> is ready for your review.
            </p>

            {/* Review Button */}
            <div className="pt-4">
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 text-center" size="lg">
                <a href={href} target="_blank" rel="noopener noreferrer">
                  Review Article
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
