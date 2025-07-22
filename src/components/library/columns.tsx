/* ==========================================================================*/
// columns.tsx — Column defs for ArticleDataTable
/* ==========================================================================*/
// Purpose: Defines TanStack column configuration for ArticleMetadata rows
// Sections: Imports, Column Definitions, Exports
/* ==========================================================================*/

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// External Packages --------------------------------------------------------
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

// Local Modules ------------------------------------------------------------
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ArticleMetadata } from "@/db/dal";

/* ==========================================================================*/
// Helper Components
/* ==========================================================================*/

interface CellTooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

/** Reusable tooltip for table cells with consistent styling */
function CellTooltip({ content, children, className = "" }: CellTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        sideOffset={0}
        className={`text-xs bg-card text-foreground border border-border shadow-md ${className}`}
      >
        <p className="whitespace-normal break-words">{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/* ==========================================================================*/
// Column Definitions
/* ==========================================================================*/

/** Compact, sortable column set for ArticleMetadata list‑view. */
const columns: ColumnDef<ArticleMetadata>[] = [
  /* ------------------------------ Select col ----------------------------- */
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(val) => table.toggleAllPageRowsSelected(!!val)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(val) => row.toggleSelected(!!val)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 42,
  },

  /* ----------------------------- Timestamp ----------------------------- */
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Timestamp <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue<Date>("createdAt"));
      return (
        <div className="text-sm text-center">
          <div>{date.toLocaleDateString()}</div>
          <div className="text-muted-foreground">{date.toLocaleTimeString()}</div>
        </div>
      );
    },
    size: 140,
  },

  /* -------------------------------- Slug -------------------------------- */
  {
    accessorKey: "slug",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Slug <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const slug = row.getValue<string>("slug");
      return (
        <div className="flex justify-center">
          <CellTooltip content={slug}>
            <div className="truncate max-w-[200px] font-medium">
              {slug}
            </div>
          </CellTooltip>
        </div>
      );
    },
    size: 220,
  },

  /* ------------------------------- Version ------------------------------ */
  {
    accessorKey: "version",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Ver <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-center">
        <span>{row.getValue<number>("version")}</span>
      </div>
    ),
    size: 60,
  },

  /* -------------------------------- Author ------------------------------ */
  {
    accessorKey: "createdByName",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Creator <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const createdByName = row.getValue<string>("createdByName") ?? "—";
      return (
        <div className="flex justify-center">
          <CellTooltip content={createdByName}>
            <div className="truncate max-w-[140px]">
              {createdByName}
            </div>
          </CellTooltip>
        </div>
      );
    },
    size: 150,
  },

  /* ------------------------------ Headline ------------------------------ */
  {
    accessorKey: "headline",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Headline <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const headline = row.getValue<string | null>("headline") ?? "—";
      return (
        <div className="flex justify-center">
          <CellTooltip content={headline}>
            <div className="truncate max-w-[400px]">
              {headline}
            </div>
          </CellTooltip>
        </div>
      );
    },
    size: 450,
  },

  /* ----------------------------- Source Type ---------------------------- */
  {
    accessorKey: "sourceType",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Source Type <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const sourceType = row.getValue<string>("sourceType") ?? "single";
      return (
        <div className="text-center">
          <span className="capitalize">{sourceType}</span>
        </div>
      );
    },
    size: 120,
  },

  /* -------------------------------- Status ------------------------------ */
  {
    accessorKey: "status",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium capitalize"
        >
          Status <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-center">
        <span className="capitalize">{row.getValue<string>("status")}</span>
      </div>
    ),
    size: 100,
  },
];

/* ==========================================================================*/
// Exports
/* ==========================================================================*/

export { columns };
