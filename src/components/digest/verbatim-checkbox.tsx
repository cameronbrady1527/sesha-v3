"use client";

/* ==========================================================================*/
// verbatim-checkbox.tsx — Verbatim checkbox with copyright dialog
/* ==========================================================================*/
// Purpose: Checkbox that opens a copyright confirmation dialog before allowing selection
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
import { useDigest } from "./digest-context";

/* ==========================================================================*/
// Types and Interfaces
/* ==========================================================================*/

/* ==========================================================================*/
// Main Component
/* ==========================================================================*/

function VerbatimCheckbox() {
  const { sourceUsage, setSourceUsage } = useDigest();
  const checked = sourceUsage.verbatim;

  const [showDlg, setShowDlg] = useState(false);

  const handleToggle = (next: boolean) => {
    if (next && !checked) {
      // wanting to turn ON → confirm first
      setShowDlg(true);
    } else if (!next) {
      setSourceUsage("verbatim", false);
    }
  };

  const confirmYes = () => {
    setShowDlg(false);
    setSourceUsage("verbatim", true);
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <Checkbox className="cursor-pointer" id="use-verbatim" checked={checked} onCheckedChange={handleToggle} />
        <div className="flex items-center gap-2">
          <Label htmlFor="use-verbatim" className="text-sm font-medium cursor-pointer">
            Use Verbatim
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Use the source content exactly as provided without modification</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Dialog open={showDlg} onOpenChange={setShowDlg}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Use Verbatim</DialogTitle>
            <DialogDescription>Do you or your employer own or have licensed the copyright to this content?</DialogDescription>
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
