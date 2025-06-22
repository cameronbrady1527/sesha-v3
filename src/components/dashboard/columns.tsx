/* ==========================================================================*/
// columns.tsx — Column defs for DashboardDataTable
/* ==========================================================================*/
// Purpose: Defines TanStack column configuration for organization dashboard rows
// Sections: Imports, Types, Column Definitions, Exports
/* ==========================================================================*/

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// External Packages --------------------------------------------------------
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

// Local Modules ------------------------------------------------------------
import { Button } from "@/components/ui/button";

/* ==========================================================================*/
// Types
/* ==========================================================================*/

export interface DashboardRowData {
  organizationName: string;
  totalRuns: number;
  totalCost: number;
  averageCostPerRun: number;
}

/* ==========================================================================*/
// Column Definitions
/* ==========================================================================*/

/** Compact, sortable column set for dashboard organization metrics. */
const columns: ColumnDef<DashboardRowData>[] = [
  /* --------------------------- Organization Name ------------------------- */
  {
    accessorKey: "organizationName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium"
      >
        Organization <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="truncate max-w-[250px] font-medium">
        {row.getValue<string>("organizationName")}
      </div>
    ),
    size: 280,
  },

  /* ----------------------------- Total Runs ----------------------------- */
  {
    accessorKey: "totalRuns",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium"
      >
        Total Runs <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-mono">
        {row.getValue<number>("totalRuns").toLocaleString()}
      </span>
    ),
    size: 120,
  },

  /* ----------------------------- Total Cost ----------------------------- */
  {
    accessorKey: "totalCost",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium"
      >
        Total Cost <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-green-600">
        ${row.getValue<number>("totalCost").toFixed(2)}
      </span>
    ),
    size: 130,
  },

  /* ------------------------ Average Cost Per Run ------------------------ */
  {
    accessorKey: "averageCostPerRun",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium"
      >
        Avg Cost/Run <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-blue-600">
        ${row.getValue<number>("averageCostPerRun").toFixed(4)}
      </span>
    ),
    size: 150,
  },
];

/* ==========================================================================*/
// Exports
/* ==========================================================================*/

export { columns }; 