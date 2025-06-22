"use client";

/* ==========================================================================*/
// DashboardDataTable.tsx — Data table for organization dashboard metrics
/* ==========================================================================*/
// Purpose: Display a pageable, searchable, filterable dashboard of organization
//          metrics using TanStack React-Table and shadcn/ui components.
// Sections: Imports, Types, Component, Helpers, Exports
/* ==========================================================================*/

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React core ---------------------------------------------------------------
import React from "react";

// External Packages --------------------------------------------------------
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";

// Local Modules ------------------------------------------------------------
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { DashboardRowData, columns } from "./columns";

/* ==========================================================================*/
// Types
/* ==========================================================================*/

interface DashboardDataTableProps {
  /** Array of dashboard row data to render. */
  data: DashboardRowData[];
  /** Available users for filtering. */
  availableUsers?: Array<{ id: string; name: string }>;
  /** Organization name for summary display. */
  organizationName?: string;
  /** Date range filter handlers */
  onDateRangeChange?: (fromDate: string, toDate: string) => void;
  /** User filter handler */
  onUserFilterChange?: (userId: string) => void;
  /** Length filter handler */
  onLengthFilterChange?: (length: string) => void;
}

/* ==========================================================================*/
// Component
/* ==========================================================================*/

/**
 * DashboardDataTable
 *
 * Reusable table for displaying organization dashboard metrics.
 * Provides client-side search, multi-column filters and pagination.
 *
 * @param data - Dashboard metrics to display
 * @param availableUsers - Users available for filtering
 * @param organizationName - Organization name for summary display
 * @param onDateRangeChange - Handler for date range filter changes
 * @param onUserFilterChange - Handler for user filter changes
 * @param onLengthFilterChange - Handler for length filter changes
 */
function DashboardDataTable({
  data,
  availableUsers = [],
  organizationName,
  onDateRangeChange,
  onUserFilterChange,
  onLengthFilterChange,
}: DashboardDataTableProps) {
  /* -------------------------------- State -------------------------------- */
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  // Filter states
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [selectedUser, setSelectedUser] = React.useState("");
  const [selectedLength, setSelectedLength] = React.useState("");

  /* ---------------------------- Table instance --------------------------- */
  const table = useReactTable({
    data,
    columns: columns as ColumnDef<DashboardRowData>[],
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  /* ----------------------- Event Handlers -------------------------------- */

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    if (onDateRangeChange) {
      onDateRangeChange(value, toDate);
    }
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    if (onDateRangeChange) {
      onDateRangeChange(fromDate, value);
    }
  };

  const handleUserFilterChange = (value: string) => {
    const userId = value === "all" ? "" : value;
    setSelectedUser(userId);
    if (onUserFilterChange) {
      onUserFilterChange(userId);
    }
  };

  const handleLengthFilterChange = (value: string) => {
    const length = value === "all" ? "" : value;
    setSelectedLength(length);
    if (onLengthFilterChange) {
      onLengthFilterChange(length);
    }
  };

  /* ----------------------------- Render ---------------------------------- */

  return (
    <div className="w-full space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Left side - User and Length filters */}
        <div className="flex items-center gap-3">
          {/* User filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">User:</label>
            <Select value={selectedUser} onValueChange={handleUserFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Length filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">Length:</label>
            <Select value={selectedLength} onValueChange={handleLengthFilterChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Lengths" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lengths</SelectItem>
                <SelectItem value="100-250">100-250</SelectItem>
                <SelectItem value="400-550">400-550</SelectItem>
                <SelectItem value="700-850">700-850</SelectItem>
                <SelectItem value="1000-1200">1000-1200</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right side - Date Range Filters */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Date Range:</label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => handleFromDateChange(e.target.value)}
            placeholder="From date"
            className="w-[140px]"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => handleToDateChange(e.target.value)}
            placeholder="To date"
            className="w-[140px]"
          />
        </div>
      </div>

      {/* Data table */}
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader className="bg-gray-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-center">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length && data.some(row => row.totalRuns > 0) ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-center">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No Runs Found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between py-4">
        {/* Summary text */}
        {organizationName && (
          <div className="text-sm text-muted-foreground">
            Showing dashboard metrics for {organizationName}
          </div>
        )}
        
        {/* Pagination buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================*/
// Exports
/* ==========================================================================*/

export { DashboardDataTable };
