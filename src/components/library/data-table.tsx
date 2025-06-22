"use client";

/* ==========================================================================*/
// ArticleDataTable.tsx — Data table for ArticleMetadata list
/* ==========================================================================*/
// Purpose: Display a pageable, searchable, filterable list of ArticleMetadata
//          items using TanStack React-Table and shadcn/ui components.
// Sections: Imports, Types, Component, Helpers, Exports
/* ==========================================================================*/

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React core ---------------------------------------------------------------
import React from "react";
import { useRouter } from "next/navigation";

// External Packages --------------------------------------------------------
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, type ColumnFiltersState, type SortingState, type VisibilityState, useReactTable, ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";

// Local Modules ------------------------------------------------------------
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { ArticleMetadata } from "@/db/dal";
import { columns } from "./columns";

/* ==========================================================================*/
// Types
/* ==========================================================================*/

interface ArticleDataTableProps {
  /** Array of article metadata rows to render. */
  articles: ArticleMetadata[];
  totalCount: number;
}

/* ==========================================================================*/
// Component
/* ==========================================================================*/

/**
 * ArticleDataTable
 *
 * Reusable table for displaying a list of ArticleMetadata.
 * Provides client-side search, multi-column filters and pagination.
 *
 * @param articleMetadata - Raw rows to display
 */
function ArticleDataTable({ articles, totalCount }: ArticleDataTableProps) {
  const router = useRouter();

  /* -------------------------------- State -------------------------------- */
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  /* ---------------------------- Table instance --------------------------- */
  const table = useReactTable({
    data: articles,
    columns: columns as ColumnDef<ArticleMetadata>[],
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

  /* ----------------------- Derived values / helpers ---------------------- */

  // Memoised set of unique creators for the "Created By" filter.
  const uniqueCreators = React.useMemo(() => {
    const creators = new Set(articles.map((row) => row.createdByName).filter(Boolean));
    return Array.from(creators).sort();
  }, [articles]);

  // Handle row navigation on click.
  const handleRowClick = (row: ArticleMetadata, event: React.MouseEvent) => {
    // Prevent navigation if clicking on checkbox, input, button, or any interactive element
    const target = event.target as HTMLElement;
    const isInteractiveElement = (target instanceof HTMLInputElement && target.type === "checkbox") || target.tagName === "INPUT" || target.tagName === "BUTTON" || target.tagName === "A" || target.closest('input[type="checkbox"]') || target.closest("button") || target.closest("a");

    if (isInteractiveElement) {
      return;
    }

    router.push(`/article?slug=${encodeURIComponent(row.slug)}`);
  };

  /* ----------------------------- Render ---------------------------------- */

  return (
    <div className="w-full space-y-4">
      {/* Search bar */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search articles…" value={(table.getColumn("slug")?.getFilterValue() as string) ?? ""} onChange={(e) => table.getColumn("slug")?.setFilterValue(e.target.value)} className="pl-10 w-full" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        {/* Created-by filter */}
        <Select value={(table.getColumn("createdByName")?.getFilterValue() as string) ?? ""} onValueChange={(value) => table.getColumn("createdByName")?.setFilterValue(value === "all" ? "" : value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Creators" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Creators</SelectItem>
            {uniqueCreators.map((creator) => (
              <SelectItem key={creator} value={creator!}>
                {creator}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select value={(table.getColumn("status")?.getFilterValue() as string) ?? ""} onValueChange={(value) => table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data table */}
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader className="bg-gray-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} onClick={(event) => handleRowClick(row.original, event)} className="cursor-pointer hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No articles found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        {articles.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Showing {articles.length} of {totalCount} articles
          </div>
        )}
        <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
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

export { ArticleDataTable };
