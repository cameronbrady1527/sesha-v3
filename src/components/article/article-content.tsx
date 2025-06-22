"use client";

/* ==========================================================================*/
// article-content.tsx — Article content display and editing component
/* ==========================================================================*/
// Purpose: Display and edit the main article content with expand/minimize
//          functionality, word counter, and save capabilities.
// Sections: Imports, Helper Functions, Component, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React core ----------------------------------------------------------------
import React, { useState } from "react";

// shadcn/ui components ------------------------------------------------------
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Icons ---------------------------------------------------------------------
import { Info, Maximize2, Minimize2 } from "lucide-react";

// Context -------------------------------------------------------------------
import { useArticle } from "./article-context";

/* ==========================================================================*/
// Helper Functions
/* ==========================================================================*/

// None needed - keeping it simple!

/* ==========================================================================*/
// Main Component
/* ==========================================================================*/

/**
 * ArticleContent
 *
 * Simple component that displays sentences from context joined with newlines.
 */
function ArticleContent() {
  const { currentArticle } = useArticle();
  const [expanded, setExpanded] = useState(false);

  // Get sentences and join with newlines
  const content = (() => {
    console.log("🔍 Content generation:", {
      hasCurrentArticle: !!currentArticle,
      sentences: currentArticle?.sentences,
      sentencesLength: currentArticle?.sentences?.length,
      content: currentArticle?.content,
      contentType: typeof currentArticle?.content,
      isContentArray: Array.isArray(currentArticle?.content)
    });

    // First, check if we have proper sentences field
    if (currentArticle?.sentences && Array.isArray(currentArticle.sentences) && currentArticle.sentences.length > 0) {
      console.log("✅ Using sentences field");
      return currentArticle.sentences.join('\n\n');
    } 
    // Next, check if content field contains sentences array (saved in wrong field)
    else if (currentArticle?.content && Array.isArray(currentArticle.content)) {
      console.log("✅ Using sentences from content field (migration needed)");
      return currentArticle.content.join('\n\n');
    }
    // If content is a string, use it
    else if (currentArticle?.content && typeof currentArticle.content === 'string') {
      console.log("⚠️ Using string content");
      return currentArticle.content;
    } 
    // If content is an object (Lexical state), show message
    else if (currentArticle?.content && typeof currentArticle.content === 'object') {
      console.log("⚠️ Content is object (Lexical state)");
      return "Content available but not in sentence format. Please regenerate this article.";
    } 
    else {
      console.log("❌ No content available");
      return '';
    }
  })();
  
  console.log("🔍 Final content:", content.substring(0, 100) + "...");
  const wordCount = content.trim() === "" ? 0 : content.trim().split(/\s+/).length;
  const maxWords = 50_000;

  const handleExpandToggle = () => setExpanded((p) => !p);

  /* -------------------------------- UI --------------------------------- */
  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-lg font-semibold">Article Content</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Article sentences, one per line.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {wordCount.toLocaleString()}/{maxWords.toLocaleString()} words
          </span>
        </div>
      </div>

      {/* Content Display */}
      <div className="relative">
        <Textarea
          id="article-content"
          value={content}
          readOnly
          placeholder="No sentences available."
          className={`w-full resize-none transition-all duration-200 ${
            expanded ? "min-h-[600px] max-h-[600px]" : "min-h-[400px] max-h-[400px]"
          }`}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExpandToggle}
          className="absolute top-2 right-2 h-6 w-6 p-0 bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer"
        >
          {expanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  );
}

/* ==========================================================================*/
// Public Component Exports
/* ==========================================================================*/

export default ArticleContent; 