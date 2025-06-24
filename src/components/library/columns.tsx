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
import { ArticleMetadata } from "@/db/dal";

/* ==========================================================================*/
// Column Definitions
/* ==========================================================================*/

/** Compact, sortable column set for ArticleMetadata list‑view. */
const columns: ColumnDef<ArticleMetadata>[] = [
  /* ------------------------------ Select col ----------------------------- */
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(val) => table.toggleAllPageRowsSelected(!!val)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(val) => row.toggleSelected(!!val)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 42,
  },

  /* ----------------------------- Timestamp ----------------------------- */
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium"
      >
        Timestamp <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue<Date>("createdAt"));
      return (
        <div className="text-sm">
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
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium"
      >
        Slug <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="truncate max-w-[200px] font-medium">
        {row.getValue<string>("slug")}
      </div>
    ),
    size: 220,
  },

  /* ------------------------------- Version ------------------------------ */
  {
    accessorKey: "version",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium"
      >
        Ver <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span>{row.getValue<number>("version")}</span>,
    size: 60,
  },

  /* -------------------------------- Author ------------------------------ */
  {
    accessorKey: "createdByName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium"
      >
        Creator <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="truncate max-w-[140px]">
        {row.getValue<string>("createdByName") ?? "—"}
      </div>
    ),
    size: 150,
  },

  /* ------------------------------ Headline ------------------------------ */
  {
    accessorKey: "headline",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium"
      >
        Headline <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="truncate max-w-[400px]">
        {row.getValue<string | null>("headline") ?? "—"}
      </div>
    ),
    size: 450,
  },

  /* -------------------------------- Status ------------------------------ */
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium capitalize"
      >
        Status <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="capitalize">{row.getValue<string>("status")}</span>
    ),
    size: 100,
  },
];

/* ==========================================================================*/
// Exports
/* ==========================================================================*/

export { columns };
