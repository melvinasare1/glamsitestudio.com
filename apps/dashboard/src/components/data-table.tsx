"use client";

import * as React from "react";
import Link from "next/link";
import {
  columnVisibilityFeature,
  createColumnHelper,
  createPaginatedRowModel,
  flexRender,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { OrderStatusBadge } from "@/components/dashboard/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DashboardOrder } from "@/lib/overview";
import { shortOrderId } from "@/lib/orders";
import { Columns3Icon, ChevronDownIcon } from "lucide-react";

const features = tableFeatures({
  columnVisibilityFeature,
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

const columnHelper = createColumnHelper<typeof features, DashboardOrder>();

const columns = columnHelper.columns([
  columnHelper.accessor("id", {
    header: "Order",
    enableHiding: false,
    cell: ({ row }) => (
      <Link
        href={`/dashboard/orders/${row.original.id}`}
        className="font-mono text-xs tracking-wide text-ink-950 hover:underline"
      >
        #{shortOrderId(row.original.id)}
      </Link>
    ),
  }),
  columnHelper.accessor("buyer", {
    header: "Buyer",
    cell: ({ row }) => <span className="font-medium">{row.original.buyer}</span>,
  }),
  columnHelper.accessor("items", {
    header: "Items",
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.items}</span>,
  }),
  columnHelper.accessor("amount", {
    header: "Amount",
    cell: ({ row }) => <span className="font-tabular">{row.original.amount}</span>,
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
  }),
  columnHelper.accessor("date", {
    header: "Placed",
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.date}</span>,
  }),
]);

export function DataTable({ data }: { data: DashboardOrder[] }) {
  const [columnVisibility, setColumnVisibility] = React.useState<
    Record<string, boolean>
  >({});

  const table = useTable({
    features,
    data,
    columns,
    state: { columnVisibility, pagination: { pageIndex: 0, pageSize: 5 } },
    getRowId: (row) => row.id,
    onColumnVisibilityChange: setColumnVisibility,
  });

  return (
    <div className="flex w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label className="text-sm font-medium">Recent orders</Label>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/orders"
            className="text-sm text-muted-foreground hover:text-ink-950"
          >
            View all
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3Icon />
                Customize columns
                <ChevronDownIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {typeof column.columnDef.header === "string"
                      ? column.columnDef.header
                      : column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-xl border border-black/8 bg-white shadow-card">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-white">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-28 text-center">
                    <p className="text-sm font-medium text-ink-950">No orders yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      When a customer checks out on your storefront, their order will show up here.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {data.length > 0 ? (
          <p className="px-4 text-sm text-muted-foreground">
            Showing {data.length} recent order{data.length === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>
    </div>
  );
}
