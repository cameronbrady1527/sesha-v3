"use client";

/* ==========================================================================*/
// verbatim-checkbox.tsx — Verbatim checkbox with copyright dialog (Unified version)
/* ==========================================================================*/
// Purpose: Checkbox that opens a copyright confirmation dialog before allowing selection
//          Adapts to both single-source (digest) and multi-source (aggregate) modes
// Sections: Imports, Props, Component, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React core ---
import React, { useState } from "react";

// shadcn/ui components ------------------------------------------------------
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// External ---------------------------------------------------------------
import { Info } from "lucide-react";

// Context -------------------------------------------------------------------
import { useArticleHandler } from "./article-handler-context";

/* ==========================================================================*/
// Props Interface
/* ==========================================================================*/

interface VerbatimCheckboxProps {
  sourceIndex: number;
}

/* ==========================================================================*/
// Main Component
/* ==========================================================================*/

function VerbatimCheckbox({ sourceIndex }: VerbatimCheckboxProps) {
  const { sources, mode, setSourceUsage } = useArticleHandler();
  
  // Move useState hook to the top before any conditional logic
  const [showDlg, setShowDlg] = useState(false);
  
  // Get the specific source data
  const source = sources[sourceIndex];
  if (!source) return null;
  
  const checked = source.usage.verbatim;
  
  // For multi mode, only the first source (index 0) can use verbatim
  const isDisabled = mode === 'multi' && sourceIndex !== 0;
  const isFirstSource = sourceIndex === 0;

  const handleToggle = (next: boolean) => {
    if (isDisabled) return; // Don't allow toggle if disabled
    
    if (next && !checked) {
      // wanting to turn ON → confirm first
      setShowDlg(true);
    } else if (!next) {
      setSourceUsage(sourceIndex, "verbatim", false);
    }
  };

  const confirmYes = () => {
    setShowDlg(false);
    setSourceUsage(sourceIndex, "verbatim", true);
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <Checkbox 
          className={`cursor-pointer ${isDisabled ? 'opacity-50' : ''}`}
          id={`use-verbatim-${sourceIndex}`} 
          checked={checked} 
          disabled={isDisabled}
          onCheckedChange={handleToggle} 
        />
        <div className="flex items-center gap-2">
          <Label htmlFor={`use-verbatim-${sourceIndex}`} className={`text-sm font-medium cursor-pointer ${isDisabled ? 'opacity-50' : ''}`}>
            Use Verbatim
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent>
              {mode === 'single' || isFirstSource ? (
                <p>Use this source&apos;s text verbatim in the {mode === 'single' ? 'digest' : 'aggregation'}</p>
              ) : (
                <p>Make this the first source to enable verbatim usage</p>
              )}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Dialog open={showDlg} onOpenChange={setShowDlg}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Use Verbatim - {mode === 'single' ? 'Source' : `Source ${sourceIndex + 1}`}</DialogTitle>
            <DialogDescription>
              Do you or your employer own or have licensed the copyright to this content from {mode === 'single' ? 'this source' : `Source ${sourceIndex + 1}`}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDlg(false)}>
              NO
            </Button>
            <Button onClick={confirmYes}>YES</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ==========================================================================*/
// Public Component Exports
/* ==========================================================================*/

export { VerbatimCheckbox }; 